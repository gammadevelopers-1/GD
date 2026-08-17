import { cn } from "@/lib/utils";

// One shimmer definition, so every loading screen pulses at the same rate and
// a half-loaded platform never looks like two different products.
export function Shimmer({ className }: { className?: string }) {
  return (
    <span
      className={cn("block animate-pulse rounded bg-black/[0.06]", className)}
    />
  );
}

// Matches PageHeading: eyebrow, title, description, optional action.
export function PageHeadingSkeleton({ action = false }: { action?: boolean }) {
  return (
    <div className="mb-7 flex flex-col gap-5 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="w-full">
        <Shimmer className="h-2 w-24" />
        <Shimmer className="mt-3 h-9 w-56 rounded-lg sm:h-11 sm:w-72" />
        <Shimmer className="mt-4 h-3 w-full max-w-lg" />
      </div>
      {action ? <Shimmer className="h-10 w-36 shrink-0 rounded-xl" /> : null}
    </div>
  );
}

// A light card placeholder used wherever a list of records will land.
export function CardGridSkeleton({
  count = 6,
  height = "h-32",
  className,
}: {
  count?: number;
  height?: string;
  className?: string;
}) {
  return (
    <div
      className={cn("grid gap-3 md:grid-cols-2 xl:grid-cols-3", className)}
      aria-hidden
    >
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={cn(
            "animate-pulse rounded-[20px] border border-black/[0.07] bg-[#f8f8f3]",
            height,
          )}
        />
      ))}
    </div>
  );
}

// Stand-in for a titled panel on the project workspace.
export function PanelSkeleton({
  lines = 4,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <section
      aria-hidden
      className={cn(
        "card-surface rounded-2xl border border-black/[0.06] p-5",
        className,
      )}
    >
      <div className="mb-5 flex items-center gap-2.5">
        <Shimmer className="size-4 rounded" />
        <Shimmer className="h-3 w-32" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, index) => (
          <Shimmer
            key={index}
            className={cn("h-3", index === lines - 1 ? "w-2/3" : "w-full")}
          />
        ))}
      </div>
    </section>
  );
}
