"use client";

import type { MouseEvent } from "react";
import { AmbientField } from "@/components/common/ambient-field";
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
      data-cursor-tone="violet"
      className="relative isolate scroll-mt-24 overflow-hidden border-t border-white/[0.07] py-26 text-[#f2f3ed] [background:radial-gradient(ellipse_62%_48%_at_16%_0%,rgba(91,75,174,0.24),transparent_68%),radial-gradient(ellipse_54%_46%_at_88%_14%,rgba(5,150,105,0.18),transparent_70%),linear-gradient(180deg,#101419_0%,#090c10_100%)]"
    >
      <AmbientField
        variant="violet"
        className="ambient-dark opacity-80 mix-blend-screen"
      />
      <div className="relative z-1 mx-auto max-w-310 px-5 md:px-9">
        <Reveal>
          <SectionHeading
            eyebrow={proof.eyebrow}
            title={proof.title}
            className="dark-heading"
          />
        </Reveal>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {proof.cases.map((c, i) => (
            <Reveal key={c.title} delay={i * 0.09}>
              <article
                onMouseMove={spotlight}
                className="group relative h-full overflow-hidden rounded-[17px] border border-white/[0.10] bg-white/[0.055] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-md transition-all duration-300 hover:-translate-y-1.75 hover:border-[rgba(47,232,92,0.30)] hover:bg-white/[0.075] hover:shadow-[0_24px_60px_rgba(0,0,0,0.34),0_0_32px_rgba(47,232,92,0.07)]"
              >
                <span className="pointer-events-none absolute inset-0 z-3 opacity-0 transition-opacity duration-300 [background:radial-gradient(340px_circle_at_var(--x)_var(--y),rgba(125,108,225,0.23),rgba(47,232,92,0.08)_38%,transparent_68%)] group-hover:opacity-100" />

                <div className="flex h-38 flex-col gap-2 border-b border-white/[0.07] bg-black/24 p-4">
                  {c.thumb.map((w, k) => (
                    <span
                      key={k}
                      className={`h-2.25 rounded-[3px] bg-[#252a30] ${BAR_WIDTH[w] ?? "w-3/5"}`}
                    />
                  ))}
                  <div className="mt-auto flex gap-1.5">
                    {[0, 1, 2].map((k) => (
                      <span
                        key={k}
                        className="h-7 flex-1 rounded-[7px] border border-white/[0.07] bg-[#171b20]"
                      />
                    ))}
                  </div>
                </div>

                <div className="p-5">
                  <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(47,232,92,0.22)] bg-[rgba(47,232,92,0.08)] px-2.5 py-1 font-mono text-[10px] tracking-widest text-[#72ef9a] uppercase">
                    <span className="bg-brand size-1.25 animate-pulse rounded-full" />
                    {c.status}
                  </span>
                  <h3 className="mt-3.5 mb-2 text-[17px] leading-tight font-medium tracking-[-0.012em]">
                    {c.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-[#a8aea5]">
                    {c.body}
                  </p>
                  <p className="mt-4 border-t border-white/[0.08] pt-3.5 font-mono text-[11px] text-[#737a72]">
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
