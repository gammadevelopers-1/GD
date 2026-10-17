import { cn } from "@/lib/utils";

/** Eyebrow rail, two-tone display heading, balanced lead. Used by every home section. */
export function SectionHead({
  eyebrow,
  one,
  two,
  lead,
  tone = "light",
  id,
}: {
  eyebrow: string;
  one: string;
  two: string;
  lead?: string;
  tone?: "light" | "dark";
  id?: string;
}) {
  const dark = tone === "dark";

  return (
    <div className="grid gap-x-[56px] gap-y-7 lg:grid-cols-2 lg:items-end">
      <div>
        <p
          className={cn(
            "t-eyebrow flex items-center gap-3",
            dark ? "text-dim-dark" : "text-dim",
          )}
        >
          <span
            aria-hidden
            className={cn(
              "h-px w-8",
              dark ? "bg-dark-line-strong" : "bg-line-strong",
            )}
          />
          {eyebrow}
        </p>
        <h2
          id={id}
          className="font-display mt-6 text-[clamp(28px,3.5vw,44px)] leading-[0.98] font-bold tracking-[-0.045em] uppercase"
        >
          <span className={cn("block", dark ? "text-dark-head" : "text-ink")}>
            {one}
          </span>
          <span className={cn("block", dark ? "text-brand" : "text-green-ink")}>
            {two}
          </span>
        </h2>
      </div>

      {lead ? (
        <p
          style={{ textWrap: "balance" }}
          className={cn(
            "text-[16px] leading-[1.65] lg:pb-[6px]",
            dark ? "text-dark-body" : "text-ink-soft",
          )}
        >
          {lead}
        </p>
      ) : null}
    </div>
  );
}
