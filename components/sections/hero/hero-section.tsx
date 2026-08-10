import { hero } from "@/lib/content/home";
import { AuditForm } from "./audit-form";
import { HeroBackdropBase, HeroBackdropOverlay } from "./hero-backdrop";
import { HeroCopy } from "./hero-copy";
import { HeroProvider } from "./hero-provider";
import { LineField } from "./line-field";

export function HeroSection() {
  const accent = hero.headline.accent.toUpperCase();
  const gIndex = accent.indexOf("G");
  const dIndex = accent.indexOf("D");
  const after = hero.headline.after.toUpperCase();

  return (
    <HeroProvider>
      <section
        data-cursor-zone="threads"
        data-cursor-tone="mint"
        className="relative flex min-h-[780px] items-center overflow-hidden max-lg:min-h-0 max-lg:py-33 lg:h-screen"
      >
        <HeroBackdropBase />
        <LineField />
        <HeroBackdropOverlay />

        <div className="pointer-events-none z-[4] mx-auto w-full max-w-[1240px] px-5 text-center md:px-9">
          <HeroCopy>
            <h1
              data-hero="title"
              data-cursor-interactive
              className="hero-title mx-auto font-sans text-[27px] leading-[0.94] font-semibold tracking-[0] uppercase min-[360px]:text-[30px] min-[390px]:text-[33px] sm:text-[48px] md:text-[58px] lg:text-[66px] xl:text-[72px]"
            >
              <span className="sr-only">
                {hero.headline.before} {hero.headline.accent}{" "}
                {hero.headline.after}
              </span>
              <span
                aria-hidden
                data-hero-line
                className="hero-title-line hero-title-gradient block"
              >
                {hero.headline.before.toUpperCase()}
              </span>
              <span
                aria-hidden
                data-hero-line
                className="hero-title-line mt-[0.08em] block whitespace-nowrap"
              >
                <span className="hero-title-gradient">
                  {accent.slice(0, gIndex)}
                </span>
                <span
                  data-logo-letter
                  data-letter={accent.charAt(gIndex)}
                  className="hero-logo-letter hero-logo-g"
                >
                  {accent.charAt(gIndex)}
                </span>
                <span className="hero-title-gradient">
                  {accent.slice(gIndex + 1, dIndex)}
                </span>
                <span
                  data-logo-letter
                  data-letter={accent.charAt(dIndex)}
                  className="hero-logo-letter hero-logo-d"
                >
                  {accent.charAt(dIndex)}
                </span>{" "}
                <span className="hero-title-gradient">{after}</span>
              </span>
            </h1>

            <p
              data-hero="lead"
              className="text-muted-foreground mx-auto mt-5 max-w-[36ch] text-[16px] leading-[1.55]"
            >
              {hero.lead}
            </p>

            <div data-hero="form" className="pointer-events-auto">
              <AuditForm />
            </div>
          </HeroCopy>
        </div>

        <div
          aria-hidden
          className="text-muted-foreground absolute bottom-6 left-1/2 z-[5] flex -translate-x-1/2 flex-col items-center gap-2 font-mono text-[10px] tracking-[0.2em] uppercase max-lg:hidden"
        >
          <span className="animate-scroll-hint block h-6 w-px bg-[linear-gradient(180deg,var(--border),transparent)]" />
        </div>
      </section>
    </HeroProvider>
  );
}
