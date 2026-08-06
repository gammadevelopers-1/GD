"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { BASE_LINES, MAX_LINES, useHero } from "./hero-provider";

/* Band geometry. Extra lines pack into the SAME height — they never spread. */
const BAND_TOP = 0.3;
const BAND_SPAN = 0.4;

/* Where the mess resolves into order, as a fraction of width. */
const CHAOS_START = 0.07;
const CHAOS_END = 0.5;

const COOL = [126, 134, 146] as const;
const WARM = [92, 150, 126] as const;
const ACCENT = [5, 150, 105] as const;
const BRAND = [47, 232, 92] as const;

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const smooth = (t: number) => t * t * (3 - 2 * t);

/** 0 = stays grey, 1 = mixed, 2 = bright brand green. */
type LineKind = 0 | 1 | 2;

interface Line {
  amp: number;
  f1: number;
  f2: number;
  speed: number;
  offset: number;
  width: number;
  kind: LineKind;
  tint: number;
  greenMax: number;
  lift: number;
  /* mutable per frame */
  base: number;
  alive: number;
  disturb: number;
  glow: number;
  flash: number;
  ring: number;
  dot: number;
  dotSpeed: number;
}

function makeLine(index: number): Line {
  const r = Math.random();
  const kind: LineKind = r < 0.38 ? 0 : r < 0.76 ? 1 : 2;
  return {
    amp: 16 + Math.random() * 26,
    f1: 0.0064 + Math.random() * 0.0052,
    f2: 0.017 + Math.random() * 0.012,
    speed: 0.5 + Math.random() * 0.7,
    offset: Math.random() * 99,
    width:
      kind === 2
        ? 1.5 + Math.random() * 0.6
        : kind === 1
          ? 1 + Math.random() * 0.35
          : 0.75 + Math.random() * 0.2,
    kind,
    tint:
      kind === 0
        ? 0.05 + Math.random() * 0.12
        : kind === 1
          ? 0.42 + Math.random() * 0.28
          : 0.88 + Math.random() * 0.12,
    greenMax: kind === 0 ? 0.2 : kind === 1 ? 0.74 : 1,
    lift: kind === 0 ? 0 : kind === 1 ? 0.07 : 0.22,
    base: 0,
    alive: index < BASE_LINES ? 1 : 0,
    disturb: 0,
    glow: 0,
    flash: 0,
    ring: 0,
    dot: Math.random(),
    dotSpeed: 0.09 + Math.random() * 0.12,
  };
}

