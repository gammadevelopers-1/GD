import type { Metadata } from "next";

import { WorkCards } from "@/components/gamma/work-cards";
import { workIndex } from "@/lib/content/cases";
import { getPublishedCases } from "@/data/case-studies";
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

  return (
    <main id="top">
      <section
        id="hero"
        className="bg-dark relative isolate flex flex-col overflow-hidden"
      >
        {/* Rays fanning out of the top-left corner. */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "conic-gradient(from 16deg at -8% -16%, transparent 0deg, rgba(47,232,92,0.20) 7deg, transparent 16deg, transparent 24deg, rgba(47,232,92,0.28) 31deg, transparent 40deg, transparent 49deg, rgba(47,232,92,0.14) 56deg, transparent 65deg, transparent 74deg, rgba(47,232,92,0.18) 81deg, transparent 90deg)",
            filter: "blur(26px)",
            maskImage:
              "radial-gradient(125% 115% at 0% 0%, #000 0%, rgba(0,0,0,0.5) 44%, transparent 80%)",
            WebkitMaskImage:
              "radial-gradient(125% 115% at 0% 0%, #000 0%, rgba(0,0,0,0.5) 44%, transparent 80%)",
          }}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 opacity-[0.55]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(236,236,228,0.028) 1px, transparent 1px), linear-gradient(90deg, rgba(236,236,228,0.028) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            maskImage:
              "radial-gradient(80% 74% at 50% 42%, #000 0%, transparent 78%)",
            WebkitMaskImage:
              "radial-gradient(80% 74% at 50% 42%, #000 0%, transparent 78%)",
          }}
        />

        {/* Clears the fixed StickyNav, which is dark while this hero is behind it. */}
        <div aria-hidden className="h-[72px] shrink-0" />

        <div className="mx-auto flex w-full max-w-[1280px] flex-col items-center px-6 pt-[clamp(36px,4vw,60px)] pb-[clamp(44px,4.8vw,72px)] text-center">
          <p className="t-eyebrow text-dim-dark flex items-center gap-3">
            <span aria-hidden className="bg-dark-line-strong h-px w-8" />
            {workIndex.eyebrow}
            <span aria-hidden className="bg-dark-line-strong h-px w-8" />
          </p>

          <h1 className="font-display mt-6 text-[clamp(36px,5.6vw,74px)] leading-[0.94] font-bold tracking-[-0.05em] uppercase">
            <span className="text-dark-head block">
              {workIndex.heading.one}
            </span>
            <span className="text-brand block">{workIndex.heading.two}</span>
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
      </section>

      <section className="bg-ground">
        <div className="mx-auto w-full max-w-[1280px] px-6 py-[clamp(48px,5.4vw,80px)]">
          <WorkCards items={items} />
        </div>
      </section>
    </main>
  );
}
