import { PageHeadingSkeleton, Shimmer } from "@/components/admin/skeletons";

export default function CmsLoading() {
  return (
    <div className="mx-auto max-w-[1480px]" aria-busy role="status">
      <span className="sr-only">Loading CMS records</span>
      <PageHeadingSkeleton />
      <div className="bg-gd-panel overflow-hidden rounded-[20px] border border-black/[0.07]">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="flex items-center justify-between gap-4 border-b border-black/[0.055] px-5 py-4 last:border-0"
          >
            <Shimmer className="h-3 w-48" />
            <Shimmer className="h-3 w-20 bg-black/[0.045]" />
          </div>
        ))}
      </div>
    </div>
  );
}
