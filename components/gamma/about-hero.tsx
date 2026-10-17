import { HeroVisual } from "@/components/gamma/hero-visual";
import { about } from "@/lib/content/about";

const { hero } = about;

export function AboutHero() {
  return (
    <section
      id="hero"
      className="bg-dark relative isolate flex min-h-[clamp(540px,74svh,760px)] flex-col overflow-hidden"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(70% 86% at 88% 4%, rgba(47,232,92,0.20) 0%, rgba(47,232,92,0.05) 38%, transparent 68%)",
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
            "radial-gradient(85% 78% at 30% 44%, #000 0%, transparent 78%)",
        }}
      />

      {/* Clears the fixed StickyNav, which is dark while this hero is behind it. */}
      <div aria-hidden className="h-[72px] shrink-0" />

      <div className="mx-auto grid w-full max-w-[1280px] flex-1 items-center gap-x-[clamp(40px,5vw,88px)] gap-y-[clamp(36px,4.5vw,56px)] px-6 py-[clamp(32px,4vw,60px)] lg:grid-cols-[1.12fr_0.88fr]">
        <div>
          <p className="t-eyebrow text-dim-dark flex items-center gap-3">
            <span aria-hidden className="bg-dark-line-strong h-px w-8" />
            {hero.eyebrow}
          </p>

          <h1 className="font-display mt-6 text-[clamp(32px,4.2vw,52px)] leading-[0.96] font-bold tracking-[-0.05em] uppercase">
            <span className="text-dark-head block">{hero.headline.one}</span>
            <span className="text-brand block">{hero.headline.two}</span>
          </h1>

          <p className="text-dark-body mt-7 max-w-[46ch] text-[18px] leading-[1.55] text-pretty">
            {hero.lead}
          </p>
        </div>

        <HeroVisual
          src="/about-hero.png"
          width={1672}
          height={941}
          art={{ x: 785, y: 135, w: 803, h: 622 }}
          className="w-full"
        />
      </div>
    </section>
  );
}
