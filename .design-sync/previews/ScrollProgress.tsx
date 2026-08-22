import { ScrollProgress } from "gd-website";

export function OnPage() {
  return (
    <div className="bg-background relative" style={{ height: 320 }}>
      <ScrollProgress />
      <div className="flex items-center justify-between border-b border-black/[0.07] px-6 py-4">
        <span className="font-display text-sm font-semibold tracking-[-0.02em]">
          Gamma Developers
        </span>
        <span className="font-mono text-[9px] tracking-[0.16em] text-black/35 uppercase">
          Menu
        </span>
      </div>
      <div className="p-6">
        <p className="text-muted-foreground max-w-md text-[13px] leading-6">
          A thin brand-green rail fixed to the top edge of the viewport. It
          scrubs to full width as the visitor scrolls down the page — this
          card shows it mounted at rest, before any scroll has happened.
        </p>
      </div>
    </div>
  );
}
