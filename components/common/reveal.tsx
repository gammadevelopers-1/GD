"use client";

import { useRef, type ReactNode } from "react";
import { duration, ease, gsap, useGSAP } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";

interface RevealProps {
  children: ReactNode;
  delay?: number;
  stagger?: boolean;
  className?: string;
}

export function Reveal({
  children,
  delay = 0,
  stagger = false,
  className,
}: RevealProps) {
  const scope = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      if (reduced || !scope.current) return;
      const targets = stagger
        ? Array.from(scope.current.children)
        : scope.current;

      gsap.from(targets, {
        opacity: 0,
        y: 26,
        duration: duration.base,
        ease: ease.out,
        delay,
        stagger: stagger ? 0.09 : 0,
        scrollTrigger: { trigger: scope.current, start: "top 88%", once: true },
      });
    },
    { scope, dependencies: [reduced] },
  );

  return (
    <div ref={scope} className={className}>
      {children}
    </div>
  );
}
