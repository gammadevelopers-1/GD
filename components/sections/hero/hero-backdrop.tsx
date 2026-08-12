// One continuous field: mineral light above, emerald energy through the
// middle, and the original deep CTA colour at the bottom.
export function HeroBackdropBase() {
  return (
    <>
      <div aria-hidden className="hero-gradient-base absolute inset-0 z-0" />
      <div
        aria-hidden
        className="hero-aurora hero-aurora-left absolute -top-[22%] -left-[18%] z-0 h-[76%] w-[64%] rounded-full"
      />
      <div
        aria-hidden
        className="hero-aurora hero-aurora-right absolute top-[12%] -right-[14%] z-0 h-[72%] w-[66%] rounded-full"
      />
      <div aria-hidden className="hero-gradient-ridge absolute z-0" />
      <div aria-hidden className="hero-gradient-floor absolute z-0" />
      <div aria-hidden className="hero-corner-glow absolute inset-0 z-0" />
      <div
        aria-hidden
        className="absolute inset-0 z-0 [background-image:linear-gradient(rgba(5,150,105,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(5,150,105,0.045)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_86%_76%_at_50%_42%,transparent_18%,#000_92%)] [background-size:64px_64px] opacity-45"
      />
      <div
        aria-hidden
        className="absolute inset-y-0 left-0 z-0 hidden w-[42vw] max-w-[560px] [background-image:radial-gradient(rgba(5,150,105,0.12)_1px,transparent_1px)] [mask-image:linear-gradient(90deg,#000,transparent_82%)] [background-size:11px_11px] lg:block"
      />
      <div
        aria-hidden
        className="absolute inset-y-0 right-0 z-0 hidden w-[42vw] max-w-[560px] [background-image:radial-gradient(rgba(47,232,92,0.13)_1px,transparent_1px)] [mask-image:linear-gradient(270deg,#000,transparent_82%)] [background-size:11px_11px] lg:block"
      />
    </>
  );
}

export function HeroBackdropOverlay() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute top-[38%] left-1/2 z-[2] h-[500px] w-[min(940px,92vw)] -translate-x-1/2 -translate-y-1/2 [background:radial-gradient(ellipse_at_center,rgba(251,252,248,0.48)_0%,rgba(245,249,245,0.16)_46%,transparent_74%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[2] [background:radial-gradient(ellipse_40%_36%_at_50%_37%,rgba(248,250,247,0.26)_20%,rgba(244,248,245,0.09)_60%,transparent_90%)] max-lg:[background:radial-gradient(ellipse_88%_42%_at_50%_34%,rgba(248,250,247,0.28)_26%,transparent_94%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[2] [background:linear-gradient(180deg,rgba(255,255,255,0.16)_0%,transparent_39%,transparent_64%,rgba(8,13,11,0.08)_100%)]"
      />
    </>
  );
}
