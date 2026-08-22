import { FooterGlow } from "gd-website";

export function OnFooterSurface() {
  return (
    <div
      className="relative overflow-hidden bg-[#0f1512]"
      style={{ height: 340 }}
    >
      <FooterGlow />
      <div className="relative z-1 px-10 pt-12">
        <p className="text-[13px] tracking-[0.18em] text-[#6d736a] uppercase">
          Gamma Developers
        </p>
        <p className="mt-3 max-w-[420px] text-[22px] leading-tight text-[#eceae2]">
          AI systems that reach production, and stay there.
        </p>
      </div>
    </div>
  );
}
