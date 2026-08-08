"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { clientLogos } from "@/lib/content/site";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";

export function LogoMarquee() {
  const track = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      if (reduced || !track.current) return;

      const tween = gsap.to(track.current, {
        xPercent: -50,
        duration: 34,
        ease: "none",
        repeat: -1,
      });

      ScrollTrigger.create({
        trigger: track.current,
        start: "top bottom",
        end: "bottom top",
        onEnter: () => tween.play(),
        onLeave: () => tween.pause(),
        onEnterBack: () => tween.play(),
        onLeaveBack: () => tween.pause(),
      });
    },
    { dependencies: [reduced] },
  );

  const row = [...clientLogos, ...clientLogos];

  return (
    <div
      aria-label="Clients"
      className="marquee-surface border-border bg-background relative overflow-hidden border-y mask-[linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)] py-6 [background:linear-gradient(180deg,#f7f6f2_0%,#f3f1ea_100%)]"
    >
      <div ref={track} className="relative z-1 flex w-max items-center gap-16">
        {row.map((name, i) => (
          <span
            key={`${name}-${i}`}
            className="text-[19px] font-semibold tracking-[-0.02em] whitespace-nowrap text-[#8a8b84] transition-colors duration-300 hover:text-[#14171a]"
          >
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}
