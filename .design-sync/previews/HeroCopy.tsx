import { AmbientField, HeroAuditCta, HeroCopy, HeroProvider } from "gd-website";

export function Default() {
  return (
    <HeroProvider>
      <div
        className="bg-background relative isolate flex flex-col items-center justify-center overflow-hidden px-6 py-10 text-center"
        style={{ minHeight: 540 }}
      >
        <AmbientField variant="mint" />
        <HeroCopy>
          <div className="relative z-1 flex flex-col items-center">
            <h1 className="hero-title font-display text-[42px] leading-[0.91] font-bold tracking-[-0.045em] uppercase">
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

export function TitleAndLeadOnly() {
  return (
    <HeroProvider>
      <div
        className="bg-background relative isolate flex flex-col items-center justify-center overflow-hidden px-6 py-10 text-center"
        style={{ minHeight: 260 }}
      >
        <AmbientField variant="blue" />
        <HeroCopy>
          <div className="relative z-1">
            <h2 className="font-display text-3xl leading-tight font-semibold tracking-[-0.03em]">
              Run an audit before you run another quarter blind.
            </h2>
            <p
              className="text-muted-foreground mx-auto mt-3 text-[15px] leading-[1.5]"
              style={{ maxWidth: "38ch" }}
            >
              Thirty minutes tells you where the time in your business is
              actually going.
            </p>
          </div>
        </HeroCopy>
      </div>
    </HeroProvider>
  );
}
