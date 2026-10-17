import { about } from "@/lib/content/about";
import { site } from "@/lib/content/site";

const { cta } = about;

export function AboutCta() {
  return (
    <section className="bg-ground py-[clamp(64px,6.4vw,96px)]">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col items-center px-6 text-center">
        <p className="t-eyebrow text-dim flex items-center gap-3">
          <span aria-hidden className="bg-line-strong h-px w-8" />
          {cta.eyebrow}
          <span aria-hidden className="bg-line-strong h-px w-8" />
        </p>

        <h2 className="font-display mt-6 text-[clamp(32px,4.4vw,56px)] leading-[0.98] font-bold tracking-[-0.045em] uppercase">
          <span className="text-ink block">{cta.heading.one}</span>
          <span className="text-green-ink block">{cta.heading.two}</span>
        </h2>

        <p className="text-ink-soft mt-5 max-w-[56ch] text-[17px] leading-[1.6] text-pretty">
          {cta.lead}
        </p>

        <a
          href={site.book}
          className="bg-brand text-ink hover:bg-brand-hover focus-visible:outline-ink mt-9 inline-flex h-[56px] items-center rounded-full px-8 text-[16px] font-semibold shadow-[0_18px_44px_-18px_rgba(47,232,92,0.7)] transition-colors duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-[3px]"
        >
          {cta.button}
        </a>

        <p className="t-meta text-dim mt-5">{cta.note}</p>
      </div>
    </section>
  );
}
