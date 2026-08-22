import { Mark } from "gd-website";

export function Default() {
  return (
    <div className="bg-background flex items-center gap-3 p-6">
      <Mark />
      <span className="font-display text-[15px] font-semibold tracking-[-0.02em] text-[#14171a]">
        Gamma Developers
      </span>
    </div>
  );
}

export function Large() {
  return (
    <div className="bg-background p-6">
      <Mark className="size-10 rounded-[10px] text-[15px]" />
    </div>
  );
}
