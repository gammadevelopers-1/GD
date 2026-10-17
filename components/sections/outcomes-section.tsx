import { Reveal } from "@/components/common/reveal";
import { Section } from "@/components/common/section";
import { SectionHeading } from "@/components/common/section-heading";
import { StatBlock } from "@/components/common/stat-block";
import { outcomes } from "@/lib/content/home";

export function OutcomesSection() {
  return (
    <Section tone="light" divide="bottom">
      <Reveal>
        <SectionHeading eyebrow={outcomes.eyebrow} title={outcomes.title} />
        <p className="marketing-section-copy mt-4">{outcomes.body}</p>
      </Reveal>

      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {outcomes.stats.map((stat, i) => (
          <Reveal key={stat.label} delay={i * 0.09} className="h-full">
            <StatBlock
              tone="light"
              value={stat.value}
              decimals={"decimals" in stat ? stat.decimals : 0}
              suffix={"suffix" in stat ? stat.suffix : ""}
              unit={"unit" in stat ? stat.unit : undefined}
              body={stat.body}
              label={stat.label}
            />
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
