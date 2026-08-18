import {
  CardGridSkeleton,
  PageHeadingSkeleton,
  Shimmer,
} from "@/components/admin/skeletons";
export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-[1480px]" aria-busy role="status">
      <span className="sr-only">Loading overview</span>
      <PageHeadingSkeleton action />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-[20px] border border-black/[0.07] bg-[#f8f8f3] p-5"
          >
            <Shimmer className="h-2 w-20" />
            <Shimmer className="mt-4 h-7 w-24 rounded-lg" />
            <Shimmer className="mt-3 h-2 w-28 bg-black/[0.045]" />
          </div>
        ))}
      </div>

      <CardGridSkeleton className="mt-6" count={3} height="h-52" />
    </div>
  );
}
