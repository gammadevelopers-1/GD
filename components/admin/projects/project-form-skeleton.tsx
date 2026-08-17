import { Shimmer } from "@/components/admin/skeletons";

// Both project form routes read the client and people lists before they can
// render a single field, so they need a boundary of their own.
export function ProjectFormSkeleton() {
  return (
    <div className="mx-auto max-w-3xl" aria-busy role="status">
      <span className="sr-only">Loading project form</span>
      <Shimmer className="mb-5 h-3 w-20 bg-black/[0.05]" />

      <div className="card-surface rounded-2xl border border-black/[0.06] p-5 sm:p-7">
        <Shimmer className="size-11 rounded-xl" />
        <Shimmer className="mt-4 h-6 w-56 rounded-lg" />
        <Shimmer className="mt-3 h-3 w-full max-w-md bg-black/[0.045]" />

        <div className="mt-7 grid gap-5 sm:grid-cols-2">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index}>
              <Shimmer className="h-2 w-24" />
              <Shimmer className="mt-2 h-10 rounded-xl" />
            </div>
          ))}
        </div>

        <div className="mt-7 flex justify-end gap-2">
          <Shimmer className="h-10 w-24 rounded-xl" />
          <Shimmer className="h-10 w-32 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
