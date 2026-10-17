"use client";

import { useEffect, useRef } from "react";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  LineBasicMaterial,
  LineSegments,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from "three";

const STRANDS = 460;
const SEG = 68;

const WAIST = 0.17;
const FLARE_UP = 3.4;
const FLARE_DOWN = 7.0;
const POWER = 2.7; // long neck, hard flare at the ends
const TWIST = 2.3;
const SPAN = 1.12;

const RINGS = 80;
const RING_SEG = 128;
const FLOOR = -1.16;

const CREAM = new Color("#ecece4");
const BRAND = new Color("#2fe85c");

function radius(u: number) {
  const a = Math.abs(u);
  const flare = u < 0 ? FLARE_DOWN : FLARE_UP;
  return WAIST * (1 + flare * Math.pow(a, POWER));
}

/** The funnel: one LineSegments for every helical strand, one draw call. */
function buildStrands() {
  const positions = new Float32Array(STRANDS * SEG * 2 * 3);
  const colors = new Float32Array(STRANDS * SEG * 2 * 3);
  const c = new Color();
  let p = 0;

  for (let i = 0; i < STRANDS; i++) {
    const base = (i / STRANDS) * Math.PI * 2;

    for (let s = 0; s < SEG; s++) {
      for (let e = 0; e < 2; e++) {
        const u = (((s + e) / SEG) * 2 - 1) * SPAN;
        const r = radius(u);
        const a = base + TWIST * u;

        positions[p] = r * Math.cos(a);
        positions[p + 1] = u;
        positions[p + 2] = r * Math.sin(a);

        // Green only at the pinch — that is the leak.
        const waist = Math.max(0, 1 - Math.abs(u) / 0.34);
        c.copy(CREAM).lerp(BRAND, waist * 0.8);
        // Additive blending: keep each line dim and let overlap do the work.
        const amp = 0.055 + waist * 0.05;
        colors[p] = c.r * amp;
        colors[p + 1] = c.g * amp;
        colors[p + 2] = c.b * amp;
        p += 3;
      }
    }
  }
  return { positions, colors };
}

/** The ground plane: concentric spiral rings the funnel sits in. */
function buildFloor() {
  const positions = new Float32Array(RINGS * RING_SEG * 2 * 3);
  const colors = new Float32Array(RINGS * RING_SEG * 2 * 3);
  let p = 0;

  for (let i = 0; i < RINGS; i++) {
    const t = i / (RINGS - 1);
    const r = radius(-SPAN) * (0.35 + t * 2.9);
    const drift = t * 1.7;
    const amp = 0.05 * (1 - t * 0.65);

    for (let s = 0; s < RING_SEG; s++) {
      for (let e = 0; e < 2; e++) {
        const a = ((s + e) / RING_SEG) * Math.PI * 2 + drift;
        positions[p] = r * Math.cos(a);
        positions[p + 1] = FLOOR - t * 0.1;
        positions[p + 2] = r * Math.sin(a);
        colors[p] = CREAM.r * amp;
        colors[p + 1] = CREAM.g * amp;
        colors[p + 2] = CREAM.b * amp;
        p += 3;
      }
    }
  }
  return { positions, colors };
}

function mesh({
  positions,
  colors,
}: {
  positions: Float32Array;
  colors: Float32Array;
}) {
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.setAttribute("color", new BufferAttribute(colors, 3));
  const material = new LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
  });
  return new LineSegments(geometry, material);
}

export function VortexField({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true });
    } catch {
      canvas.style.display = "none";
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const scene = new Scene();
    const camera = new PerspectiveCamera(52, 1, 0.1, 100);
    camera.position.set(0, 0.26, 2.35);

    const group = new Group();
    const strands = mesh(buildStrands());
    const floor = mesh(buildFloor());
    group.add(strands, floor);
    scene.add(group);

    const to = { x: 0, y: 0 };
    const at = { x: 0, y: 0 };

    const render = (time: number) => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (w && h && (canvas.width !== w || canvas.height !== h)) {
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      }

      at.x += (to.x - at.x) * 0.05;
      at.y += (to.y - at.y) * 0.05;

      group.rotation.y = time * 0.00007 + at.x * 0.5;
      camera.position.x = at.x * 0.34;
      camera.position.y = 0.26 - at.y * 0.22;
      camera.lookAt(0, -0.06, 0);

      renderer.render(scene, camera);
    };

    const dispose = () => {
      strands.geometry.dispose();
      floor.geometry.dispose();
      (strands.material as LineBasicMaterial).dispose();
      (floor.material as LineBasicMaterial).dispose();
      renderer.dispose();
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      render(0);
      return dispose;
    }

    let visible = true;
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    io.observe(canvas);

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      if (!r.width || !r.height) return;
      to.x = (e.clientX - r.left) / r.width - 0.5;
      to.y = (e.clientY - r.top) / r.height - 0.5;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    render(0);

    let raf = 0;
    const loop = (time: number) => {
      if (visible) render(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      io.disconnect();
      dispose();
    };
  }, []);

  return <canvas ref={ref} aria-hidden className={className} />;
}
