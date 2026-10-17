import { HeroVisual } from "@/components/gamma/hero-visual";
import { audit } from "@/lib/content/audit";

const { hero } = audit;

export function AuditHero() {
  return (
    <section
      id="hero"
      className="bg-dark relative isolate flex min-h-[clamp(560px,74svh,760px)] flex-col overflow-hidden"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(78% 90% at 88% 2%, rgba(47,232,92,0.22) 0%, rgba(47,232,92,0.06) 38%, transparent 68%)",
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
            "radial-gradient(85% 75% at 30% 40%, #000 0%, transparent 78%)",
        }}
      />

      {/* Clears the fixed StickyNav, which is dark while this hero is behind it. */}
      <div aria-hidden className="h-[72px] shrink-0" />

      <div className="mx-auto grid w-full max-w-[1280px] flex-1 items-center gap-x-[clamp(40px,5vw,88px)] gap-y-[clamp(36px,4.5vw,56px)] px-6 py-[clamp(32px,4vw,64px)] lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="t-eyebrow text-dim-dark flex items-center gap-3">
            <span aria-hidden className="bg-dark-line-strong h-px w-8" />
            {hero.eyebrow}
          </p>

          <h1 className="font-display mt-6 text-[clamp(34px,4.4vw,56px)] leading-[0.94] font-bold tracking-[-0.05em] uppercase">
            <span className="text-dark-head block">{hero.headline.one}</span>
            <span className="text-brand block">{hero.headline.two}</span>
          </h1>

          <p className="text-dark-body mt-7 max-w-[58ch] text-[17px] leading-[1.6] text-pretty">
            {hero.lead}
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
            <a
              href={hero.cta.href}
              className="bg-brand text-ink hover:bg-brand-hover focus-visible:outline-dark-head inline-flex h-[54px] items-center rounded-full px-7 text-[15px] font-semibold shadow-[0_18px_44px_-18px_rgba(47,232,92,0.7)] transition-colors duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-[3px]"
            >
              {hero.cta.label}
            </a>
            <p className="t-meta text-dim-dark">{hero.note}</p>
          </div>
        </div>

        <HeroVisual
          src="/audit-hero.png"
          width={1671}
          height={941}
          art={{ x: 426, y: 60, w: 1200, h: 850 }}
          className="w-full"
        />
      </div>
    </section>
  );
}
