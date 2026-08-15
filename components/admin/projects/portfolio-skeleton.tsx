import type { PortfolioView } from "@/lib/projects/portfolio-query";
import { cn } from "@/lib/utils";

export function PortfolioSkeleton({ view = "grid" }: { view?: PortfolioView }) {
  return (
    <div className="space-y-4" aria-hidden>
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-black/[0.07] bg-black/[0.07] lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="flex items-center gap-3 bg-[#f8f8f3] px-4 py-3.5"
          >
            <span className="size-8 shrink-0 animate-pulse rounded-lg bg-black/[0.06]" />
            <div className="w-full space-y-2">
              <span className="block h-3 w-8 animate-pulse rounded bg-black/[0.06]" />
              <span className="block h-2 w-20 animate-pulse rounded bg-black/[0.045]" />
            </div>
          </div>
        ))}
      </div>

      <div
        className={cn(
          "grid gap-4 sm:grid-cols-2",
          view === "grid" ? "xl:grid-cols-3" : "lg:hidden",
        )}
      >
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-[228px] animate-pulse rounded-[20px] border border-black/[0.075] bg-[#f8f8f3]"
          />
        ))}
      </div>

      {view === "table" ? (
        <div className="hidden divide-y divide-black/[0.055] overflow-hidden rounded-[20px] border border-black/[0.07] bg-[#f8f8f3] lg:block">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="px-5 py-4">
              <span className="block h-4 w-full animate-pulse rounded bg-black/[0.05]" />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
