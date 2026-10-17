"use client";

import { useRef, useState } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { clientLogos } from "@/lib/content/site";
import { marquee } from "@/lib/content/home";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

const ICONS: Record<string, React.ReactNode> = {
  hex: (
    <>
      <path
        d="M16 3l11 6.4v13L16 29 5 22.4v-13L16 3z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="16" r="3.4" fill="currentColor" />
    </>
  ),
  orbit: (
    <>
      <circle
        cx="16"
        cy="16"
        r="11"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="50 14"
      />
      <path
        d="M15 4.5l4 3-4 3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  cross: (
    <>
      <rect
        x="4.5"
        y="4.5"
        width="23"
        height="23"
        rx="7"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M16 11v10M11 16h10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </>
  ),
  peaks: (
    <path
      d="M5 23h22M7 23l1.6-11 4.4 5.5L16 9l3 8.5 4.4-5.5L25 23"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  ),
  clock: (
    <>
      <circle cx="16" cy="16" r="11" stroke="currentColor" strokeWidth="2" />
      <path
        d="M16 16l6-4.5M16 16v6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </>
  ),
  gauge: (
    <>
      <path
        d="M6 23a10 10 0 1 1 20 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M16 22l6-6.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="16" cy="22" r="1.8" fill="currentColor" />
    </>
  ),
  car: (
    <>
      <path
        d="M4 19l2.2-6.4A3 3 0 0 1 9 10.5h14a3 3 0 0 1 2.8 2.1L28 19v3.5h-4V22H8v.5H4V19z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="10.5" cy="19.5" r="1.9" fill="currentColor" />
      <circle cx="21.5" cy="19.5" r="1.9" fill="currentColor" />
    </>
  ),
  shield: (
    <>
      <path
        d="M16 4l10 3v6.5c0 6-4.3 9.3-10 12-5.7-2.7-10-6-10-12V7l10-3z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M12 15.5l3 3 5-5.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
};

export function LogoMarquee() {
  const track = useRef<HTMLDivElement>(null);
  const loopTween = useRef<gsap.core.Tween | null>(null);
  const speedTween = useRef<gsap.core.Tween | null>(null);
  const [focused, setFocused] = useState<number | null>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      if (reduced || !track.current) return;

      const loop = gsap.to(track.current, {
        xPercent: -50,
        duration: 34,
        ease: "none",
        repeat: -1,
      });
      loopTween.current = loop;

      ScrollTrigger.create({
        trigger: track.current,
        start: "top bottom",
        end: "bottom top",
        onEnter: () => loop.play(),
        onLeave: () => loop.pause(),
        onEnterBack: () => loop.play(),
        onLeaveBack: () => loop.pause(),
      });

      return () => {
        speedTween.current?.kill();
        loopTween.current = null;
      };
    },
    { dependencies: [reduced] },
  );

  function focus(index: number) {
    setFocused(index);
    if (!loopTween.current) return;
    speedTween.current?.kill();
    speedTween.current = gsap.to(loopTween.current, {
      timeScale: 0,
      duration: 0.7,
      ease: "power2.out",
    });
  }

  function blur() {
    setFocused(null);
    if (!loopTween.current) return;
    speedTween.current?.kill();
    speedTween.current = gsap.to(loopTween.current, {
      timeScale: 1,
      duration: 0.75,
      ease: "power2.inOut",
    });
  }

  const row = [...clientLogos, ...clientLogos];

  return (
    <div
      aria-label="Clients"
      className="marquee-surface border-border relative overflow-hidden border-y mask-[linear-gradient(90deg,transparent,#000_11%,#000_89%,transparent)] py-7 [background:linear-gradient(180deg,#f7f6f2_0%,#f3f1ea_100%)]"
    >
      <div className="mb-5.5 flex justify-center">
        <span className="shimmer-label font-mono text-[10.5px] tracking-[0.2em] uppercase">
          {marquee.label}
        </span>
      </div>

      <div ref={track} className="relative z-1 flex w-max items-center gap-14">
        {row.map((logo, i) => (
          <span
            key={`${logo.name}-${i}`}
            onMouseEnter={() => focus(i)}
            onMouseLeave={blur}
            className={cn(
              "group/logo inline-flex cursor-default items-center gap-2.5 text-[#8a8b84] transition-[transform,color,opacity,filter] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform",
              focused === i && "text-brand scale-[1.1] opacity-100",
              focused !== null && focused !== i && "opacity-65",
            )}
          >
            <svg
              aria-hidden
              width="26"
              height="26"
              viewBox="0 0 32 32"
              fill="none"
              className="transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
            >
              {ICONS[logo.icon]}
            </svg>
            <span className="text-[20px] font-semibold tracking-[-0.02em] whitespace-nowrap">
              {logo.name}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
