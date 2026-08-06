"use client";

import { useRef, type ReactNode } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { useHero } from "./hero-provider";

/**
 * Hero entrance, and the dim-back once the audit result takes over.
 * Wraps the copy block so the section itself can stay a server component.
 */
export function HeroCopy({ children }: { children: ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);
  const { phase } = useHero();
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      if (reduced) return;
      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .from("[data-hero='title']", { y: 28, opacity: 0, duration: 0.9 }, 0.25)
        .from("[data-hero='lead']", { y: 20, opacity: 0, duration: 0.8 }, 0.4)
        .from("[data-hero='form']", { y: 20, opacity: 0, duration: 0.8 }, 0.52);
    },
    { scope, dependencies: [reduced] },
  );

  // Once the result appears, the headline steps back so the answer leads.
  useGSAP(
    () => {
      if (reduced) return;
      const dimmed = phase === "done";
      gsap.to("[data-hero='title'], [data-hero='lead']", {
        opacity: dimmed ? 0.3 : 1,
        duration: 0.6,
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
