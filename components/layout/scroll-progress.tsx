"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

export function ScrollProgress() {
  const bar = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.to(bar.current, {
      scaleX: 1,
      ease: "none",
      scrollTrigger: {
        trigger: document.documentElement,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.3,
      },
    });
  });

  return (
    <div
      ref={bar}
      aria-hidden
      className="bg-brand fixed inset-x-0 top-0 z-[99] h-0.5 origin-left scale-x-0 shadow-[0_0_12px_rgba(47,232,92,0.7)]"
    />
  );
}
