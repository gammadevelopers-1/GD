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
      <section className="relative isolate h-[100svh] min-h-[780px] overflow-hidden min-[390px]:min-h-[840px] sm:min-h-[880px] lg:min-h-[800px]">
        <HeroBackdropBase />
        <LineField />
        <HeroBackdropOverlay />

        <HeroCopy>
          <div className="pointer-events-none absolute inset-x-0 top-[76px] bottom-[32%] z-[4] flex items-end pb-2 sm:pb-3 lg:top-[82px]">
            <div className="mx-auto w-full max-w-[1240px] px-5 text-center md:px-9">
              <div
                data-hero-content-boundary
                className="mx-auto flex w-full max-w-[760px] -translate-y-10 flex-col items-center sm:-translate-y-12"
              >
                <h1
                  data-hero="title"
                  className="hero-title font-display mx-auto w-fit text-[31px] leading-[0.91] font-bold tracking-[-0.045em] uppercase min-[390px]:text-[35px] sm:text-[50px] md:text-[59px] lg:text-[66px] xl:text-[72px]"
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
                  className="text-foreground/72 mx-auto mt-4 max-w-[30ch] text-[13px] leading-[1.4] font-medium tracking-[-0.012em] min-[390px]:max-w-full min-[390px]:text-[14px] min-[390px]:whitespace-nowrap sm:text-[18px]"
                >
                  {hero.lead}
                </p>

                <div
                  data-hero="form"
                  className="pointer-events-auto w-full max-w-[650px]"
                >
                  <AuditForm />
                </div>
              </div>
            </div>
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[4] flex h-[32%] items-start justify-center px-5 pt-2 sm:px-8 sm:pt-3">
            <HeroAuditCta />
          </div>
        </HeroCopy>
      </section>
    </HeroProvider>
  );
}
