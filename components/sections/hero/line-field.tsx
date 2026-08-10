"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import {
  BASE_LINES,
  DOT_TRAVEL_TIME,
  MAX_LINES,
  useHero,
} from "./hero-provider";

// Eight or nine separate signal lanes: unsettled on the left, ordered on the right.
const FIELD_TOP = 0.31;
const FIELD_SPAN = 0.38;
const TRANSITION_START = 0.36;
const TRANSITION_END = 0.64;
const WAVE_AMPLITUDE = 20;
const WAVE_SPEED_MIN = 165;
const WAVE_SPEED_MAX = 295;
const WAVE_GENERATION_FADE_TIME = 0.34;
const FLAW_ZONE_START = 0.01;
const FLAW_ZONE_END = 0.075;
const FLAW_START = 0.018;
const FLAW_ANCHOR = 0.055;
const FLAW_DRIFT_SPEED = 0.019;
const SOLUTION_ZONE_START = 0.88;
const SOLUTION_ANCHOR = 0.91;
const SOLUTION_TRAVEL_SPEED =
  (SOLUTION_ZONE_START - FLAW_ANCHOR) / DOT_TRAVEL_TIME;
const BASE_DOT_LINE_INDICES = [0, 1, 2, 3, 4, 5, 6, 7] as const;

const DARK_BACKGROUND = [22, 24, 28] as const;
const LIGHT_EMERALD = [5, 150, 105] as const;
const GREEN_GLOW = [16, 185, 129] as const;
const RED = [184, 46, 38] as const;
const AMBER = [157, 104, 29] as const;
const PRIMARY_GREEN = [47, 232, 92] as const; // GD primary: #2FE85C

const clamp = (value: number, min: number, max: number) =>
  value < min ? min : value > max ? max : value;
const smooth = (t: number) => t * t * (3 - 2 * t);
const mix = (from: number, to: number, t: number) => from + (to - from) * t;
const mixRgb = (
  from: readonly [number, number, number],
  to: readonly [number, number, number],
  t: number,
) =>
  [
    mix(from[0], to[0], t),
    mix(from[1], to[1], t),
    mix(from[2], to[2], t),
  ] as const;

interface Line {
  offset: number;
  sourceDelay: number;
  wavePhase: number;
  waveScale: number;
  width: number;
  tint: number;
  messyBase: number;
  orderedBase: number;
  alive: number;
  dot: number;
  dotSpeed: number;
  hover: number;
  hoverPush: number;
}

function makeLine(index: number): Line {
  return {
    offset: index * 1.73,
    sourceDelay: index * 0.105,
    wavePhase: index * 0.87,
    waveScale: 0.94 + (index % 4) * 0.045,
    width: 1.25,
    tint: 0.28 + ((index * 19) % 53) / 100,
    messyBase: 0,
    orderedBase: 0,
    alive: index < BASE_LINES ? 1 : 0,
    dot: (0.06 + index * 0.137) % 1,
    dotSpeed: 190 + (index % 4) * 15,
    hover: 0,
    hoverPush: 0,
  };
}

