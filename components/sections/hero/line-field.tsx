"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import {
  BASE_LINES,
  MAX_LINES,
  type AuditFinding,
  useHero,
} from "./hero-provider";

const FIELD_TOP = 0.18;
const FIELD_SPAN = 0.64;
const TRANSITION_START = 0.36;
const TRANSITION_END = 0.64;
const WAVE_AMPLITUDE = 20;
const WAVE_SPEED_MIN = 34;
const WAVE_SPEED_MAX = 58;
const WAVE_GENERATION_FADE_TIME = 0.34;
const SIGNAL_START = -0.045;
const SIGNAL_END = 1.055;
const MESSY_HALF_PROGRESS = 0.14;
const MESSY_END_PROGRESS = 0.34;
const SOLUTION_START_PROGRESS = 0.76;
const FLAW_FADE_IN_END = 0.035;
const CARD_GAP = 14;
const CONTENT_SAFETY_GAP = 18;
const CONTENT_FADE_DISTANCE = 56;
const SOLUTION_ZONE_START = 0.88;
const BASE_DOT_LINE_INDICES = [0, 1, 2, 3, 4, 5, 6, 7] as const;

const DARK_BACKGROUND = [22, 24, 28] as const;
const LIGHT_EMERALD = [5, 150, 105] as const;
const GREEN_GLOW = [16, 185, 129] as const;
const RED = [184, 46, 38] as const;
const AMBER = [157, 104, 29] as const;
const PRIMARY_GREEN = [47, 232, 92] as const;

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

interface SignalJourney {
  finding: AuditFinding;
  lineIndex: number;
  progress: number;
  timeline?: gsap.core.Timeline;
}

interface HorizontalBoundary {
  left: number;
  right: number;
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
    dotSpeed: 92 + (index % 4) * 9,
    hover: 0,
    hoverPush: 0,
  };
}

