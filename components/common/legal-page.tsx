import { PageHero } from "@/components/common/page-hero";
import { Reveal } from "@/components/common/reveal";
import { Section } from "@/components/common/section";
import type { LegalDocument } from "@/lib/content/legal";

export function LegalPage({ doc }: { doc: LegalDocument }) {
  return (
    <main id="top">
      <PageHero
        eyebrow={`Updated ${doc.updated}`}
        title={doc.title}
        body={doc.intro}
      />

      <Section tone="light">
        <div className="max-w-[70ch]">
          {doc.sections.map((section, i) => (
            <Reveal key={section.heading} delay={i * 0.04}>
              <section className="not-first:mt-12">
                <h2 className="font-display text-gd-light-headline t-h3">
                  {section.heading}
                </h2>
                {section.body.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="text-gd-light-muted t-body mt-4 leading-[1.7]"
                  >
                    {paragraph}
                  </p>
                ))}
              </section>
            </Reveal>
          ))}
        </div>
      </Section>
    </main>
  );
}
