"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { useHero } from "./hero-provider";

export function AuditTags() {
  const { activeFindings, fixes, phase, problems } = useHero();
  const newestFinding = activeFindings[activeFindings.length - 1];
  const scope = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const visible = phase === "problems" || phase === "fixes" || phase === "done";
  const signature = `${problems.join("|")}::${fixes.join("|")}`;

  useGSAP(
    () => {
      if (!visible || reduced) return;
      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .fromTo(
          "[data-audit-table]",
          {
            opacity: 0,
            y: 34,
            scaleY: 0.82,
            filter: "blur(12px)",
            clipPath: "inset(0 0 100% 0 round 8px)",
          },
          {
            opacity: 1,
            y: 0,
            scaleY: 1,
            filter: "blur(0px)",
            clipPath: "inset(0 0 0% 0 round 8px)",
            duration: 0.8,
            stagger: 0.13,
          },
        )
        .from(
          "[data-audit-row]",
          { opacity: 0, x: -12, duration: 0.42, stagger: 0.045 },
          0.3,
        );
    },
    { scope, dependencies: [visible, signature, reduced] },
  );

  useGSAP(
    () => {
      if (!newestFinding || reduced) return;
      gsap.fromTo(
        `[data-audit-row='bad-${newestFinding.index}']`,
        { x: 0, scale: 1 },
        {
          x: 5,
          scale: 1.015,
          duration: 0.38,
          yoyo: true,
          repeat: 1,
          ease: "power2.inOut",
        },
      );
    },
    { scope, dependencies: [newestFinding?.id, reduced] },
  );

  if (!visible) return null;

  const panels = [
    { title: "Flaws detected", tone: "bad" as const, items: problems },
    { title: "Solutions Found", tone: "ok" as const, items: fixes },
  ];

  return (
    <div
      ref={scope}
      aria-live="polite"
      className="pointer-events-none mt-9 grid gap-3 text-left md:absolute md:inset-x-6 md:bottom-7 md:z-[5] md:mt-0 md:grid-cols-[minmax(0,370px)_1fr_minmax(0,370px)] md:gap-7"
    >
      {panels.map((panel, panelIndex) => (
        <section
          key={panel.tone}
          data-audit-table
          data-cursor-interactive
          className={`audit-table pointer-events-auto overflow-hidden rounded-lg border bg-white/72 shadow-[0_18px_52px_rgba(20,23,26,0.10)] backdrop-blur-xl ${
            panel.tone === "bad"
              ? "border-[#303732]/18 text-[#303732] md:col-start-1"
              : "border-[#059669]/24 text-[#047857] md:col-start-3"
          }`}
        >
          <header className="flex h-11 items-center justify-between border-b border-current/10 px-4">
            <span className="flex items-center gap-2.5 text-[12px] font-semibold">
              {panel.title}
            </span>
            <span className="font-mono text-[9px] tracking-[0.12em] opacity-55">
              0{panel.items.length}
            </span>
          </header>
          <ol>
            {panel.items.map((item, index) => {
              const active = activeFindings.some(
                (finding) => finding.index === index,
              );
              return (
                <li
                  key={`${panel.tone}-${item}`}
                  data-audit-row={`${panel.tone}-${index}`}
                  className={`audit-table-row group flex min-h-9 items-center gap-3 border-b border-current/8 px-4 py-2 text-[12px] leading-[1.35] last:border-b-0 ${
                    active
                      ? panel.tone === "bad"
                        ? "bg-[#303732]/7"
                        : "bg-[#2fe85c]/10"
                      : "bg-transparent"
                  }`}
                >
                  <span className="audit-table-index w-5 shrink-0 font-mono text-[9px] opacity-45">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="audit-table-value font-medium text-[#252b27]">
                    {item}
                  </span>
                  <i
                    className={`audit-table-rule ml-auto h-px w-4 shrink-0 not-italic ${panelIndex === 0 ? "bg-[#4e5650]/35" : "bg-[#059669]/45"}`}
                  />
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}
