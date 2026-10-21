import { StoryProgress } from "@/components/gamma/story-sections";
import { StoryRail } from "@/components/gamma/story-rail";
import type { LegalDocument } from "@/lib/content/legal";
import { site } from "@/lib/content/site";

/** Headings become anchors, so the rail can scroll to them. */
function slugify(heading: string) {
  return heading
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Privacy and Terms, in the same language as the rest of the site: the dark
 * hero every page opens with, then the document beside the sticky contents
 * rail the case studies use. A policy is the longest unbroken text here and
 * benefits from a rail more than anything else does.
 */
export function LegalPage({ doc }: { doc: LegalDocument }) {
  const sections = doc.sections.map((section) => ({
    id: slugify(section.heading),
    label: section.heading,
  }));

  return (
    <main id="top">
      <StoryProgress />

      <section className="bg-dark relative isolate overflow-hidden">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 opacity-[0.6]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(236,236,228,0.030) 1px, transparent 1px), linear-gradient(90deg, rgba(236,236,228,0.030) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            maskImage:
              "radial-gradient(100% 92% at 50% 24%, #000 0%, rgba(0,0,0,0.55) 58%, transparent 92%)",
            WebkitMaskImage:
              "radial-gradient(100% 92% at 50% 24%, #000 0%, rgba(0,0,0,0.55) 58%, transparent 92%)",
          }}
        />

        {/* Clears the fixed nav, which is dark while this hero is behind it. */}
        <div aria-hidden className="h-[72px] shrink-0" />

        <div className="mx-auto w-full max-w-[1280px] px-6 pt-[clamp(28px,3.4vw,48px)] pb-[clamp(40px,4.6vw,68px)]">
          <p className="t-eyebrow text-brand">Updated {doc.updated}</p>

          <h1 className="font-display text-dark-head mt-[clamp(14px,1.6vw,22px)] text-[clamp(38px,6vw,78px)] leading-[0.94] font-bold tracking-[-0.05em] uppercase">
            {doc.title}
          </h1>

          <p className="text-dark-body mt-[clamp(18px,2vw,28px)] max-w-[70ch] text-[clamp(16px,1.6vw,19px)] leading-[1.65] text-pretty">
            {doc.intro}
          </p>
        </div>
      </section>

      <div className="bg-ground">
        <div className="mx-auto grid w-full max-w-[1280px] gap-x-[clamp(32px,3.6vw,72px)] px-6 py-[clamp(44px,4.8vw,76px)] lg:grid-cols-[224px_minmax(0,1fr)]">
          <StoryRail
            sections={sections}
            meta={[
              { label: "Entity", value: site.legalName },
              { label: "Registered", value: site.jurisdiction },
              { label: "Contact", value: site.email },
            ]}
          />

          <div className="flex min-w-0 flex-col gap-y-[clamp(32px,3.4vw,52px)]">
            {doc.sections.map((section) => (
              <section
                key={section.heading}
                id={slugify(section.heading)}
                className="scroll-mt-[108px]"
              >
                <h2 className="font-display text-ink text-[clamp(21px,2.2vw,28px)] leading-[1.15] font-bold tracking-[-0.035em] text-pretty">
                  {section.heading}
                </h2>

                <div className="mt-4 flex flex-col gap-3.5">
                  {section.body.map((paragraph) => (
                    <p
                      key={paragraph}
                      className="text-ink-soft text-[16px] leading-[1.7] text-pretty"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            ))}

            <p className="border-line text-dim border-t pt-6 text-[14.5px] leading-[1.6]">
              Questions about this page go to{" "}
              <a
                href={`mailto:${site.email}`}
                className="text-green-ink underline underline-offset-4"
              >
                {site.email}
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
