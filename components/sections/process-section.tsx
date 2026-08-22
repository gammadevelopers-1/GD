import { BarChart3, Blocks, Check, Search } from "lucide-react";
import { Reveal } from "@/components/common/reveal";
import { SectionHeading } from "@/components/common/section-heading";
import { method } from "@/lib/content/home";
import { FlowConsole } from "./flow-console";

const PHASE_ICONS = {
  search: Search,
  build: Blocks,
  run: BarChart3,
} as const;

export function ProcessSection() {
  return (
    <section
      id="process"
      className="marketing-section border-border relative scroll-mt-24 overflow-hidden border-b [background:linear-gradient(rgba(20,23,26,0.028)_1px,transparent_1px)_0_0/44px_44px,linear-gradient(90deg,rgba(20,23,26,0.028)_1px,transparent_1px)_0_0/44px_44px,radial-gradient(ellipse_72%_46%_at_50%_0%,rgba(47,232,92,0.08),transparent_62%),linear-gradient(180deg,#f2f5f3_0%,#f8f8f4_100%)]"
    >
      <div className="marketing-container relative z-1">
        <Reveal className="max-w-[640px]">
          <SectionHeading
            eyebrow={method.eyebrow}
            title={method.title}
            className="max-w-none"
          />
          <p className="marketing-section-copy mt-4">{method.body}</p>
        </Reveal>

        <Reveal delay={0.06} className="mt-11">
          <FlowConsole />
        </Reveal>

        <div className="mt-14 grid gap-5.5 md:grid-cols-3">
          {method.phases.map((phase, i) => {
            const Icon = PHASE_ICONS[phase.icon];
            return (
              <Reveal key={phase.title} delay={i * 0.09}>
                <article className="card-surface card-lift border-border relative h-full overflow-hidden rounded-[20px] border p-7 hover:border-[rgba(47,232,92,0.5)]">
                  <span
                    aria-hidden
                    className="font-display absolute -top-3.5 right-0.5 text-[96px] leading-none font-bold tracking-[-0.05em] text-black/4"
                  >
                    {phase.num}
                  </span>
                  <div className="relative">
                    <span className="text-brand mb-4.5 grid size-11 place-items-center rounded-xl bg-[#101512]">
                      <Icon className="size-5.5" strokeWidth={1.7} />
                    </span>
                    <div className="flex items-baseline justify-between gap-2.5">
                      <h3 className="font-display text-xl font-semibold tracking-[-0.025em]">
                        {phase.title}
                      </h3>
                      <span className="font-mono text-[10.5px] tracking-[0.14em] text-black/40 uppercase">
                        {phase.when}
                      </span>
                    </div>
                    <p className="text-muted-foreground mt-2.5 mb-4 text-sm leading-[1.6]">
                      {phase.body}
                    </p>
                    <ul className="flex flex-col gap-2.25">
                      {phase.points.map((point) => (
                        <li
                          key={point}
                          className="text-muted-foreground flex items-start gap-2.25 text-[13px]"
                        >
                          <span className="text-gd-light-emerald mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-[rgba(47,232,92,0.12)]">
                            <Check className="size-2.5" strokeWidth={3} />
                          </span>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
