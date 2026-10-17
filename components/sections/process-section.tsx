import { BarChart3, Blocks, Check, Search } from "lucide-react";
import { Reveal } from "@/components/common/reveal";
import { Section } from "@/components/common/section";
import { SectionHeading } from "@/components/common/section-heading";
import { method } from "@/lib/content/home";

const PHASE_ICONS = {
  search: Search,
  build: Blocks,
  run: BarChart3,
} as const;

export function ProcessSection() {
  return (
    <Section id="process" tone="light" divide="bottom" className="scroll-mt-24">
      <Reveal className="max-w-[680px]">
        <SectionHeading
          eyebrow={method.eyebrow}
          title={method.title}
          className="max-w-none"
        />
        <p className="marketing-section-copy mt-4">{method.body}</p>
      </Reveal>

      <div className="relative mt-14 grid gap-6 md:grid-cols-3">
        <span
          aria-hidden
          className="absolute inset-x-0 top-[26px] hidden h-px bg-black/[0.09] md:block"
        />

        {method.phases.map((phase, i) => {
          const Icon = PHASE_ICONS[phase.icon];
          return (
            <Reveal key={phase.title} delay={i * 0.09}>
              <article className="relative h-full">
                <span className="bg-surface relative z-1 mb-6 grid size-13 place-items-center rounded-full border border-black/[0.09] text-black/70">
                  <Icon className="size-5" strokeWidth={1.6} />
                </span>

                <div className="flex items-baseline gap-3">
                  <h3 className="font-display text-gd-light-headline t-h4">
                    {phase.title}
                  </h3>
                  <span className="t-eyebrow text-black/35">{phase.when}</span>
                </div>

                <p className="text-gd-light-muted t-body mt-3 max-w-[42ch]">
                  {phase.body}
                </p>

                <ul className="mt-5 flex flex-col gap-2.5">
                  {phase.points.map((point) => (
                    <li
                      key={point}
                      className="text-gd-light-muted t-meta flex items-start gap-2.5"
                    >
                      <span className="text-green-ink mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-[rgba(47,232,92,0.16)]">
                        <Check className="size-2.5" strokeWidth={3} />
                      </span>
                      {point}
                    </li>
                  ))}
                </ul>
              </article>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}
