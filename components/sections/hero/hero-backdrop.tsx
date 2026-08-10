// Layered mineral gradients and slow auroras frame the moving signal field.
export function HeroBackdropBase() {
  return (
    <>
      <div
        aria-hidden
        className="absolute inset-0 z-0 [background:radial-gradient(ellipse_58%_78%_at_-8%_46%,rgba(3,72,47,0.3),transparent_68%),radial-gradient(ellipse_54%_72%_at_108%_52%,rgba(5,150,105,0.26),transparent_68%),radial-gradient(ellipse_74%_50%_at_50%_-8%,rgba(123,149,178,0.34),transparent_70%),radial-gradient(ellipse_60%_42%_at_50%_108%,rgba(25,105,74,0.18),transparent_72%),linear-gradient(132deg,#f7f8f4_0%,#e4eee8_36%,#cbded5_70%,#edf3ef_100%)]"
      />
      <div
        aria-hidden
        className="hero-aurora hero-aurora-left absolute -top-[24%] -left-[16%] z-0 h-[82%] w-[66%] rounded-full"
      />
      <div
        aria-hidden
        className="hero-aurora hero-aurora-right absolute -right-[14%] -bottom-[28%] z-0 h-[88%] w-[68%] rounded-full"
      />
      <div
        aria-hidden
        className="absolute inset-0 z-0 opacity-70 [background:linear-gradient(112deg,transparent_18%,rgba(255,255,255,0.26)_45%,transparent_68%)]"
      />
      <div
        aria-hidden
        className="absolute inset-0 z-0 [background-image:linear-gradient(rgba(8,58,41,0.075)_1px,transparent_1px),linear-gradient(90deg,rgba(8,58,41,0.075)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_74%_68%_at_50%_50%,transparent_24%,#000_86%)] [background-size:64px_64px] opacity-55"
      />
      <div
        aria-hidden
        className="absolute inset-y-0 left-0 z-0 hidden w-[46vw] max-w-[560px] [background-image:radial-gradient(rgba(5,68,46,0.25)_1px,transparent_1px)] [mask-image:linear-gradient(90deg,#000,transparent_78%)] [background-size:11px_11px] lg:block"
      />
      <div
        aria-hidden
        className="absolute inset-y-0 right-0 z-0 hidden w-[46vw] max-w-[560px] [background-image:radial-gradient(rgba(5,68,46,0.26)_1px,transparent_1px)] [mask-image:linear-gradient(270deg,#000,transparent_78%)] [background-size:11px_11px] lg:block"
      />
    </>
  );
}

export function HeroBackdropOverlay() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 z-[2] h-[520px] w-[900px] -translate-x-1/2 -translate-y-1/2 [background:radial-gradient(ellipse_at_center,rgba(248,250,247,0.46)_0%,rgba(242,247,243,0.2)_48%,transparent_74%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[2] [background:radial-gradient(ellipse_36%_30%_at_50%_50%,rgba(248,250,247,0.54)_22%,rgba(244,248,245,0.3)_58%,rgba(246,248,245,0)_88%)] max-lg:[background:radial-gradient(ellipse_84%_44%_at_50%_44%,rgba(248,250,247,0.62)_32%,rgba(246,248,245,0)_92%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[2] [background:linear-gradient(180deg,rgba(240,245,242,0.3)_0%,transparent_22%,transparent_74%,rgba(177,205,191,0.48)_100%),radial-gradient(ellipse_94%_82%_at_50%_50%,transparent_48%,rgba(134,173,154,0.46)_100%)]"
      />
    </>
  );
}
