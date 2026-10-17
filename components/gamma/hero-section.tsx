import type { CSSProperties } from "react";

import { hero } from "@/lib/gamma-content";
import { HeroVisual } from "@/components/gamma/hero-visual";
import { ShaderBackground } from "@/components/gamma/shader-background";
import { TrustBar } from "@/components/gamma/trust-bar";

function letters(text: string, offset: number) {
  let index = offset;
  const words = text.split(" ");

  return words.flatMap((word, w) => [
    <span key={w} className="inline-block whitespace-nowrap">
      {Array.from(word, (char, c) => (
        <span
          key={c}
          className="hero-letter"
          style={{ "--i": index++ } as CSSProperties}
        >
          {char}
        </span>
      ))}
    </span>,
    w < words.length - 1 ? " " : null,
  ]);
}

export function HeroSection() {
  const lineOneCount = hero.headline.one.replace(/ /g, "").length;

  return (
    <section
      id="hero"
      className="bg-dark relative isolate flex flex-col overflow-hidden sm:min-h-svh"
    >
      <ShaderBackground className="absolute inset-0 -z-10 h-full w-full" />

      {/* Weighted to the copy so the type clears contrast without hiding the smoke. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(130%_115%_at_22%_46%,rgba(22,24,28,0.58)_0%,rgba(22,24,28,0.26)_42%,rgba(22,24,28,0.04)_100%)]"
      />

      {/* Clears the fixed StickyNav, which is dark while this hero is behind it. */}
      <div aria-hidden className="h-[72px] shrink-0" />

      {/* Same shape as the audit and about heroes: copy and render are grid
          siblings, so the artwork stacks under the copy at full width on a
          phone and sits beside it from lg up. Nothing is cropped and nothing
          sits behind the type. */}
      <div className="mx-auto grid w-full max-w-[1280px] flex-1 items-center gap-x-[clamp(40px,5vw,88px)] gap-y-[clamp(28px,4vw,48px)] px-6 pt-[clamp(36px,6vh,64px)] pb-[clamp(28px,4vh,48px)] lg:grid-cols-[1.08fr_0.92fr]">
        <div className="flex flex-col justify-center">
          <h1
            className="t-h1 text-balance"
            aria-label={`${hero.headline.one} ${hero.headline.two}`}
          >
            <span aria-hidden className="text-dark-head block">
              {letters(hero.headline.one, 0)}
            </span>
            <span aria-hidden className="text-brand block">
              {letters(hero.headline.two, lineOneCount)}
            </span>
          </h1>

          <p className="t-lead text-dark-body mt-[clamp(18px,2.9vh,32px)] max-w-[52ch]">
            {hero.lead}
          </p>

          <a
            href={hero.cta.href}
            className="bg-brand t-body text-ink hover:bg-brand-hover focus-visible:outline-dark-head mt-[clamp(26px,4.3vh,46px)] inline-flex h-[52px] items-center justify-center self-start rounded-[16px] px-6 font-semibold transition-colors duration-200 ease-[cubic-bezier(.16,1,.3,1)] focus-visible:outline-2 focus-visible:outline-offset-[3px]"
          >
            {hero.cta.label}
          </a>

          <p className="t-meta text-dim-dark mt-[clamp(12px,2vh,22px)]">
            {hero.note}
          </p>
        </div>

        <HeroVisual
          src="/hero-ai.png"
          width={1402}
          height={1122}
          art={{ x: 56, y: 68, w: 1299, h: 1003 }}
          // Full width on a phone, as on /audit and /about. Capped between md
          // and lg because this hero is min-h-svh: on a tablet in portrait a
          // full-width render stacks to more than the viewport can hold.
          className="w-full md:mx-auto md:max-w-[460px] lg:mx-0 lg:max-w-none"
        />
      </div>

      <TrustBar dark />
    </section>
  );
}
