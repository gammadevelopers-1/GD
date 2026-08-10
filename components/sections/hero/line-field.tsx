"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { BASE_LINES, MAX_LINES, useHero } from "./hero-provider";

// Both sides share one baseline grid: clean waves feed aligned output lines.
const FIELD_TOP = 0.34;
const FIELD_SPAN = 0.3;
const LEFT_FIELD_END = 0.3;
const RIGHT_FIELD_START = 0.7;
const TRANSITION_START = LEFT_FIELD_END + 0.025;
const TRANSITION_END = RIGHT_FIELD_START - 0.025;
const EMPHASIZED_LINE_COUNT = 4;

const PINE = [5, 43, 30] as const;
const FOREST = [3, 72, 47] as const;
const EMERALD = [6, 105, 66] as const;
const RED = [184, 46, 38] as const;
const AMBER = [157, 104, 29] as const;
const GREEN = [7, 147, 91] as const;

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
  amp: number;
  f1: number;
  f2: number;
  speed: number;
  offset: number;
  width: number;
  tint: number;
  messyBase: number;
  orderedBase: number;
  alive: number;
  dot: number;
  dotSpeed: number;
  showsDot: boolean;
  hover: number;
  hoverPush: number;
}

function makeLine(index: number): Line {
  return {
    amp: 13 + Math.random() * 7,
    f1: 0.04 + Math.random() * 0.009,
    f2: 0.079 + Math.random() * 0.01,
    speed: 0.18 + Math.random() * 0.14,
    offset: Math.random() * 99,
    width: 1.1 + Math.random() * 1.05,
    tint: 0.2 + Math.random() * 0.8,
    messyBase: 0,
    orderedBase: 0,
    alive: index < BASE_LINES ? 1 : 0,
    dot: Math.random(),
    dotSpeed: 0.055 + Math.random() * 0.025,
    showsDot: index === 1 || index === 4 || index === 6,
    hover: 0,
    hoverPush: 0,
  };
}

