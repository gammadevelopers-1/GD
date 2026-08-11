// Layered mineral gradients and slow auroras frame the moving signal field.
export function HeroBackdropBase() {
  return (
    <>
      <div
        aria-hidden
        className="absolute inset-0 z-0 [background:radial-gradient(ellipse_70%_70%_at_8%_22%,rgba(5,150,105,0.12),transparent_58%),linear-gradient(135deg,#f7f7f2_0%,#f2f2eb_100%)]"
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
        className="absolute inset-0 z-0 opacity-70 [background:linear-gradient(180deg,rgba(255,255,255,0.34)_0%,transparent_54%,rgba(16,185,129,0.06)_100%)]"
      />
      <div
        aria-hidden
        className="absolute inset-0 z-0 [background-image:linear-gradient(rgba(5,150,105,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(5,150,105,0.04)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_74%_68%_at_50%_50%,transparent_24%,#000_86%)] [background-size:64px_64px] opacity-45"
      />
      <div
        aria-hidden
        className="absolute inset-y-0 left-0 z-0 hidden w-[46vw] max-w-[560px] [background-image:radial-gradient(rgba(5,150,105,0.12)_1px,transparent_1px)] [mask-image:linear-gradient(90deg,#000,transparent_78%)] [background-size:11px_11px] lg:block"
      />
      <div
        aria-hidden
        className="absolute inset-y-0 right-0 z-0 hidden w-[46vw] max-w-[560px] [background-image:radial-gradient(rgba(5,150,105,0.12)_1px,transparent_1px)] [mask-image:linear-gradient(270deg,#000,transparent_78%)] [background-size:11px_11px] lg:block"
      />
    </>
  );
}

export function HeroBackdropOverlay() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute top-[36%] left-1/2 z-[2] h-[520px] w-[900px] -translate-x-1/2 -translate-y-1/2 [background:radial-gradient(ellipse_at_center,rgba(248,250,247,0.24)_0%,rgba(242,247,243,0.08)_48%,transparent_74%)] lg:top-[38%]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[2] [background:radial-gradient(ellipse_36%_30%_at_50%_38%,rgba(248,250,247,0.3)_22%,rgba(244,248,245,0.12)_58%,rgba(246,248,245,0)_88%)] max-lg:[background:radial-gradient(ellipse_84%_44%_at_50%_36%,rgba(248,250,247,0.26)_32%,rgba(246,248,245,0)_92%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[2] [background:linear-gradient(180deg,rgba(240,245,242,0.12)_0%,transparent_36%,transparent_72%,rgba(16,185,129,0.08)_100%)]"
      />
    </>
  );
}
