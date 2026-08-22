import { Shimmer } from "gd-website";

export function CardLines() {
  return (
    <div className="card-surface max-w-sm rounded-2xl border border-black/[0.06] p-5">
      <Shimmer className="h-2 w-24" />
      <Shimmer className="mt-3 h-5 w-3/4 rounded-lg" />
      <Shimmer className="mt-4 h-3 w-full" />
      <Shimmer className="mt-2 h-3 w-2/3" />
    </div>
  );
}

export function AvatarRow() {
  return (
    <div className="flex max-w-sm items-center gap-3 p-4">
      <Shimmer className="size-9 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1">
        <Shimmer className="h-3 w-32" />
        <Shimmer className="mt-2 h-2.5 w-20" />
      </div>
    </div>
  );
}
