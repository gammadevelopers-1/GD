import { CardGridSkeleton, Shimmer } from "@/components/admin/skeletons";

export function DashboardBodySkeleton({ money }: { money: boolean }) {
  return (
    <div aria-busy role="status">
      <span className="sr-only">Loading overview</span>

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

      {money ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={index}
              className="rounded-[20px] border border-black/[0.07] bg-[#f8f8f3] p-5"
            >
              <Shimmer className="h-2 w-24" />
              <Shimmer className="mt-4 h-7 w-32 rounded-lg" />
              <Shimmer className="mt-3 h-2 w-20 bg-black/[0.045]" />
            </div>
          ))}
        </div>
      ) : null}

      <CardGridSkeleton className="mt-6" count={3} height="h-52" />
    </div>
  );
}
