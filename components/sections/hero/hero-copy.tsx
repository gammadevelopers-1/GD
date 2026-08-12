"use client";

import { useRef, type ReactNode } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { useHero } from "./hero-provider";

export function HeroCopy({ children }: { children: ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);
  const { phase } = useHero();
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      if (reduced) return;
      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .from(
          "[data-hero-line]",
          {
            yPercent: 85,
            rotateX: -18,
            opacity: 0,
            filter: "blur(10px)",
            duration: 1,
            stagger: 0.1,
          },
          0.2,
        )
        .from(
          "[data-logo-letter]",
          {
            scale: 0.45,
            rotate: -10,
            opacity: 0,
            duration: 0.75,
            stagger: 0.12,
            ease: "back.out(2.4)",
          },
          0.55,
        )
        .from("[data-hero='lead']", { y: 16, opacity: 0, duration: 0.75 }, 0.58)
        .from("[data-hero='form']", { y: 18, opacity: 0, duration: 0.8 }, 0.68)
        .from(
          "[data-hero='cta-copy']",
          { y: 18, opacity: 0, duration: 0.75 },
          0.82,
        )
        .from(
          "[data-hero='cta-button']",
          { y: 16, opacity: 0, scale: 0.96, duration: 0.7 },
          0.92,
        );
    },
    { scope, dependencies: [reduced] },
  );

  // Keep the promise legible while the findings take focus.
  useGSAP(
    () => {
      if (reduced) return;
      const sequencing = phase === "problems" || phase === "fixes";
      const dimmed = sequencing || phase === "done";
      gsap.to("[data-hero='title'], [data-hero='lead']", {
        opacity: sequencing ? 0.88 : dimmed ? 0.95 : 1,
        duration: 0.45,
        ease: "power2.inOut",
      });
    },
    { scope, dependencies: [phase, reduced] },
  );

  return (
    <div ref={scope} className="contents">
      {children}
    </div>
  );
}
