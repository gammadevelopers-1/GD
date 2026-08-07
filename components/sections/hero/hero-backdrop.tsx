/** Decorative layers kept separate from the interactive canvas. */
export function HeroBackdropBase() {
  return (
    <>
      <div
        aria-hidden
        className="absolute inset-0 z-0 [background:radial-gradient(ellipse_44%_42%_at_99%_50%,rgba(47,232,92,0.30),transparent_64%),radial-gradient(ellipse_32%_30%_at_84%_50%,rgba(16,185,129,0.16),transparent_62%),radial-gradient(ellipse_38%_38%_at_1%_50%,rgba(96,112,136,0.26),transparent_64%),radial-gradient(ellipse_54%_40%_at_50%_8%,rgba(255,255,255,0.9),transparent_62%),linear-gradient(180deg,#f9f9f3_0%,#f4f4ee_38%,#eeeee5_78%,#e9e9df_100%)]"
      />
      <div
        aria-hidden
        className="absolute inset-0 z-0 [background-image:linear-gradient(rgba(20,23,26,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(20,23,26,0.055)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_74%_68%_at_50%_50%,transparent_26%,#000_88%)] [background-size:64px_64px] opacity-50"
      />
      <div
        aria-hidden
        className="absolute inset-y-0 left-0 z-0 hidden w-[46vw] max-w-[560px] [background-image:radial-gradient(rgba(20,23,26,0.20)_1px,transparent_1px)] [mask-image:linear-gradient(90deg,#000,transparent_78%)] [background-size:11px_11px] lg:block"
      />
      <div
        aria-hidden
        className="absolute inset-y-0 right-0 z-0 hidden w-[46vw] max-w-[560px] [background-image:radial-gradient(rgba(20,23,26,0.20)_1px,transparent_1px)] [mask-image:linear-gradient(270deg,#000,transparent_78%)] [background-size:11px_11px] lg:block"
      />
      <Rule side="left" />
      <Rule side="right" />
    </>
  );
}

export function HeroBackdropOverlay() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 z-[2] h-[520px] w-[900px] -translate-x-1/2 -translate-y-1/2 [background:radial-gradient(ellipse_at_center,rgba(255,255,255,0.72),transparent_66%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[2] [background:radial-gradient(ellipse_34%_28%_at_50%_50%,rgba(244,244,238,0.97)_32%,rgba(244,244,238,0.76)_62%,rgba(244,244,238,0)_86%)] max-lg:[background:radial-gradient(ellipse_80%_40%_at_50%_50%,rgba(244,244,238,0.96)_40%,rgba(244,244,238,0)_90%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[2] [background:radial-gradient(ellipse_96%_84%_at_50%_50%,transparent_52%,rgba(214,214,202,0.42)_100%)]"
      />
    </>
  );
}

function Rule({ side }: { side: "left" | "right" }) {
  const position = side === "left" ? "left-[88px]" : "right-[88px]";
  const tick =
    side === "left" ? "left-[84px] border-l" : "right-[84px] border-r";

  return (
    <>
      <div
        aria-hidden
        className={`absolute top-[8%] bottom-[8%] z-0 hidden w-px lg:block ${position} [background:linear-gradient(180deg,transparent,var(--border)_18%,var(--border)_82%,transparent)]`}
      />
      <i
        aria-hidden
        className={`border-border absolute top-[calc(8%-1px)] z-[1] hidden size-2.5 border-t lg:block ${tick}`}
      />
      <i
        aria-hidden
        className={`border-border absolute bottom-[calc(8%-1px)] z-[1] hidden size-2.5 border-b lg:block ${tick}`}
      />
    </>
  );
}
