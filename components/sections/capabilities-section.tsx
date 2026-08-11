"use client";

import { useRef, useState } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { Reveal } from "@/components/common/reveal";
import { AmbientField } from "@/components/common/ambient-field";
import { SectionHeading } from "@/components/common/section-heading";
import { capabilities } from "@/lib/content/home";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

export function CapabilitiesSection() {
  const [active, setActive] = useState(0);
  const panelScope = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const panel = capabilities.items[active].panel;

  useGSAP(
    () => {
      if (reduced) return;
      gsap.fromTo(
        "[data-panel-row]",
        { opacity: 0, x: -10 },
        { opacity: 1, x: 0, duration: 0.45, ease: "power3.out", stagger: 0.07 },
      );
    },
    { scope: panelScope, dependencies: [active, reduced] },
  );

  return (
    <section
      id="capabilities"
      data-cursor-tone="mint"
      className="border-border bg-secondary relative isolate scroll-mt-24 overflow-hidden border-t [background:radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(47,232,92,0.09),transparent_66%),linear-gradient(180deg,#f1f5ed_0%,#e9eee6_100%)]"
    >
      <AmbientField variant="mint" className="opacity-75" />
      <div className="relative z-1 mx-auto max-w-310 px-5 pt-22 md:px-9">
        <Reveal>
          <SectionHeading
            eyebrow={capabilities.eyebrow}
            title={capabilities.title}
          />
        </Reveal>
      </div>

      <div className="relative z-1 mx-auto max-w-310 px-5 md:px-9">
        <Reveal delay={0.08}>
          <div className="border-border mt-14 grid border-t lg:grid-cols-[1.05fr_1fr]">
            <div className="border-border lg:border-r">
              {capabilities.items.map((item, i) => (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => setActive(i)}
                  aria-pressed={active === i}
                  data-button-fill
                  className={cn(
                    "button-fill-fx button-fill-fx--soft border-border relative block w-full cursor-pointer overflow-hidden border-b py-7 pr-10 pl-8 text-left transition-all duration-300",
                    active === i
                      ? "bg-white/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]"
                      : "hover:translate-x-1 hover:bg-white/55",
                  )}
                >
                  <span
                    className={cn(
                      "bg-brand absolute inset-y-0 left-0 z-[2] w-0.5 origin-center shadow-[0_0_18px_rgba(47,232,92,0.7)] transition-transform duration-300",
                      active === i ? "scale-y-100" : "scale-y-0",
                    )}
                  />
                  <h3
                    className={cn(
                      "font-display relative z-[1] mb-2 text-[17px] leading-tight font-semibold tracking-[-0.025em] transition-colors",
                      active === i && "text-accent",
                    )}
                  >
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground relative z-[1] max-w-[46ch] text-sm leading-relaxed">
                    {item.body}
                  </p>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-center p-9">
              <div className="terminal-glare w-full max-w-100 overflow-hidden rounded-[18px] border border-black/45 bg-[#0d1013] font-mono text-xs shadow-[0_28px_70px_rgba(20,23,26,0.22)] ring-1 ring-white/5">
                <div className="border-b border-white/10 bg-[linear-gradient(90deg,rgba(47,232,92,0.08),transparent_36%,rgba(20,23,26,0.18))] px-4 py-3.5 text-[10.5px] tracking-[0.11em] text-[#90978d] uppercase">
                  {panel.label}
                </div>
                <div ref={panelScope} className="p-4">
                  {panel.rows.map(([k, v]) => (
                    <div
                      key={k}
                      data-panel-row
                      className="flex items-center justify-between border-b border-white/5.5 py-2.5 text-[#9aa096] transition-transform duration-300 last:border-0 hover:translate-x-0.5"
                    >
                      <span className="flex items-center text-[#eceae2]">
                        <span className="bg-brand mr-2 size-1.5 animate-pulse rounded-full shadow-[0_0_12px_rgba(47,232,92,0.75)]" />
                        {k}
                      </span>
                      <span className="text-[11px] text-[#34d399]">{v}</span>
                    </div>
                  ))}
                  <p
                    data-panel-row
                    className="pt-3.5 text-[11px] text-[#6d736a]"
                  >
                    {panel.footer}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
