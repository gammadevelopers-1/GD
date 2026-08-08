// These soft layers set the mood 
export function HeroBackdropBase() {
  return (
    <>
      <div
        aria-hidden
        className="absolute inset-0 z-0 [background:radial-gradient(ellipse_38%_46%_at_4%_48%,rgba(102,118,174,0.24),transparent_70%),radial-gradient(ellipse_42%_48%_at_98%_48%,rgba(47,232,92,0.24),transparent_70%),radial-gradient(ellipse_48%_44%_at_50%_46%,rgba(255,255,255,0.88),transparent_72%),linear-gradient(135deg,#f7f6f1_0%,#eef1eb_42%,#e3eadf_72%,#dce8da_100%)]"
      />
      <div
        aria-hidden
        className="hero-aurora hero-aurora-left absolute top-[8%] -left-[16%] z-0 h-[74%] w-[52%] rounded-full"
      />
      <div
        aria-hidden
        className="hero-aurora hero-aurora-right absolute top-[13%] -right-[14%] z-0 h-[70%] w-[50%] rounded-full"
      />
      <div
        aria-hidden
        className="absolute inset-0 z-0 [background-image:linear-gradient(rgba(20,23,26,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(20,23,26,0.055)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_74%_68%_at_50%_50%,transparent_28%,#000_88%)] [background-size:64px_64px] opacity-42"
      />
      <div
        aria-hidden
        className="absolute inset-y-0 left-0 z-0 hidden w-[46vw] max-w-[560px] [background-image:radial-gradient(rgba(20,23,26,0.18)_1px,transparent_1px)] [mask-image:linear-gradient(90deg,#000,transparent_78%)] [background-size:11px_11px] lg:block"
      />
      <div
        aria-hidden
        className="absolute inset-y-0 right-0 z-0 hidden w-[46vw] max-w-[560px] [background-image:radial-gradient(rgba(20,23,26,0.18)_1px,transparent_1px)] [mask-image:linear-gradient(270deg,#000,transparent_78%)] [background-size:11px_11px] lg:block"
      />
    </>
  );
}

export function HeroBackdropOverlay() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 z-[2] h-[500px] w-[860px] -translate-x-1/2 -translate-y-1/2 [background:radial-gradient(ellipse_at_center,rgba(250,250,246,0.76),transparent_68%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[2] [background:radial-gradient(ellipse_34%_28%_at_50%_50%,rgba(247,248,243,0.97)_32%,rgba(247,248,243,0.78)_62%,rgba(247,248,243,0)_86%)] max-lg:[background:radial-gradient(ellipse_82%_42%_at_50%_50%,rgba(247,248,243,0.96)_40%,rgba(247,248,243,0)_90%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[2] [background:radial-gradient(ellipse_96%_84%_at_50%_50%,transparent_52%,rgba(214,214,202,0.42)_100%)]"
      />
    </>
  );
}
