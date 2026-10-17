import type { Metadata } from "next";

import { WorkCards } from "@/components/gamma/work-cards";
import { ImageStreamHero } from "@/components/ui/image-stream-hero";
import { getPublishedCases } from "@/data/case-studies";
import { workIndex } from "@/lib/content/cases";
import { site } from "@/lib/content/site";

export const metadata: Metadata = {
  title: `Case studies · ${site.name}`,
  description: workIndex.lead,
};

// Published case studies come from the console, so adding one does not need
// a deploy. Five minutes is the longest a change waits; saving in the console
// revalidates this path immediately.
export const revalidate = 300;

export default async function WorkIndexPage() {
  const items = await getPublishedCases();

  // The corridor runs the work itself. A hero mockup where one exists, card
  // artwork otherwise. The sequence is doubled because both rails walk the
  // same list, and a short list would otherwise sit opposite itself.
  const stream = items.map((item) => ({
    src: item.heroImage ?? item.image,
    alt: "",
  }));
  const images = stream.length ? [...stream, ...stream] : [];

  return (
    <main id="top">
      <section id="hero" className="bg-dark relative isolate overflow-hidden">
        <ImageStreamHero
          images={images}
          cards={9}
          speed={26}
          axis={52}
          className="min-h-[560px] md:min-h-[680px]"
        >
          {/* The corridor runs behind the copy, so the copy needs its own
              floor to stay legible as bright artwork passes under it. */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(74%_62%_at_50%_52%,rgba(22,24,28,0.94)_0%,rgba(22,24,28,0.82)_38%,rgba(22,24,28,0.42)_70%,rgba(22,24,28,0.18)_100%)]"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(to_top,#16181c_0%,rgba(22,24,28,0.7)_48%,transparent_100%)]"
          />

          <div className="relative flex min-h-[560px] flex-col md:min-h-[680px]">
            {/* Clears the fixed StickyNav, which is dark over this hero. */}
            <div aria-hidden className="h-[72px] shrink-0" />

            <div className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col items-center justify-center px-6 py-[clamp(40px,5vw,72px)] text-center">
              <p className="t-eyebrow text-dim-dark flex items-center gap-3">
                <span aria-hidden className="bg-dark-line-strong h-px w-8" />
                {workIndex.eyebrow}
                <span aria-hidden className="bg-dark-line-strong h-px w-8" />
              </p>

              <h1 className="font-display mt-6 text-[clamp(36px,5.6vw,74px)] leading-[0.94] font-bold tracking-[-0.05em] uppercase">
                <span className="text-dark-head block">
                  {workIndex.heading.one}
                </span>
                <span className="text-brand block">
                  {workIndex.heading.two}
                </span>
              </h1>

              <p className="text-dark-body mt-6 max-w-[60ch] text-[17px] leading-[1.6] text-pretty">
                {workIndex.lead}
              </p>

              <a
                href={site.book}
                className="bg-brand text-ink hover:bg-brand-hover focus-visible:outline-dark-head mt-8 inline-flex h-[54px] items-center rounded-full px-8 text-[15px] font-semibold shadow-[0_18px_44px_-18px_rgba(47,232,92,0.7)] transition-colors duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-[3px]"
              >
                {workIndex.cta.label}
              </a>

              <p className="t-meta text-dim-dark mt-4">{workIndex.cta.note}</p>
            </div>
          </div>
        </ImageStreamHero>
      </section>

      <section className="bg-ground">
        <div className="mx-auto w-full max-w-[1280px] px-6 py-[clamp(48px,5.4vw,80px)]">
          <WorkCards items={items} />
        </div>
      </section>
    </main>
  );
}