export function LineField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { motionRef } = useHero();
  const reduced = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const lines: Line[] = Array.from({ length: MAX_LINES }, (_, i) =>
      makeLine(i),
    );
    const dots: { x: number; y: number; line: Line }[] = [];

    let width = 0;
    let height = 0;
    let phase = 0;
    let pointerX = -9999;
    let pointerY = -9999;
    let hovered: Line | null = null;
    let frame = 0;

    function fit() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas!.clientWidth;
      height = canvas!.clientHeight;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function colour(line: Line, k: number, alpha: number) {
      const b0 = COOL[0] + (WARM[0] - COOL[0]) * line.tint;
      const b1 = COOL[1] + (WARM[1] - COOL[1]) * line.tint;
      const b2 = COOL[2] + (WARM[2] - COOL[2]) * line.tint;
      const resolve = motionRef.current.resolve;
      const target =
        line.kind === 2 || line.flash > 0.05 || resolve > 0.5 ? BRAND : ACCENT;
      const mix =
        clamp(k, 0, 1) * Math.max(line.greenMax, line.flash, resolve * 0.92);
      const a = clamp(
        (alpha +
          line.lift * clamp(k, 0, 1) +
          line.flash * 0.28 +
          resolve * 0.12) *
          line.alive,
        0,
        1,
      );
      return `rgba(${Math.round(b0 + (target[0] - b0) * mix)},${Math.round(b1 + (target[1] - b1) * mix)},${Math.round(b2 + (target[2] - b2) * mix)},${a})`;
    }

    function yAt(line: Line, x: number) {
      const n = x / width;
      const calm = smooth(
        clamp((n - CHAOS_START) / (CHAOS_END - CHAOS_START), 0, 1),
      );
      const amp =
        (line.amp + line.disturb * 28 + motionRef.current.chaos * 40) *
        (1 - calm);
      return (
        line.base +
        Math.sin(x * line.f1 - phase * line.speed * 7 + line.offset) * amp +
        Math.sin(x * line.f2 - phase * 4.6 + line.offset * 1.7) * amp * 0.3
      );
    }

    function draw() {
      const m = motionRef.current;
      ctx!.clearRect(0, 0, width, height);
      if (!reduced) phase += 0.0042 + m.chaos * 0.0036;

      const top = height * BAND_TOP;
      const span = height * BAND_SPAN;
      const gap = span / Math.max(1, m.activeLines - 1);
      const split = width * 0.5;
      dots.length = 0;

      lines.forEach((line, i) => {
        const live = i < m.activeLines ? 1 : 0;
        line.alive += (live - line.alive) * 0.045;
        if (line.alive < 0.01) return;

        const targetBase = top + Math.min(i, m.activeLines - 1) * gap;
        line.base = line.base
          ? line.base + (targetBase - line.base) * 0.06
          : targetBase;

        const near = Math.abs(pointerY - line.base);
        if (pointerX > -1000 && near < 48) {
          const prox = 1 - near / 48;
          if (pointerX < split) {
            // Disturb the messy half — it gets worse and compounds.
            line.disturb = Math.min(1, line.disturb + prox * 0.05);
            line.glow = Math.min(1, line.glow + prox * 0.08);
          } else {
            // The resolved half only glows. It does not move.
            line.glow = Math.min(1, line.glow + prox * 0.12);
          }
        }
        line.disturb *= 0.977;
        line.glow *= 0.955;
        line.flash *= 0.955;
        line.ring = line.flash > 0.02 ? line.ring + 0.035 : 0;

        ctx!.beginPath();
        for (let x = 0; x <= width; x += 6) {
          const y = yAt(line, x);
          if (x === 0) ctx!.moveTo(x, y);
          else ctx!.lineTo(x, y);
        }

        const gk = Math.max(line.glow, line.flash, m.resolve * 0.6);
        const grad = ctx!.createLinearGradient(0, 0, width, 0);
        grad.addColorStop(
          0,
          colour(
            line,
            gk,
            0.14 + gk * 0.42 + line.disturb * 0.3 + m.chaos * 0.14,
          ),
        );
        grad.addColorStop(
          0.36,
          colour(line, gk * 0.6 + 0.15, 0.21 + gk * 0.44 + line.disturb * 0.24),
        );
        grad.addColorStop(0.72, colour(line, 1, 0.49 + gk * 0.42));
        grad.addColorStop(1, colour(line, 1, 0.27 + gk * 0.3));
        ctx!.strokeStyle = grad;
        ctx!.lineWidth =
          line.width + gk * 1.2 + line.disturb * 0.6 + m.chaos * 0.45;
        ctx!.stroke();

        if (!reduced) {
          line.dot += line.dotSpeed * 0.011 * (1 + m.resolve * 0.8);
          if (line.dot > 1.1) line.dot = -0.08;
        }
        const dx = line.dot * width;
        if (dx > -10 && dx < width + 10) {
          const dy = yAt(line, dx);
          const bright = smooth(clamp((line.dot - 0.26) / 0.38, 0, 1));
          dots.push({ x: dx, y: dy, line });
          const isHover = hovered === line ? 1 : 0;
          const r = 1.6 + isHover * 0.6 + line.flash * 1.2 + m.resolve * 0.7;

          ctx!.fillStyle = colour(
            line,
            1,
            0.56 + bright * 0.2 + isHover * 0.15 + line.flash * 0.18,
          );
          ctx!.beginPath();
          ctx!.arc(dx, dy, r, 0, Math.PI * 2);
          ctx!.fill();

          if (isHover) {
            ctx!.strokeStyle = colour(line, 1, 0.3);
            ctx!.lineWidth = 1;
            ctx!.beginPath();
            ctx!.arc(dx, dy, r + 5, 0, Math.PI * 2);
            ctx!.stroke();
          }
          if (line.flash > 0.02) {
            ctx!.strokeStyle = colour(line, 1, clamp(line.flash * 0.7, 0, 1));
            ctx!.lineWidth = 1.4;
            ctx!.beginPath();
            ctx!.arc(dx, dy, line.ring * width * 0.12, 0, Math.PI * 2);
            ctx!.stroke();
          }
        }
      });

      hovered = null;
      if (pointerX > -1000) {
        let best = Infinity;
        for (const d of dots) {
          const dist = Math.hypot(d.x - pointerX, d.y - pointerY);
          if (dist < 26 && dist < best) {
            best = dist;
            hovered = d.line;
          }
        }
      }
      canvas!.style.cursor = hovered ? "pointer" : "crosshair";

      m.chaos *= 0.985;
      frame = requestAnimationFrame(draw);
    }

    function onMove(e: PointerEvent) {
      const rect = canvas!.getBoundingClientRect();
      pointerX = e.clientX - rect.left;
      pointerY = e.clientY - rect.top;
    }
    function onLeave() {
      pointerX = -9999;
      pointerY = -9999;
      hovered = null;
    }
    function onDown() {
      if (hovered) {
        hovered.flash = 1;
        hovered.ring = 0;
      }
    }

    fit();
    frame = requestAnimationFrame(draw);
    window.addEventListener("resize", fit);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);
    canvas.addEventListener("pointerdown", onDown);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", fit);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("pointerdown", onDown);
    };
  }, [motionRef, reduced]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="absolute inset-0 z-[1] size-full cursor-crosshair"
    />
  );
}
