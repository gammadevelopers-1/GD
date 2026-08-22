import { AmbientField, HeroAuditCta, HeroCopy, HeroProvider } from "gd-website";

export function WrappingHeroCopy() {
  return (
    <HeroProvider>
      <div
        className="bg-background relative isolate flex flex-col items-center justify-center overflow-hidden px-6 py-10 text-center"
        style={{ minHeight: 520 }}
      >
        <AmbientField variant="mint" />
        <HeroCopy>
          <div className="relative z-1 flex flex-col items-center">
            <h1 className="hero-title font-display text-[38px] leading-[0.91] font-bold tracking-[-0.045em] uppercase">
              <span className="hero-title-line hero-title-gradient block">
                Messy in
              </span>
              <span className="hero-title-line mt-[0.08em] block">
                <span className="hero-title-gradient">Aligned</span>{" "}
                <span className="hero-title-gradient">out</span>
              </span>
            </h1>
            <p className="text-foreground/72 mx-auto mt-4 max-w-[30ch] text-[15px] leading-[1.4] font-medium tracking-[-0.012em]">
              Tell us what&rsquo;s broken. We&rsquo;ll show you the fix.
            </p>
            <div style={{ marginTop: 96 }}>
              <HeroAuditCta />
            </div>
          </div>
        </HeroCopy>
      </div>
    </HeroProvider>
  );
}

export function WrappingPlainChildren() {
  return (
    <HeroProvider>
      <div
        className="bg-secondary flex flex-col items-center justify-center gap-2 px-6 py-10 text-center"
        style={{ minHeight: 220 }}
      >
        <span className="font-mono text-[10px] tracking-[0.16em] text-black/40 uppercase">
          Free audit
        </span>
        <h2 className="font-display max-w-md text-2xl font-semibold tracking-[-0.03em]">
          Everything a hero section needs, timed and coordinated.
        </h2>
      </div>
    </HeroProvider>
  );
}