export function LineField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { motionRef } = useHero();
  const reduced = useReducedMotion();

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
    let phase = 0;
    let frame = 0;
    let pointerX = -9999;
    let pointerY = -9999;
    let pointerTargetX = -9999;
    let pointerTargetY = -9999;
    let pointerVelocityY = 0;
    let pointerActive = false;
    let inView = true;

    function fit() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function orderAt(x: number) {
      const n = x / Math.max(width, 1);
      return smooth(
        clamp(
          (n - TRANSITION_START) / (TRANSITION_END - TRANSITION_START),
          0,
          1,
        ),
      );
    }

    function yAt(line: Line, x: number) {
      const order = orderAt(x);
      const chaos = motionRef.current.chaos;
      const amplitude = (line.amp + chaos * 14) * Math.pow(1 - order, 1.7);
      const waves =
        Math.sin(x * line.f1 - phase * line.speed * 7 + line.offset) *
          amplitude +
        Math.sin(x * line.f2 - phase * 4.5 + line.offset * 1.7) *
          amplitude *
          0.09;
      const hoverRadius = width < 700 ? 170 : 280;
      const pointerDistance = (x - pointerX) / hoverRadius;
      const interactionStrength = mix(1, 0.08, order);
      const hoverEnvelope =
        line.hover > 0.001
          ? Math.exp(-pointerDistance * pointerDistance * 1.55) *
            interactionStrength
          : 0;
      const ripple =
        Math.sin((x - pointerX) * 0.018 - phase * 3) * line.hover * 2.6;

      return (
        mix(line.messyBase, line.orderedBase, order) +
        waves +
        (line.hoverPush + ripple) * hoverEnvelope
      );
    }

    function lineColour(line: Line, progress: number, alpha: number) {
      const ordered = smooth(clamp((progress - 0.34) / 0.42, 0, 1));
      const left = mixRgb(PINE, FOREST, 0.18 + line.tint * 0.18);
      const right = mixRgb(FOREST, EMERALD, 0.28 + line.tint * 0.28);
      const colour = mixRgb(left, right, ordered);
      const safeAlpha = Number.isFinite(alpha) ? clamp(alpha, 0, 1) : 0;
      return `rgba(${Math.round(colour[0])},${Math.round(colour[1])},${Math.round(colour[2])},${safeAlpha})`;
    }

    function dotColour(progress: number) {
      const colour =
        progress < 0.5
          ? mixRgb(RED, AMBER, smooth(progress * 2))
          : mixRgb(AMBER, GREEN, smooth((progress - 0.5) * 2));
      return colour;
    }

    function draw() {
      frame = 0;
      if (!inView) return;
      const motion = motionRef.current;
      context.clearRect(0, 0, width, height);
      if (!reduced) phase += 0.0026 + motion.chaos * 0.0018;
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

        const pulse = 0.5 + Math.sin(phase * 4 + line.offset) * 0.5;
        const verticalProgress =
          activeCount > 1 ? index / (activeCount - 1) : 0.5;
        const verticalWave = Math.max(0, Math.sin(verticalProgress * Math.PI));
        const verticalFade = 0.06 + Math.pow(verticalWave, 1.35) * 0.84;
        const emphasizedStart = Math.max(
          0,
          Math.floor((activeCount - EMPHASIZED_LINE_COUNT) / 2),
        );
        const emphasized =
          index >= emphasizedStart &&
          index < emphasizedStart + EMPHASIZED_LINE_COUNT;
        const lineStrength = emphasized ? 2.15 : verticalFade;
        const gradient = context.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(
          0,
          lineColour(line, 0, 0.2 * line.alive * lineStrength),
        );
        gradient.addColorStop(
          0.28,
          lineColour(line, 0.28, 0.27 * line.alive * lineStrength),
        );
        gradient.addColorStop(
          0.43,
          lineColour(line, 0.43, 0.11 * line.alive * lineStrength),
        );
        gradient.addColorStop(
          0.58,
          lineColour(line, 0.58, 0.1 * line.alive * lineStrength),
        );
        gradient.addColorStop(
          0.74,
          lineColour(line, 0.74, 0.22 * line.alive * lineStrength),
        );
        gradient.addColorStop(
          1,
          lineColour(
            line,
            1,
            (0.17 + pulse * 0.025) * line.alive * lineStrength,
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
          context.strokeStyle = `rgba(5,105,65,${clamp(0.03 * lineStrength, 0, 1)})`;
          context.lineWidth = line.width + (emphasized ? 1.8 : 1.1);
          context.shadowColor = "rgba(3,82,52,0.22)";
          context.shadowBlur = 5 + pulse * 3 + motion.resolve * 2;
          context.stroke();
          context.shadowBlur = 0;
          context.strokeStyle = gradient;
          context.lineWidth =
            line.width + (emphasized ? 0.65 : 0.2) + motion.resolve * 0.35;
          context.stroke();
          context.restore();
        }

        strokeSegment(0, width);

        if (!line.showsDot) return;

        if (!reduced) {
          line.dot += line.dotSpeed * 0.01 * (1 + motion.resolve * 0.3);
          if (line.dot > 1.08) line.dot = -0.06;
        }

        const dx = line.dot * width;
        if (dx < -10 || dx > width + 10) return;
        const dy = yAt(line, dx);
        const progress = clamp(line.dot, 0, 1);
        const colour = dotColour(progress);
        const radius = 3.1 + smooth(progress) * 0.7 + motion.resolve * 0.35;

        context.save();
        context.fillStyle = `rgba(${Math.round(colour[0])},${Math.round(colour[1])},${Math.round(colour[2])},${clamp(0.96 * line.alive, 0, 1)})`;
        context.shadowColor = `rgba(${Math.round(colour[0])},${Math.round(colour[1])},${Math.round(colour[2])},0.96)`;
        context.shadowBlur = 12 + progress * 5;
        context.beginPath();
        context.arc(dx, dy, radius, 0, Math.PI * 2);
        context.fill();
        context.shadowBlur = 0;
        context.strokeStyle = "rgba(8,12,13,0.42)";
        context.lineWidth = 0.75;
        context.stroke();
        context.restore();
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
    <canvas
      ref={canvasRef}
      aria-hidden
      className="absolute inset-0 z-[1] size-full"
    />
  );
}
