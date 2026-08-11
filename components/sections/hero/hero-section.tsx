import { hero } from "@/lib/content/home";
import { AuditForm } from "./audit-form";
import { HeroAuditCta } from "./hero-audit-cta";
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
      <section className="relative min-h-[980px] overflow-hidden sm:min-h-[940px] lg:h-screen lg:min-h-[850px]">
        <HeroBackdropBase />
        <LineField />
        <HeroBackdropOverlay />

        <div className="pointer-events-none absolute inset-x-0 top-[88px] bottom-[370px] z-[4] flex items-center sm:bottom-[340px] lg:top-[96px] lg:bottom-[320px]">
          <div className="mx-auto w-full max-w-[1240px] px-5 text-center md:px-9">
            <HeroCopy>
              <h1
                data-hero="title"
                className="hero-title font-display mx-auto w-fit text-[27px] leading-[0.94] font-semibold tracking-[-0.035em] uppercase min-[360px]:text-[30px] min-[390px]:text-[33px] sm:text-[48px] md:text-[58px] lg:text-[66px] xl:text-[72px]"
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
        </div>

        <HeroAuditCta />
      </section>
    </HeroProvider>
  );
}
