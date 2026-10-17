import { ObjectionAccordion } from "@/components/common/objection-accordion";
import { Reveal } from "@/components/common/reveal";
import { Section } from "@/components/common/section";
import { SectionHeading } from "@/components/common/section-heading";
import { objections } from "@/lib/content/home";

export function ObjectionsSection() {
  return (
    <Section
      id="objections"
      tone="light"
      divide="bottom"
      className="scroll-mt-24"
    >
      <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
        <Reveal>
          <SectionHeading
            eyebrow={objections.eyebrow}
            title={objections.title}
          />
          <div className="border-border bg-surface mt-8 rounded-[18px] border p-6">
            <h3 className="font-display text-gd-light-headline t-h4">
              {objections.limit.title}
            </h3>
            <p className="text-gd-light-muted t-meta mt-2.5">
              {objections.limit.body}
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <ObjectionAccordion items={objections.items} />
        </Reveal>
      </div>
    </Section>
  );
}
