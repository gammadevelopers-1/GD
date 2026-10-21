import type { Metadata } from "next";

import { CalendlyEmbed } from "@/components/common/calendly-embed";
import { book } from "@/lib/content/book";
import { site } from "@/lib/content/site";
import { pageMeta } from "@/lib/seo";
import { cardLight, edgeBar } from "@/lib/gamma-ui";
import { cn } from "@/lib/utils";

export const metadata: Metadata = pageMeta({
  title: `${book.title.one} ${book.title.two}`,
  description: book.lead,
  path: "/book",
});

export default function BookPage() {
  return (
    <main id="top" className="bg-ground">
      <section
        id="hero"
        className="bg-dark relative isolate flex flex-col overflow-hidden"
      >
        {/* Rays fanning out of the top-left corner, matching /work. */}
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
            {book.eyebrow}
            <span aria-hidden className="bg-dark-line-strong h-px w-8" />
          </p>

          <h1 className="font-display mt-6 text-[clamp(36px,5.6vw,74px)] leading-[0.94] font-bold tracking-[-0.05em] uppercase">
            <span className="text-dark-head block">{book.title.one}</span>
            <span className="text-brand block">{book.title.two}</span>
          </h1>

          <p className="text-dark-body mt-6 max-w-[60ch] text-[17px] leading-[1.6] text-pretty">
            {book.lead}
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1280px] px-6 pt-[clamp(48px,5.4vw,80px)] pb-[clamp(44px,4.8vw,64px)]">
        <ul className={cn(cardLight, "grid overflow-hidden sm:grid-cols-3")}>
          {book.steps.map((step, i) => (
            <li
              key={step.title}
              className={cn(
                "group border-line relative border-t p-[clamp(22px,2.3vw,30px)] first:border-t-0",
                "sm:border-t-0 sm:border-l sm:first:border-l-0",
              )}
            >
              <span aria-hidden className={edgeBar} />
              <span className="t-eyebrow text-faint group-hover:text-green-ink transition-colors duration-300 ease-out">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h2 className="t-h4 text-ink mt-4">{step.title}</h2>
              <p className="t-body text-ink-soft mt-[10px] text-pretty">
                {step.body}
              </p>
            </li>
          ))}
        </ul>

        <div className={cn(cardLight, "mt-5 overflow-hidden bg-white")}>
          <CalendlyEmbed url={site.calendly} />
        </div>

        <p className="t-meta text-dim mt-6 text-center">
          {book.fallback}{" "}
          <a
            href={`mailto:${site.email}`}
            className="text-ink hover:text-green-ink font-medium underline underline-offset-4 transition-colors duration-200"
          >
            {site.email}
          </a>
        </p>
      </section>
    </main>
  );
}