export function LineField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const { activeFinding, motionRef, phase: auditPhase } = useHero();
  const activeFindingRef = useRef(activeFinding);
  const auditPhaseRef = useRef(auditPhase);
  const reduced = useReducedMotion();

  useEffect(() => {
    activeFindingRef.current = activeFinding;
  }, [activeFinding]);

  useEffect(() => {
    auditPhaseRef.current = auditPhase;
  }, [auditPhase]);

  useEffect(() => {
    const canvasElement = canvasRef.current;
    if (!canvasElement) return;
    const drawingContext = canvasElement.getContext("2d");
    if (!drawingContext) return;
    const canvas: HTMLCanvasElement = canvasElement;
    const context: CanvasRenderingContext2D = drawingContext;

    const lines = Array.from({ length: MAX_LINES }, (_, index) =>
      makeLine(index),
    );
    let width = 0;
    let height = 0;
    let animationTime = 0;
    let currentWaveAmplitude = WAVE_AMPLITUDE;
    let currentWaveSpeed = WAVE_SPEED_MIN;
    let frame = 0;
    let lastFrameTime = 0;
    let pointerX = -9999;
    let pointerY = -9999;
    let pointerTargetX = -9999;
    let pointerTargetY = -9999;
    let pointerVelocityY = 0;
    let pointerActive = false;
    let inView = true;
    let trackedFindingId = -1;
    let trackedLineIndex = -1;
    let trackedDotProgress = FLAW_START;

    function fit() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      currentWaveSpeed = clamp(width * 0.105, WAVE_SPEED_MIN, WAVE_SPEED_MAX);
    }

    function orderAt(x: number) {
      const n = x / Math.max(width, 1);
      const resolveShift = motionRef.current.resolve * 0.035;
      return smooth(
        clamp(
          (n - (TRANSITION_START - resolveShift)) /
            (TRANSITION_END - TRANSITION_START),
          0,
          1,
        ),
      );
    }

    function yAt(line: Line, x: number) {
      const order = orderAt(x);
      const chaos = motionRef.current.chaos;
      const amplitude =
        (currentWaveAmplitude + chaos * 2.5) * Math.pow(1 - order, 1.65);
      const generation = reduced
        ? 1
        : smooth(
            clamp(
              (animationTime - line.sourceDelay) / WAVE_GENERATION_FADE_TIME,
              0,
              1,
            ),
          );
      const waveLength = clamp(width * 0.15, 86, 220) * line.waveScale;
      const waveFrequency = (Math.PI * 2) / waveLength;
      const travel = reduced ? 0 : animationTime * currentWaveSpeed;
      const primaryPhase = (x - travel) * waveFrequency + line.wavePhase;
      const waves = Math.sin(primaryPhase) * amplitude * generation;
      const hoverRadius = width < 700 ? 170 : 280;
      const pointerDistance = (x - pointerX) / hoverRadius;
      const interactionStrength = mix(1, 0.08, order);
      const hoverEnvelope =
        line.hover > 0.001
          ? Math.exp(-pointerDistance * pointerDistance * 1.55) *
            interactionStrength
          : 0;
      const ripple =
        Math.sin((x - pointerX) * 0.018 - animationTime * 3) * line.hover * 2.6;

      return (
        mix(line.messyBase, line.orderedBase, order) +
        waves +
        (line.hoverPush + ripple) * hoverEnvelope
      );
    }

    function lineColour(line: Line, progress: number, alpha: number) {
      const ordered = smooth(clamp((progress - 0.34) / 0.42, 0, 1));
      const left = mixRgb(
        DARK_BACKGROUND,
        LIGHT_EMERALD,
        0.18 + line.tint * 0.18,
      );
      const right = mixRgb(GREEN_GLOW, PRIMARY_GREEN, 0.16 + line.tint * 0.18);
      const colour = mixRgb(left, right, ordered);
      const safeAlpha = Number.isFinite(alpha) ? clamp(alpha, 0, 1) : 0;
      return `rgba(${Math.round(colour[0])},${Math.round(colour[1])},${Math.round(colour[2])},${safeAlpha})`;
    }

    function dotColour(progress: number) {
      const colour =
        progress < 0.5
          ? mixRgb(RED, AMBER, smooth(progress * 2))
          : mixRgb(
              AMBER,
              PRIMARY_GREEN,
              smooth(
                clamp((progress - 0.5) / (SOLUTION_ZONE_START - 0.5), 0, 1),
              ),
            );
      return colour;
    }

    function draw(timestamp: number) {
      frame = 0;
      if (!inView) return;
      const deltaSeconds = lastFrameTime
        ? clamp((timestamp - lastFrameTime) / 1000, 0, 0.05)
        : 1 / 60;
      lastFrameTime = timestamp;
      const motion = motionRef.current;
      const finding = activeFindingRef.current;
      const isAuditing = !["idle", "error"].includes(auditPhaseRef.current);
      const notification = notificationRef.current;
      context.clearRect(0, 0, width, height);
      if (notification) notification.style.opacity = "0";
      if (!reduced) animationTime += deltaSeconds * (1 + motion.chaos * 0.28);
      if (pointerActive) {
        const previousY = pointerY;
        pointerX += (pointerTargetX - pointerX) * 0.075;
        pointerY += (pointerTargetY - pointerY) * 0.075;
        pointerVelocityY =
          pointerVelocityY * 0.82 + (pointerY - previousY) * 0.18;
      } else {
        pointerVelocityY *= 0.88;
      }

      const activeCount = Math.max(2, Math.round(motion.activeLines));
      const lineGap = (height * FIELD_SPAN) / Math.max(1, activeCount - 1);
      // Even opposite wave peaks retain a visible gap between adjacent lanes.
      currentWaveAmplitude = Math.min(WAVE_AMPLITUDE, lineGap * 0.3);

      if (!finding) {
        trackedFindingId = -1;
        trackedLineIndex = -1;
      } else if (finding.id !== trackedFindingId) {
        trackedFindingId = finding.id;

        if (finding.tone === "bad") {
          trackedLineIndex =
            (Math.floor(activeCount / 2) + finding.index * 2) % activeCount;
          trackedDotProgress = FLAW_START;
        } else if (reduced && trackedLineIndex >= 0) {
          trackedDotProgress = SOLUTION_ANCHOR;
        }
      }

      lines.forEach((line, index) => {
        const live = index < activeCount ? 1 : 0;
        line.alive += (live - line.alive) * 0.055;
        if (line.alive < 0.01) return;

        const messyTarget = height * FIELD_TOP + index * lineGap;
        const orderedTarget = messyTarget;
        line.messyBase = line.messyBase
          ? line.messyBase + (messyTarget - line.messyBase) * 0.07
          : messyTarget;
        line.orderedBase = line.orderedBase
          ? line.orderedBase + (orderedTarget - line.orderedBase) * 0.07
          : orderedTarget;

        const canDisturb = pointerActive;
        const lineAtPointer = yAt(line, clamp(pointerX, 0, width));
        const pointerGap = Math.abs(lineAtPointer - pointerY);
        const hoverTarget = canDisturb
          ? smooth(clamp(1 - pointerGap / 82, 0, 1))
          : 0;
        const pushDirection = lineAtPointer >= pointerY ? 1 : -1;
        const pushTarget = clamp(
          pushDirection * hoverTarget * 14 + pointerVelocityY * hoverTarget,
          -22,
          22,
        );
        line.hover +=
          (hoverTarget - line.hover) * (hoverTarget > line.hover ? 0.08 : 0.04);
        line.hoverPush += (pushTarget - line.hoverPush) * 0.055;

        const pulse = 0.5 + Math.sin(animationTime * 3 + line.offset) * 0.5;
        const verticalProgress =
          activeCount > 1 ? index / (activeCount - 1) : 0.5;
        const verticalWave = Math.max(0, Math.sin(verticalProgress * Math.PI));
        const lineStrength = 0.18 + Math.pow(verticalWave, 0.9) * 0.82;
        const gradient = context.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(
          0,
          lineColour(line, 0, 0.5 * line.alive * lineStrength),
        );
        gradient.addColorStop(
          0.28,
          lineColour(line, 0.28, 0.58 * line.alive * lineStrength),
        );
        gradient.addColorStop(
          0.42,
          lineColour(line, 0.42, 0.23 * line.alive * lineStrength),
        );
        gradient.addColorStop(
          0.58,
          lineColour(line, 0.58, 0.2 * line.alive * lineStrength),
        );
        gradient.addColorStop(
          0.74,
          lineColour(line, 0.74, 0.64 * line.alive * lineStrength),
        );
        gradient.addColorStop(
          1,
          lineColour(
            line,
            1,
            (0.52 + pulse * 0.04) * line.alive * lineStrength,
          ),
        );

        function strokeSegment(from: number, to: number) {
          context.beginPath();
          for (let x = from; x <= to; x += 4) {
            const y = yAt(line, x);
            if (x === from) context.moveTo(x, y);
            else context.lineTo(x, y);
          }
          context.save();
          context.lineCap = "round";
          context.lineJoin = "round";
          context.strokeStyle = `rgba(5,150,105,${clamp(0.075 * lineStrength, 0, 1)})`;
          context.lineWidth = line.width + 1.25;
          context.shadowColor = "rgba(16,185,129,0.26)";
          context.shadowBlur = 4 + pulse * 2 + motion.resolve * 2;
          context.stroke();
          context.shadowBlur = 0;
          context.strokeStyle = gradient;
          context.lineWidth = line.width + motion.resolve * 0.3;
          context.stroke();

          if (!reduced) {
            context.setLineDash([18, Math.max(150, width * 0.14)]);
            context.lineDashOffset =
              -animationTime * currentWaveSpeed * 1.15 - index * 24;
            context.strokeStyle = `rgba(47,232,92,${clamp(0.16 * lineStrength * line.alive, 0, 0.2)})`;
            context.lineWidth = 0.9;
            context.shadowColor = "rgba(47,232,92,0.34)";
            context.shadowBlur = 5;
            context.stroke();
          }
          context.restore();
        }

        strokeSegment(0, width);

        if (motion.resolve > 0.01) {
          const orderedStart = width * TRANSITION_END;
          context.beginPath();
          for (let x = orderedStart; x <= width; x += 4) {
            const y = yAt(line, x);
            if (x === orderedStart) context.moveTo(x, y);
            else context.lineTo(x, y);
          }
          context.save();
          context.lineCap = "round";
          context.strokeStyle = `rgba(47,232,92,${clamp(0.14 * motion.resolve * lineStrength * line.alive, 0, 0.18)})`;
          context.lineWidth = line.width + 1.6;
          context.shadowColor = "rgba(47,232,92,0.4)";
          context.shadowBlur = 8;
          context.stroke();
          context.restore();
        }

        const showsDot = isAuditing
          ? index < activeCount
          : BASE_DOT_LINE_INDICES.some((lineIndex) => lineIndex === index);
        if (!showsDot) return;

        const trackedFinding = index === trackedLineIndex ? finding : null;

        if (!reduced) {
          // Normal dots only ever advance. They wrap after leaving the right edge.
          line.dot +=
            (line.dotSpeed / Math.max(width, 1)) *
            deltaSeconds *
            (1 + motion.resolve * 0.3);
          if (line.dot > 1.08) line.dot = -0.06;
        }

        function drawDot(dotProgress: number, tracked: boolean) {
          const dx = dotProgress * width;
          if (dx < -10 || dx > width + 10) return;
          const dy = yAt(line, dx);
          const progress = clamp(dotProgress, 0, 1);
          const colour = dotColour(progress);
          const radius = 2.9 + smooth(progress) * 0.65 + motion.resolve * 0.3;

          if (!reduced) {
            const tailLength = tracked ? 15 : 24;
            const tailStart = Math.max(0, dx - tailLength);
            if (tailStart < dx) {
              const tailGradient = context.createLinearGradient(
                tailStart,
                0,
                dx,
                0,
              );
              tailGradient.addColorStop(
                0,
                `rgba(${Math.round(colour[0])},${Math.round(colour[1])},${Math.round(colour[2])},0)`,
              );
              tailGradient.addColorStop(
                1,
                `rgba(${Math.round(colour[0])},${Math.round(colour[1])},${Math.round(colour[2])},0.5)`,
              );
              context.save();
              context.beginPath();
              for (let x = tailStart; x <= dx; x += 2) {
                const y = yAt(line, x);
                if (x === tailStart) context.moveTo(x, y);
                else context.lineTo(x, y);
              }
              context.strokeStyle = tailGradient;
              context.lineWidth = 1.4;
              context.lineCap = "round";
              context.stroke();
              context.restore();
            }
          }

          context.save();
          context.fillStyle = `rgba(${Math.round(colour[0])},${Math.round(colour[1])},${Math.round(colour[2])},${clamp(0.96 * line.alive, 0, 1)})`;
          context.shadowColor = `rgba(${Math.round(colour[0])},${Math.round(colour[1])},${Math.round(colour[2])},0.88)`;
          context.shadowBlur = 7 + progress * 2;
          context.beginPath();
          context.arc(dx, dy, radius, 0, Math.PI * 2);
          context.fill();
          context.shadowBlur = 0;
          context.strokeStyle = "rgba(8,12,13,0.42)";
          context.lineWidth = 0.75;
          context.stroke();
          context.restore();

          if (tracked) {
            context.save();
            context.strokeStyle = `rgba(${Math.round(colour[0])},${Math.round(colour[1])},${Math.round(colour[2])},${0.34 + pulse * 0.24})`;
            context.lineWidth = 1;
            context.beginPath();
            context.arc(dx, dy, radius + 3 + pulse * 1.5, 0, Math.PI * 2);
            context.stroke();
            context.restore();

            if (trackedFinding && notification) {
              const inNotificationZone =
                trackedFinding.visible &&
                (trackedFinding.tone === "bad"
                  ? progress >= FLAW_ZONE_START && progress <= FLAW_ZONE_END
                  : progress >= SOLUTION_ZONE_START);
              notification.style.setProperty("--signal-x", `${dx}px`);
              notification.style.setProperty("--signal-y", `${dy}px`);
              notification.style.opacity = inNotificationZone ? "1" : "0";
            }
          }
        }

        drawDot(line.dot, false);

        if (trackedFinding) {
          if (!reduced) {
            trackedDotProgress =
              trackedFinding.tone === "bad"
                ? Math.min(
                    trackedDotProgress + FLAW_DRIFT_SPEED * deltaSeconds,
                    FLAW_ANCHOR,
                  )
                : Math.min(
                    trackedDotProgress + SOLUTION_TRAVEL_SPEED * deltaSeconds,
                    SOLUTION_ANCHOR,
                  );
          }
          drawDot(trackedDotProgress, true);
        }
      });

      if (inView) frame = requestAnimationFrame(draw);
    }

    function onPointerMove(event: PointerEvent) {
      const rect = canvas.getBoundingClientRect();
      const nextX = event.clientX - rect.left;
      const nextY = event.clientY - rect.top;
      const nextActive = nextX >= 0 && nextX <= width;
      if (nextActive && !pointerActive) {
        pointerX = nextX;
        pointerY = nextY;
      }
      pointerTargetX = nextX;
      pointerTargetY = nextY;
      pointerActive = nextActive;
    }

    function onPointerLeave() {
      pointerActive = false;
      pointerTargetX = -9999;
      pointerTargetY = -9999;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const nextInView = entry.isIntersecting;
        if (nextInView === inView) return;
        inView = nextInView;
        if (inView && frame === 0) frame = requestAnimationFrame(draw);
        if (!inView && frame !== 0) {
          cancelAnimationFrame(frame);
          frame = 0;
        }
      },
      { rootMargin: "180px 0px" },
    );

    fit();
    observer.observe(canvas);
    frame = requestAnimationFrame(draw);
    window.addEventListener("resize", fit);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerleave", onPointerLeave);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", fit);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);
    };
  }, [motionRef, reduced]);

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden
        className="absolute inset-0 z-[1] size-full"
      />
      <div
        ref={notificationRef}
        role="status"
        aria-live={activeFinding?.visible ? "polite" : "off"}
        className={`bg-background/94 pointer-events-none absolute top-0 left-0 z-[3] rounded-xl border px-3.5 py-3 text-left opacity-0 shadow-[0_16px_42px_rgba(20,23,26,0.16)] backdrop-blur-xl transition-opacity duration-200 ${
          activeFinding?.tone === "ok"
            ? "border-brand/45 text-accent w-[min(230px,58vw)]"
            : "w-[min(190px,52vw)] border-[#b82e26]/35 text-[#9f241e]"
        }`}
        style={{
          transform:
            activeFinding?.tone === "ok"
              ? "translate3d(var(--signal-x, 0px), var(--signal-y, 0px), 0) translate(calc(-100% - 14px), -50%)"
              : "translate3d(var(--signal-x, 0px), var(--signal-y, 0px), 0) translate(14px, -50%)",
        }}
      >
        <i
          aria-hidden
          className={`bg-background absolute top-1/2 size-2.5 -translate-y-1/2 rotate-45 border not-italic ${
            activeFinding?.tone === "ok"
              ? "border-brand/45 -right-1.5 border-b-0 border-l-0"
              : "-left-1.5 border-t-0 border-r-0 border-[#b82e26]/35"
          }`}
        />
        <span className="mb-1.5 flex items-center justify-between gap-3 font-mono text-[9px] font-semibold tracking-[0.14em] uppercase">
          <span className="flex items-center gap-2">
            <i
              aria-hidden
              className={`size-1.5 rounded-full not-italic ${
                activeFinding?.tone === "ok"
                  ? "bg-brand shadow-[0_0_10px_rgba(47,232,92,0.75)]"
                  : "bg-[#b82e26] shadow-[0_0_10px_rgba(184,46,38,0.48)]"
              }`}
            />
            {activeFinding?.tone === "ok" ? "Solution" : "Flaw detected"}
          </span>
        </span>
        <p className="text-foreground text-[12px] leading-[1.35] font-medium">
          {activeFinding?.label ?? ""}
        </p>
      </div>
    </>
  );
}
