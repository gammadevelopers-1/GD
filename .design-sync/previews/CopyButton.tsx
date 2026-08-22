import { CopyButton } from "gd-website";

export function Default() {
  return (
    <div className="flex items-center gap-3 bg-[#f8f8f3] p-6">
      <span className="text-[12.5px] text-black/60">
        Priya.Access-2026@northwindlogistics.com
      </span>
      <CopyButton
        value="Priya.Access-2026@northwindlogistics.com"
        label="Email"
      />
    </div>
  );
}

export function InFieldRow() {
  return (
    <div className="max-w-sm bg-[#f8f8f3] p-6">
      <div className="flex flex-wrap items-center gap-2 rounded-lg bg-white px-3 py-2">
        <span className="w-16 shrink-0 text-[11.5px] text-black/45">
          Password
        </span>
        <span className="min-w-0 flex-1 truncate font-mono text-[12.5px] tracking-[0.02em] text-black/80">
          8f2c-tqx9-lm4r
        </span>
        <CopyButton value="8f2c-tqx9-lm4r" label="Password" />
      </div>
    </div>
  );
}
