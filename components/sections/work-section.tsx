"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/common/reveal";
import { SectionHeading } from "@/components/common/section-heading";
import { work } from "@/lib/content/home";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function WorkSection() {
  const [filter, setFilter] = useState<string>("all");
  const cases = work.cases.filter(
    (item) => filter === "all" || item.category === filter,
  );

  return (
    <section
      id="work"
      className="marketing-section relative scroll-mt-24 overflow-hidden [background:radial-gradient(circle_at_1px_1px,rgba(20,23,26,0.055)_1px,transparent_0)_0_0/24px_24px,linear-gradient(180deg,#f6f7f1,#eef1ea)]"
    >
      <div className="marketing-container relative z-1">
        <Reveal>
          <SectionHeading eyebrow={work.eyebrow} title={work.title} />
          <p className="marketing-section-copy mt-4">{work.body}</p>
        </Reveal>

        <Reveal delay={0.05} className="mt-7.5">
          <div className="flex flex-wrap gap-2.25">
            {work.filters.map((item) => (
              <Button
                variant="bare"
                size="none"
                key={item.key}
                type="button"
                onClick={() => setFilter(item.key)}
                aria-pressed={filter === item.key}
                className={cn(
                  "focus-visible:ring-brand/50 cursor-pointer rounded-full border px-4.25 py-2.25 text-[13px] font-semibold whitespace-nowrap transition-all duration-250 focus-visible:ring-2 focus-visible:outline-none",
                  filter === item.key
                    ? "border-[#14171a] bg-[#14171a] text-white"
                    : "text-muted-foreground border-black/12 bg-white hover:border-[rgba(47,232,92,0.6)] hover:text-[#059669]",
                )}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </Reveal>

        <div className="mt-8 grid gap-5.5 md:grid-cols-2 lg:grid-cols-3">
          {cases.map((item, i) => {
            return (
              <Reveal key={item.title} delay={i * 0.05} className="h-full">
                <Link
                  href="/contact"
                  className="card-surface card-lift group/case focus-visible:ring-brand/50 flex h-full flex-col overflow-hidden rounded-[20px] focus-visible:ring-2 focus-visible:outline-none"
                >
                  <div className="relative h-38 overflow-hidden bg-[#0d1013]">
                    <Image
                      src={item.image}
                      alt={`${item.title} project preview`}
                      fill
                      sizes="(min-width: 1024px) 390px, (min-width: 768px) calc(50vw - 3rem), calc(100vw - 2.5rem)"
                      className="object-cover object-center transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/case:scale-[1.04]"
                    />
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/5"
                    />
                    <span className="bg-brand absolute top-3 right-3 z-2 inline-flex items-center rounded-full px-2 py-1 font-mono text-[9.5px] tracking-[0.1em] text-[#101512] uppercase">
                      Live
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col p-5.5">
                    <span className="mb-3 font-mono text-[10px] tracking-[0.14em] text-black/40 uppercase">
                      {item.sector}
                    </span>
                    <h3 className="font-display mb-2 text-[18px] leading-tight font-semibold tracking-[-0.025em]">
                      {item.title}
                    </h3>
                    <p className="text-muted-foreground mb-4.5 text-[13.5px] leading-[1.55]">
                      {item.body}
                    </p>
                    <div className="mb-4 flex flex-wrap gap-1.5">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-gd-light-emerald rounded-full border border-[rgba(47,232,92,0.28)] bg-[rgba(47,232,92,0.08)] px-2.25 py-1 font-mono text-[10px]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <span className="text-gd-light-emerald border-border mt-auto inline-flex items-center gap-2 border-t pt-3.5 text-[13px] font-semibold">
                      Read case study
                      <ArrowRight className="size-4 transition-transform duration-300 group-hover/case:translate-x-1" />
                    </span>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
