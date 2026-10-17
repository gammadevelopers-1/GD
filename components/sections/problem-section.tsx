import { Reveal } from "@/components/common/reveal";
import { Section } from "@/components/common/section";
import { SectionHeading } from "@/components/common/section-heading";
import { problem } from "@/lib/content/home";

export function ProblemSection() {
  return (
    <Section id="problem" tone="light" divide="bottom" className="scroll-mt-24">
      <Reveal className="max-w-[720px]">
        <SectionHeading
          eyebrow={problem.eyebrow}
          title={problem.title}
          className="max-w-none"
        />
        <p className="marketing-section-copy mt-4">{problem.body}</p>
      </Reveal>

      <div className="mt-14 grid gap-px overflow-hidden rounded-[20px] border border-black/[0.08] bg-black/[0.08] sm:grid-cols-2">
        {problem.scenarios.map((scenario, i) => (
          <Reveal key={scenario.when} delay={i * 0.07} className="h-full">
            <div className="bg-surface h-full p-7">
              <span className="t-eyebrow text-black/40">{scenario.when}</span>
              <p className="text-gd-light-headline t-lead mt-3.5">
                {scenario.body}
              </p>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.1}>
        <p className="font-display text-gd-light-headline t-h3 mt-12 max-w-[54ch]">
          {problem.close}
        </p>
      </Reveal>
    </Section>
  );
}
