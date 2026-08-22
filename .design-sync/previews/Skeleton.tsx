import { Skeleton } from "gd-website";

export function ProjectCard() {
  return (
    <div className="card-surface max-w-sm space-y-3 rounded-2xl border border-black/[0.06] p-5">
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-2.5 w-20" />
        </div>
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}

export function KpiTile() {
  return (
    <div className="max-w-40 space-y-3 rounded-2xl border border-black/[0.06] bg-[#f8f8f3] p-5">
      <Skeleton className="h-2 w-16" />
      <Skeleton className="h-8 w-14 rounded-lg" />
    </div>
  );
}
