"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { BASE_LINES, MAX_LINES, useHero } from "./hero-provider";

// Messy on the left, calm and aligned on the right.
const MESSY_TOP = 0.3;
const MESSY_SPAN = 0.4;
const ORDERED_TOP = 0.445;
const ORDERED_SPAN = 0.11;
const CHAOS_START = 0.02;
const CHAOS_END = 0.54;

const CHARCOAL = [12, 16, 18] as const;
const FOREST = [2, 70, 48] as const;
const EMERALD = [5, 150, 105] as const;
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
  hover: number;
  hoverPush: number;
}

function makeLine(index: number): Line {
  return {
    amp: 24 + Math.random() * 42,
    f1: 0.005 + Math.random() * 0.006,
    f2: 0.014 + Math.random() * 0.014,
    speed: 0.42 + Math.random() * 0.7,
    offset: Math.random() * 99,
    width: 1.1 + Math.random() * 1.05,
    tint: 0.2 + Math.random() * 0.8,
    messyBase: 0,
    orderedBase: 0,
    alive: index < BASE_LINES ? 1 : 0,
    dot: Math.random(),
    dotSpeed: 0.1 + Math.random() * 0.13,
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
      const resolveShift = motionRef.current.resolve * 0.07;
      return smooth(
        clamp(
          (n - (CHAOS_START - resolveShift)) / (CHAOS_END - CHAOS_START),
          0,
          1,
        ),
      );
    }

    function yAt(line: Line, x: number) {
      const order = orderAt(x);
      const chaos = motionRef.current.chaos;
      const amplitude =
        (line.amp + chaos * 48 + line.hover * 62) * Math.pow(1 - order, 1.28);
      const waves =
        Math.sin(x * line.f1 - phase * line.speed * 7 + line.offset) *
          amplitude +
        Math.sin(x * line.f2 - phase * 4.5 + line.offset * 1.7) *
          amplitude *
          0.34;
      const hoverRadius = width < 700 ? 138 : 230;
      const pointerDistance = (x - pointerX) / hoverRadius;
      const hoverEnvelope =
        line.hover > 0.001
          ? Math.exp(-pointerDistance * pointerDistance * 2.2) * (1 - order)
          : 0;
      const ripple =
        Math.sin((x - pointerX) * 0.027 - phase * 7) * line.hover * 11;

      return (
        mix(line.messyBase, line.orderedBase, order) +
        waves +
        (line.hoverPush + ripple) * hoverEnvelope
      );
    }

    function lineColour(line: Line, progress: number, alpha: number) {
      const ordered = smooth(clamp((progress - 0.34) / 0.42, 0, 1));
      const left = mixRgb(CHARCOAL, FOREST, line.tint * 0.2);
      const right = mixRgb(FOREST, EMERALD, 0.42 + line.tint * 0.34);
      const colour = mixRgb(left, right, ordered);
      return `rgba(${Math.round(colour[0])},${Math.round(colour[1])},${Math.round(colour[2])},${alpha})`;
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
      if (!reduced) phase += 0.0044 + motion.chaos * 0.0034;
      if (pointerActive) {
        const previousY = pointerY;
        pointerX += (pointerTargetX - pointerX) * 0.15;
        pointerY += (pointerTargetY - pointerY) * 0.15;
        pointerVelocityY =
          pointerVelocityY * 0.72 + (pointerY - previousY) * 0.28;
      } else {
        pointerVelocityY *= 0.82;
      }

      const activeCount = Math.max(2, Math.round(motion.activeLines));
      const messyGap = (height * MESSY_SPAN) / Math.max(1, activeCount - 1);
      const orderedGap = (height * ORDERED_SPAN) / Math.max(1, activeCount - 1);

      lines.forEach((line, index) => {
        const live = index < activeCount ? 1 : 0;
        line.alive += (live - line.alive) * 0.055;
        if (line.alive < 0.01) return;

        const messyTarget = height * MESSY_TOP + index * messyGap;
        const orderedTarget = height * ORDERED_TOP + index * orderedGap;
        line.messyBase = line.messyBase
          ? line.messyBase + (messyTarget - line.messyBase) * 0.07
          : messyTarget;
        line.orderedBase = line.orderedBase
          ? line.orderedBase + (orderedTarget - line.orderedBase) * 0.07
          : orderedTarget;

        const canDisturb = pointerActive && pointerX < width * 0.5;
        const lineAtPointer = yAt(line, clamp(pointerX, 0, width * 0.5));
        const pointerGap = Math.abs(lineAtPointer - pointerY);
        const hoverTarget = canDisturb
          ? smooth(clamp(1 - pointerGap / 150, 0, 1))
          : 0;
        const pushDirection = lineAtPointer >= pointerY ? 1 : -1;
        const pushTarget = clamp(
          pushDirection * hoverTarget * 96 + pointerVelocityY * hoverTarget * 7,
          -128,
          128,
        );
        line.hover +=
          (hoverTarget - line.hover) *
          (hoverTarget > line.hover ? 0.13 : 0.055);
        line.hoverPush += (pushTarget - line.hoverPush) * 0.095;

        context.beginPath();
        for (let x = 0; x <= width; x += 5) {
          const y = yAt(line, x);
          if (x === 0) context.moveTo(x, y);
          else context.lineTo(x, y);
        }

        const pulse = 0.5 + Math.sin(phase * 4 + line.offset) * 0.5;
        const gradient = context.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, lineColour(line, 0, 0.52 * line.alive));
        gradient.addColorStop(0.38, lineColour(line, 0.38, 0.7 * line.alive));
        gradient.addColorStop(0.6, lineColour(line, 0.6, 0.84 * line.alive));
        gradient.addColorStop(
          1,
          lineColour(line, 1, (0.82 + pulse * 0.13) * line.alive),
        );

        context.save();
        context.lineCap = "round";
        context.lineJoin = "round";
        context.strokeStyle = "rgba(47,232,92,0.16)";
        context.lineWidth = line.width + 2.2;
        context.shadowColor = "rgba(5,150,105,0.72)";
        context.shadowBlur = 16 + pulse * 10 + motion.resolve * 8;
        context.stroke();
        context.shadowBlur = 0;
        context.strokeStyle = gradient;
        context.lineWidth = line.width + motion.resolve * 0.35;
        context.stroke();
        context.restore();

        if (!reduced) {
          line.dot += line.dotSpeed * 0.012 * (1 + motion.resolve * 0.55);
          if (line.dot > 1.08) line.dot = -0.06;
        }

        const dx = line.dot * width;
        if (dx < -10 || dx > width + 10) return;
        const dy = yAt(line, dx);
        const progress = clamp(line.dot, 0, 1);
        const colour = dotColour(progress);
        const radius = 3.1 + smooth(progress) * 0.7 + motion.resolve * 0.35;

        context.save();
        context.fillStyle = `rgba(${Math.round(colour[0])},${Math.round(colour[1])},${Math.round(colour[2])},${0.94 * line.alive})`;
        context.shadowColor = `rgba(${Math.round(colour[0])},${Math.round(colour[1])},${Math.round(colour[2])},0.92)`;
        context.shadowBlur = 12 + progress * 6;
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
      const nextActive = nextX < width * 0.52;
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
