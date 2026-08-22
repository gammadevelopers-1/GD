import { FooterArcs } from "gd-website";

export function OnFooter() {
  return (
    <div className="relative h-[700px] w-full overflow-hidden bg-[#080b0e]">
      <FooterArcs />
      <div
        className="relative z-[5] flex flex-col items-center px-6 text-center"
        style={{ paddingTop: 64 }}
      >
        <span className="mb-4 inline-flex items-center gap-2 font-mono text-[10.5px] tracking-[0.18em] text-[#9aa096] uppercase">
          <span className="bg-brand size-1.5 rounded-full shadow-[0_0_9px_rgba(47,232,92,0.6)]" />
          Start here
        </span>
        <h2 className="font-display max-w-md text-3xl leading-[1.05] font-semibold tracking-[-0.045em] text-[#eceae2]">
          Everything lands here.
        </h2>
      </div>
    </div>
  );
}
