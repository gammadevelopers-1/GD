"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";

export function PointerGlow() {
  const orbit = useRef<HTMLDivElement>(null);
  const surface = useRef<HTMLDivElement>(null);
  const core = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const orbitElement = orbit.current;
    const surfaceElement = surface.current;
    const coreElement = core.current;
    if (
      !orbitElement ||
      !surfaceElement ||
      !coreElement ||
      reduced ||
      !window.matchMedia("(pointer: fine)").matches
    ) {
      return;
    }

    const cursorOrbit = orbitElement;
    const cursorSurface = surfaceElement;
    const cursorCore = coreElement;
    const root = document.documentElement;
    root.classList.add("has-custom-cursor");
    gsap.set([cursorOrbit, cursorCore], { xPercent: -50, yPercent: -50 });

    const orbitX = gsap.quickTo(cursorOrbit, "x", {
      duration: 0.3,
      ease: "power3.out",
    });
    const orbitY = gsap.quickTo(cursorOrbit, "y", {
      duration: 0.3,
      ease: "power3.out",
    });
    const coreX = gsap.quickTo(cursorCore, "x", {
      duration: 0.07,
      ease: "power2.out",
    });
    const coreY = gsap.quickTo(cursorCore, "y", {
      duration: 0.07,
      ease: "power2.out",
    });

    let lastX = window.innerWidth / 2;
    let lastY = window.innerHeight / 2;
    let restingScale = 1;

    function onMove(event: PointerEvent) {
      orbitX(event.clientX);
      orbitY(event.clientY);
      coreX(event.clientX);
      coreY(event.clientY);

      const target = event.target as Element | null;
      const tone =
        target
          ?.closest("[data-cursor-tone]")
          ?.getAttribute("data-cursor-tone") ?? "mint";
      cursorOrbit.dataset.tone = tone;
      cursorCore.dataset.tone = tone;

      const interactive = Boolean(
        target?.closest("a, button, input, textarea, select, [role='button']"),
      );
      const threads = Boolean(target?.closest("[data-cursor-zone='threads']"));
      restingScale = interactive ? 1.62 : threads ? 0.72 : 1;

      const deltaX = event.clientX - lastX;
      const deltaY = event.clientY - lastY;
      const speed = Math.min(0.32, Math.hypot(deltaX, deltaY) / 120);
      const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
      lastX = event.clientX;
      lastY = event.clientY;

      cursorOrbit.dataset.mode = interactive
        ? "interactive"
        : threads
          ? "threads"
          : "default";
      gsap.to(cursorSurface, {
        autoAlpha: 1,
        rotation: speed > 0.02 ? angle : "+=0",
        scaleX: restingScale * (1 + speed),
        scaleY: restingScale * (1 - speed * 0.28),
        duration: 0.32,
        ease: "power3.out",
        overwrite: "auto",
      });
      gsap.to([cursorOrbit, cursorCore], {
        autoAlpha: 1,
        duration: 0.16,
        overwrite: "auto",
      });
    }

    function onDown() {
      gsap.to(cursorSurface, {
        scaleX: restingScale * 0.72,
        scaleY: restingScale * 0.72,
        duration: 0.1,
        ease: "power2.out",
        overwrite: "auto",
      });
      gsap.to(cursorCore, { scale: 1.75, duration: 0.1 });
    }

    function onUp() {
      gsap.to(cursorSurface, {
        scaleX: restingScale,
        scaleY: restingScale,
        duration: 0.42,
        ease: "back.out(2.3)",
        overwrite: "auto",
      });
      gsap.to(cursorCore, { scale: 1, duration: 0.28, ease: "back.out(2)" });
    }

    function onLeave() {
      gsap.to([cursorOrbit, cursorCore], {
        autoAlpha: 0,
        duration: 0.2,
        overwrite: "auto",
      });
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    document.documentElement.addEventListener("pointerleave", onLeave);

    return () => {
      root.classList.remove("has-custom-cursor");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      gsap.killTweensOf([cursorOrbit, cursorSurface, cursorCore]);
    };
  }, [reduced]);

  return (
    <>
      <div
        ref={orbit}
        aria-hidden
        data-tone="mint"
        className="pointer-orbit pointer-events-none fixed top-0 left-0 z-[1000] hidden size-12 opacity-0 md:block"
      >
        <div ref={surface} className="pointer-orbit-surface size-full" />
      </div>
      <div
        ref={core}
        aria-hidden
        data-tone="mint"
        className="pointer-core pointer-events-none fixed top-0 left-0 z-[1001] hidden size-1.5 opacity-0 md:block"
      />
    </>
  );
}
