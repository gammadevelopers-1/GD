import { ArrowRight, Check } from "lucide-react";

import { cn } from "@/lib/utils";

import { finalCta } from "@/lib/gamma-content";

export function FinalCta() {
  return (
    <section
      id="book"
      aria-labelledby="final-cta-heading"
      className="bg-dark relative isolate flex flex-col justify-center overflow-hidden py-[clamp(72px,6vw,88px)] sm:min-h-svh"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute top-[-30%] left-1/2 -z-10 h-[820px] w-[min(1200px,130vw)] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(47,232,92,0.18),rgba(47,232,92,0.05)_44%,transparent_70%)] blur-[30px]"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-px bg-[linear-gradient(90deg,transparent,rgba(47,232,92,0.35),transparent)]"
      />

      <div className="mx-auto flex w-full max-w-[1280px] flex-col items-center px-6 text-center">
        <p className="t-eyebrow text-dim-dark flex items-center gap-3">
          <span aria-hidden className="bg-dark-line-strong h-px w-8" />
          {finalCta.eyebrow}
          <span aria-hidden className="bg-dark-line-strong h-px w-8" />
        </p>

        <h2
          id="final-cta-heading"
          className="font-display mt-5 text-[clamp(40px,6.4vw,90px)] leading-[0.9] font-bold tracking-[-0.05em] text-balance uppercase"
        >
          <span className="text-dark-head block">{finalCta.heading.one}</span>
          <span className="text-brand block">{finalCta.heading.two}</span>
        </h2>

        <p className="text-dark-head/85 mt-6 text-[clamp(16px,1.5vw,19px)] leading-[1.5] text-balance">
          {finalCta.lead}
        </p>

        <a
          href={finalCta.cta.href}
          className="bg-brand text-ink hover:bg-brand-hover focus-visible:outline-brand group mt-[clamp(28px,2.6vw,34px)] inline-flex h-[54px] items-center gap-2.5 rounded-full px-6 text-[15px] font-semibold shadow-[0_18px_44px_-18px_rgba(47,232,92,0.7)] transition-colors duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-[3px] sm:h-[58px] sm:gap-3 sm:px-8 sm:text-[16px]"
        >
          {finalCta.cta.label}
          <ArrowRight
            aria-hidden
            className="size-5 transition-transform duration-200 ease-out group-hover:translate-x-1"
          />
        </a>

        <div className="mt-5 rounded-full bg-[linear-gradient(120deg,rgba(47,232,92,0.5),rgba(255,255,255,0.14)_38%,rgba(255,255,255,0.04)_66%,rgba(47,232,92,0.24))] p-px shadow-[0_10px_30px_-18px_rgba(0,0,0,0.9)]">
          <ul className="flex items-center rounded-full bg-[linear-gradient(150deg,#1f2329,#16191d)] p-1.5">
            {finalCta.assurances.map((item, i) => (
              <li
                key={item}
                className={cn(
                  "flex items-center gap-2 px-4 py-1",
                  i > 0 && "border-l border-white/10",
                )}
              >
                <Check
                  aria-hidden
                  className="text-brand size-[13px]"
                  strokeWidth={3.5}
                />
                <span className="t-eyebrow text-dark-head">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
