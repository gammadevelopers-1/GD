"use client";

import type { MouseEvent } from "react";
import { Reveal } from "@/components/common/reveal";
import { SectionHeading } from "@/components/common/section-heading";
import { proof } from "@/lib/content/home";

const BAR_WIDTH: Record<string, string> = {
  w4: "w-2/5",
  w6: "w-3/5",
  w8: "w-4/5",
  "w4-accent": "w-2/5 bg-brand/60",
  "w6-accent": "w-3/5 bg-brand/60",
  "w8-accent": "w-4/5 bg-brand/60",
};

export function ProofSection() {
  function spotlight(e: MouseEvent<HTMLElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--x", `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty("--y", `${e.clientY - rect.top}px`);
  }

  return (
    <section
      id="work"
      className="border-border bg-background scroll-mt-24 border-t py-26"
    >
      <div className="mx-auto max-w-[1240px] px-5 md:px-9">
        <Reveal>
          <SectionHeading eyebrow={proof.eyebrow} title={proof.title} />
        </Reveal>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {proof.cases.map((c, i) => (
            <Reveal key={c.title} delay={i * 0.09}>
              <article
                onMouseMove={spotlight}
                className="group border-border bg-card relative h-full overflow-hidden rounded-[17px] border transition-all duration-300 hover:-translate-y-[7px] hover:border-black/20 hover:shadow-[0_22px_50px_rgba(20,23,26,0.10)]"
              >
                <span className="pointer-events-none absolute inset-0 z-[3] opacity-0 transition-opacity duration-300 [background:radial-gradient(320px_circle_at_var(--x)_var(--y),rgba(47,232,92,0.13),transparent_62%)] group-hover:opacity-100" />

                <div className="flex h-[152px] flex-col gap-2 bg-[#14171a] p-4">
                  {c.thumb.map((w, k) => (
                    <span
                      key={k}
                      className={`h-[9px] rounded-[3px] bg-[#262b31] ${BAR_WIDTH[w] ?? "w-3/5"}`}
                    />
                  ))}
                  <div className="mt-auto flex gap-1.5">
                    {[0, 1, 2].map((k) => (
                      <span
                        key={k}
                        className="h-7 flex-1 rounded-[7px] border border-white/[0.07] bg-[#1b1f25]"
                      />
                    ))}
                  </div>
                </div>

                <div className="p-5">
                  <span className="text-accent inline-flex items-center gap-2 rounded-full border border-[rgba(5,150,105,0.22)] bg-[rgba(5,150,105,0.08)] px-2.5 py-1 font-mono text-[10px] tracking-[0.1em] uppercase">
                    <span className="bg-brand size-[5px] animate-pulse rounded-full" />
                    {c.status}
                  </span>
                  <h3 className="mt-3.5 mb-2 text-[17px] leading-tight font-medium tracking-[-0.012em]">
                    {c.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {c.body}
                  </p>
                  <p className="border-border text-muted-foreground mt-4 border-t pt-3.5 font-mono text-[11px]">
                    {c.meta}
                  </p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
