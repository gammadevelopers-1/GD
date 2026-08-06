"use client";

import { useRef, useState } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { Reveal } from "@/components/common/reveal";
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
      className="border-border bg-secondary scroll-mt-24 border-t"
    >
      <div className="mx-auto max-w-[1240px] px-5 pt-22 md:px-9">
        <Reveal>
          <SectionHeading
            eyebrow={capabilities.eyebrow}
            title={capabilities.title}
          />
        </Reveal>
      </div>

      <div className="mx-auto max-w-[1240px] px-5 md:px-9">
        <Reveal delay={0.08}>
          <div className="border-border mt-14 grid border-t lg:grid-cols-[1.05fr_1fr]">
            <div className="border-border lg:border-r">
              {capabilities.items.map((item, i) => (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => setActive(i)}
                  aria-pressed={active === i}
                  className={cn(
                    "border-border relative block w-full cursor-pointer border-b py-7 pr-10 pl-8 text-left transition-colors",
                    active === i
                      ? "bg-white/70 dark:bg-white/5"
                      : "hover:bg-white/40 dark:hover:bg-white/[0.02]",
                  )}
                >
                  <span
                    className={cn(
                      "bg-brand absolute inset-y-0 left-0 w-0.5 origin-center transition-transform duration-300",
                      active === i ? "scale-y-100" : "scale-y-0",
                    )}
                  />
                  <h3
                    className={cn(
                      "mb-2 text-[17px] leading-tight font-medium tracking-[-0.012em] transition-colors",
                      active === i && "text-accent",
                    )}
                  >
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground max-w-[46ch] text-sm leading-relaxed">
                    {item.body}
                  </p>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-center p-9">
              <div className="w-full max-w-[400px] overflow-hidden rounded-[15px] border border-black/40 bg-[#14171a] font-mono text-xs shadow-[0_24px_60px_rgba(20,23,26,0.16)]">
                <div className="border-b border-white/10 px-4 py-3.5 text-[10.5px] tracking-[0.11em] text-[#7d837a] uppercase">
                  {panel.label}
                </div>
                <div ref={panelScope} className="p-4">
                  {panel.rows.map(([k, v]) => (
                    <div
                      key={k}
                      data-panel-row
                      className="flex items-center justify-between border-b border-white/[0.055] py-2.5 text-[#9aa096] last:border-0"
                    >
                      <span className="flex items-center text-[#eceae2]">
                        <span className="bg-brand mr-2 size-1.5 animate-pulse rounded-full" />
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
