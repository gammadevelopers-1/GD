import { Separator } from "gd-website";

export function Horizontal() {
  return (
    <div className="card-surface max-w-sm rounded-2xl border border-black/[0.06] p-5">
      <p className="font-mono text-[9px] tracking-[0.16em] text-black/40 uppercase">
        Northwind Logistics
      </p>
      <Separator className="my-3" />
      <div className="flex items-center justify-between text-[13px] text-black/70">
        <span>Week 6 of 8</span>
        <span className="font-mono text-[11px] text-black/40">Building</span>
      </div>
      <Separator className="my-3" />
      <div className="flex items-center justify-between text-[13px] text-black/70">
        <span>Retainer starts</span>
        <span className="font-mono text-[11px] text-black/40">Sep 14</span>
      </div>
    </div>
  );
}

export function Vertical() {
  return (
    <div className="flex items-center gap-3 p-6 font-mono text-[11px] tracking-[0.08em] text-black/45 uppercase">
      <span>Discovery</span>
      <Separator orientation="vertical" className="h-4" />
      <span>Building</span>
      <Separator orientation="vertical" className="h-4" />
      <span className="text-[#0b5f2c]">Review</span>
      <Separator orientation="vertical" className="h-4" />
      <span>Live</span>
    </div>
  );
}
