import { hero } from "@/lib/content/home";
import { AuditForm } from "./audit-form";
import { AuditTags } from "./audit-tags";
import { HeroBackdropBase, HeroBackdropOverlay } from "./hero-backdrop";
import { HeroCopy } from "./hero-copy";
import { HeroProvider } from "./hero-provider";
import { LineField } from "./line-field";

export function HeroSection() {
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
        <AuditTags />

        <div className="pointer-events-none relative z-[4] mx-auto w-full max-w-[1240px] px-5 text-center md:px-9">
          <HeroCopy>
            <h1
              data-hero="title"
              className="mx-auto max-w-[13ch] text-[clamp(42px,5.8vw,78px)] leading-none font-medium tracking-[-0.037em]"
            >
              {hero.headline.before}
              <br />
              <em className="text-accent not-italic">
                {hero.headline.accent}
              </em>{" "}
              {hero.headline.after}
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
