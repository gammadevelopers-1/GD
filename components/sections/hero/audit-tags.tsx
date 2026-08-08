"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { useHero } from "./hero-provider";

export function AuditTags() {
  const { activeFinding } = useHero();
  const scope = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      if (!activeFinding || reduced) return;

      const isFlaw = activeFinding.tone === "bad";
      gsap
        .timeline()
        .fromTo(
          "[data-audit-signal]",
          {
            opacity: 0,
            x: isFlaw ? -28 : -105,
            scale: 0.94,
            filter: "blur(7px)",
          },
          {
            opacity: 1,
            x: 0,
            scale: 1,
            filter: "blur(0px)",
            duration: 0.34,
            ease: "power3.out",
          },
        )
        .fromTo(
          "[data-audit-progress]",
          { scaleX: 0, opacity: 0 },
          {
            scaleX: 1,
            opacity: 1,
            duration: 0.82,
            ease: "power1.inOut",
          },
          0.16,
        )
        .to(
          "[data-audit-signal]",
          {
            opacity: 0,
            x: isFlaw ? 105 : 28,
            scale: 0.96,
            filter: "blur(7px)",
            duration: 0.3,
            ease: "power2.in",
          },
          1.02,
        );
    },
    { scope, dependencies: [activeFinding?.id, reduced] },
  );

  if (!activeFinding) return null;

  const isFlaw = activeFinding.tone === "bad";
  return (
    <div
      ref={scope}
      aria-live="polite"
      className="pointer-events-none absolute inset-0 z-[3] block"
    >
      <div
        key={activeFinding.id}
        className={`absolute inset-x-5 top-[18%] flex justify-center md:top-[42%] ${isFlaw ? "md:justify-start" : "md:justify-end"}`}
      >
        <div
          data-audit-signal
          className={`w-full max-w-[340px] overflow-hidden rounded-2xl border px-4 py-3.5 text-left shadow-[0_14px_40px_rgba(20,23,26,0.12)] backdrop-blur-xl md:w-[28vw] ${
            isFlaw
              ? "border-[rgba(180,64,44,0.28)] bg-[#fff8f4]/90 text-[#8f3025]"
              : "border-[rgba(5,150,105,0.30)] bg-[#f5fff8]/90 text-[#047857]"
          }`}
        >
          <span className="mb-2 flex items-center justify-between font-mono text-[8.5px] tracking-[0.15em] uppercase opacity-65">
            <span>{isFlaw ? "Flaw" : "Solution"}</span>
            <span>
              {String(activeFinding.index + 1).padStart(2, "0")} /{" "}
              {String(activeFinding.total).padStart(2, "0")}
            </span>
          </span>
          <span className="flex items-center gap-2.5 text-[13px] font-medium text-current">
            <i
              className={`size-2 shrink-0 rounded-full not-italic shadow-[0_0_12px_currentColor] ${isFlaw ? "bg-[#c74a38]" : "bg-brand"}`}
            />
            {activeFinding.label}
          </span>
          <span className="mt-3 block h-px overflow-hidden bg-current/12">
            <i
              data-audit-progress
              className="block h-full origin-left bg-current/55"
            />
          </span>
        </div>
      </div>
    </div>
  );
}
