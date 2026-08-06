"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { Reveal } from "@/components/common/reveal";
import { SectionHeading } from "@/components/common/section-heading";
import { flow } from "@/lib/content/home";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";

const RAIL_START = 9;
const RAIL_END = 91;

export function FlowSection() {
  const scope = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      if (reduced) return;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: scope.current,
          start: "top 82%",
          end: "center 42%",
          scrub: 0.6,
        },
      });

      tl.fromTo(
        ".flow-packet",
        { left: `${RAIL_START}%` },
        { left: `${RAIL_END}%`, ease: "none" },
        0,
      ).fromTo(
        ".flow-fill",
        { width: "0%" },
        { width: "100%", ease: "none" },
        0,
      );

      gsap.utils.toArray<HTMLElement>(".flow-node").forEach((node, i) => {
        gsap.to(node, {
          borderColor: "var(--accent)",
          color: "var(--accent)",
          y: -4,
          boxShadow: "0 10px 30px rgba(5,150,105,0.14)",
          duration: 0.3,
          ease: "power2.out",
          scrollTrigger: {
            trigger: scope.current,
            start: `top ${82 - i * 8}%`,
            end: "center 42%",
            toggleActions: "play none none reverse",
          },
        });
        gsap.to(node.querySelector(".flow-ring"), {
          opacity: 1,
          scale: 1,
          duration: 0.3,
          scrollTrigger: {
            trigger: scope.current,
            start: `top ${82 - i * 8}%`,
            end: "center 42%",
            toggleActions: "play none none reverse",
          },
        });
      });
    },
    { scope, dependencies: [reduced] },
  );

  return (
    <section id="flow" className="bg-background scroll-mt-24 py-28">
      <div className="mx-auto max-w-[1240px] px-5 md:px-9">
        <Reveal>
          <SectionHeading eyebrow={flow.eyebrow} title={flow.title} />
        </Reveal>

        <div
          ref={scope}
          className="relative mt-16 grid grid-cols-2 gap-9 lg:grid-cols-5 lg:gap-0"
        >
          <div className="border-border absolute top-[38px] right-[9%] left-[9%] hidden h-px bg-current/20 lg:block">
            <span className="flow-fill bg-accent absolute inset-y-0 left-0 block w-0 shadow-[0_0_10px_rgba(5,150,105,0.5)]" />
          </div>
          <span className="flow-packet bg-brand absolute top-[34px] left-[9%] z-[2] hidden size-[9px] rounded-full shadow-[0_0_16px_rgba(47,232,92,0.95)] lg:block" />

          {flow.steps.map((step) => (
            <div key={step.key} className="relative px-3 text-center">
              <div className="flow-node border-border bg-card text-muted-foreground relative mx-auto mb-5 grid size-[76px] place-items-center rounded-[17px] border font-mono text-[11px]">
                {step.key}
                <span className="flow-ring absolute -inset-2 scale-95 rounded-[22px] border border-[rgba(5,150,105,0.22)] opacity-0" />
              </div>
              <span className="text-muted-foreground mb-2.5 block font-mono text-[10px] tracking-[0.14em]">
                {step.num}
              </span>
              <h3 className="mb-2 text-[17px] leading-tight font-medium tracking-[-0.012em]">
                {step.title}
              </h3>
              <p className="text-muted-foreground text-[13.5px] leading-[1.55]">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