export function LineField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const notificationRefs = useRef(new Map<number, HTMLDivElement>());
  const journeysRef = useRef(new Map<number, SignalJourney>());
  const { activeFindings, motionRef, phase: auditPhase } = useHero();
  const auditPhaseRef = useRef(auditPhase);
  const reduced = useReducedMotion();

  useEffect(() => {
    const activeIds = new Set(activeFindings.map((finding) => finding.id));

    for (const [id, journey] of journeysRef.current) {
      if (activeIds.has(id)) continue;
      journey.timeline?.kill();
      gsap.killTweensOf(journey);
      journeysRef.current.delete(id);
    }

    for (const finding of activeFindings) {
      if (journeysRef.current.has(finding.id)) continue;
      const lineIndex = clamp(
        Math.round(
          ((finding.index + 0.5) / Math.max(finding.total, 1)) * BASE_LINES -
            0.5,
        ),
        0,
        BASE_LINES - 1,
      );
      const journey: SignalJourney = {
        finding,
        lineIndex,
        progress: reduced ? 0.78 : SIGNAL_START,
      };
      journeysRef.current.set(finding.id, journey);

      if (!reduced) {
        journey.timeline = gsap
          .timeline()
          .to(journey, {
            progress: MESSY_HALF_PROGRESS,
            duration: finding.messyHalfTime,
            ease: "none",
          })
          .to(journey, {
            progress: MESSY_END_PROGRESS,
            duration: finding.messyFinishTime,
            ease: "none",
          })
          .to(journey, {
            progress: SOLUTION_START_PROGRESS,
            duration: finding.centerCrossTime,
            ease: "none",
          })
          .to(journey, {
            progress: SIGNAL_END,
            duration: finding.rightTravelTime,
            ease: "none",
          });
      }
    }
  }, [activeFindings, reduced]);

  useEffect(() => {
    auditPhaseRef.current = auditPhase;
  }, [auditPhase]);

  useEffect(
    () => () => {
      for (const journey of journeysRef.current.values()) {
        journey.timeline?.kill();
        gsap.killTweensOf(journey);
      }
      journeysRef.current.clear();
    },
    [],
  );

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
    let nextBoundaryRead = 0;
    let contentBoundary: HorizontalBoundary = { left: 0, right: 0 };

    function fallbackBoundary(): HorizontalBoundary {
      return { left: width * 0.31, right: width * 0.69 };
    }

    function readBoundary(
      element: Element | null,
      canvasRect: DOMRect,
    ): HorizontalBoundary {
      if (!element) return fallbackBoundary();
      const rect = element.getBoundingClientRect();
      return {
        left: rect.left - canvasRect.left - CONTENT_SAFETY_GAP,
        right: rect.right - canvasRect.left + CONTENT_SAFETY_GAP,
      };
    }

    function updateContentBoundaries() {
      const canvasRect = canvas.getBoundingClientRect();
      contentBoundary = readBoundary(
        document.querySelector("[data-hero-content-boundary]"),
        canvasRect,
      );
    }

    function fit() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      currentWaveSpeed = clamp(width * 0.04, WAVE_SPEED_MIN, WAVE_SPEED_MAX);
      updateContentBoundaries();
      nextBoundaryRead = 0;
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
      const isAuditing = !["idle", "error"].includes(auditPhaseRef.current);
      context.clearRect(0, 0, width, height);
      for (const notification of notificationRefs.current.values()) {
        notification.style.opacity = "0";
      }
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
      currentWaveAmplitude = Math.min(WAVE_AMPLITUDE, lineGap * 0.3);
      if (isAuditing && timestamp >= nextBoundaryRead) {
        updateContentBoundaries();
        nextBoundaryRead = timestamp + 180;
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

        if (!reduced) {
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
          }
        }

        drawDot(line.dot, false);
      });

      for (const journey of journeysRef.current.values()) {
        const line = lines[Math.min(journey.lineIndex, activeCount - 1)];
        if (!line || line.alive < 0.01) continue;

        const dotProgress = journey.progress;
        const dx = dotProgress * width;
        const dy = yAt(line, dx);
        const progress = clamp(dotProgress, 0, 1);
        const colour = dotColour(progress);
        const pulse = 0.5 + Math.sin(animationTime * 2.15 + line.offset) * 0.5;
        const radius = 3.6 + smooth(progress) * 0.7;

        if (dx >= -28 && dx <= width + 28) {
          const tailLength = 30;
          const tailStart = Math.max(-20, dx - tailLength);
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
            `rgba(${Math.round(colour[0])},${Math.round(colour[1])},${Math.round(colour[2])},0.72)`,
          );

          context.save();
          context.beginPath();
          for (let x = tailStart; x <= dx; x += 2) {
            const y = yAt(line, x);
            if (x === tailStart) context.moveTo(x, y);
            else context.lineTo(x, y);
          }
          context.strokeStyle = tailGradient;
          context.lineWidth = 1.6;
          context.lineCap = "round";
          context.stroke();

          context.fillStyle = `rgb(${Math.round(colour[0])} ${Math.round(colour[1])} ${Math.round(colour[2])})`;
          context.shadowColor = `rgba(${Math.round(colour[0])},${Math.round(colour[1])},${Math.round(colour[2])},0.92)`;
          context.shadowBlur = 10;
          context.beginPath();
          context.arc(dx, dy, radius, 0, Math.PI * 2);
          context.fill();
          context.shadowBlur = 0;
          context.strokeStyle = "rgba(8,12,13,0.48)";
          context.lineWidth = 0.8;
          context.stroke();

          context.strokeStyle = `rgba(${Math.round(colour[0])},${Math.round(colour[1])},${Math.round(colour[2])},${0.34 + pulse * 0.3})`;
          context.lineWidth = 1;
          context.beginPath();
          context.arc(dx, dy, radius + 3.5 + pulse * 1.5, 0, Math.PI * 2);
          context.stroke();
          context.restore();
        }

        const notification = notificationRefs.current.get(journey.finding.id);
        if (!notification) continue;

        const boundary = contentBoundary;
        const cardWidth = Math.min(210, window.innerWidth * 0.54);
        const showingSolution = dx >= (boundary.left + boundary.right) / 2;
        const flawCardRight = dx + CARD_GAP + cardWidth;
        const flawBoundaryOpacity = smooth(
          clamp((boundary.left - flawCardRight) / CONTENT_FADE_DISTANCE, 0, 1),
        );
        const flawOpacity =
          smooth(
            clamp((dotProgress + 0.005) / (FLAW_FADE_IN_END + 0.005), 0, 1),
          ) * flawBoundaryOpacity;
        const solutionCardLeft = dx + CARD_GAP;
        const solutionBoundaryOpacity = smooth(
          clamp(
            (solutionCardLeft - boundary.right) / CONTENT_FADE_DISTANCE,
            0,
            1,
          ),
        );
        const solutionOpacity =
          solutionBoundaryOpacity *
          (1 - smooth(clamp((dotProgress - 1) / (SIGNAL_END - 1), 0, 1)));
        const opacity = showingSolution ? solutionOpacity : flawOpacity;
        const flawCard = notification.children.item(0) as HTMLElement | null;
        const solutionCard = notification.children.item(
          1,
        ) as HTMLElement | null;

        if (flawCard)
          flawCard.style.display = showingSolution ? "none" : "block";
        if (solutionCard)
          solutionCard.style.display = showingSolution ? "block" : "none";
        notification.style.opacity = `${opacity}`;
        notification.style.transform = showingSolution
          ? `translate3d(${dx}px, ${dy}px, 0) translate(${CARD_GAP}px, calc(-100% - 10px))`
          : `translate3d(${dx}px, ${dy}px, 0) translate(${CARD_GAP}px, -50%)`;
      }

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
    <div className="absolute inset-x-0 top-[76px] bottom-[32%] lg:top-[82px]">
      <canvas
        ref={canvasRef}
        aria-hidden
        className="absolute inset-0 z-[1] size-full"
      />
      {activeFindings.map((finding) => (
        <div
          key={finding.id}
          ref={(element) => {
            if (element) notificationRefs.current.set(finding.id, element);
            else notificationRefs.current.delete(finding.id);
          }}
          role="status"
          aria-live="polite"
          className="pointer-events-none absolute top-0 left-0 z-[3] w-[min(210px,54vw)] opacity-0 will-change-transform"
        >
          <div className="relative rounded-lg border border-[#b82e26]/35 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(248,244,242,0.91))] px-3 py-2 text-left text-[#9f241e] shadow-[0_12px_34px_rgba(88,34,29,0.14)] backdrop-blur-xl">
            <i
              aria-hidden
              className="absolute top-1/2 -left-1.5 size-2.5 -translate-y-1/2 rotate-45 border border-t-0 border-r-0 border-[#b82e26]/35 bg-[#fcf9f7] not-italic"
            />
            <span className="mb-0.5 flex items-center gap-1.5 font-mono text-[8px] font-semibold tracking-[0.14em] uppercase">
              <i
                aria-hidden
                className="size-1.5 shrink-0 rounded-full bg-[#b82e26] not-italic shadow-[0_0_9px_rgba(184,46,38,0.5)]"
              />
              Flaw detected
            </span>
            <p className="text-foreground text-[10px] leading-[1.3] font-medium sm:text-[11px]">
              {finding.problem}
            </p>
          </div>

          <div
            className="relative rounded-lg border border-[#159a55]/40 bg-[linear-gradient(135deg,rgba(247,255,249,0.97),rgba(233,249,239,0.92))] px-3 py-2 text-left text-[#087442] shadow-[0_12px_34px_rgba(8,116,66,0.14)] backdrop-blur-xl"
            style={{ display: "none" }}
          >
            <i
              aria-hidden
              className="absolute -bottom-1.5 left-3 size-2.5 rotate-45 border border-t-0 border-l-0 border-[#159a55]/40 bg-[#effaf2] not-italic"
            />
            <span className="mb-0.5 flex items-center gap-1.5 font-mono text-[8px] font-semibold tracking-[0.14em] uppercase">
              <i
                aria-hidden
                className="bg-brand size-1.5 shrink-0 rounded-full not-italic shadow-[0_0_9px_rgba(47,232,92,0.72)]"
              />
              Solution
            </span>
            <p className="text-foreground text-[10px] leading-[1.3] font-medium sm:text-[11px]">
              {finding.fix}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
