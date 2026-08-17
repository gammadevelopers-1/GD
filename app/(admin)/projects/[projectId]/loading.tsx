import { PanelSkeleton, Shimmer } from "@/components/admin/skeletons";

// The workspace reads a project, its team, its weeks and its items before it
// can render anything. Without this file that whole wait happens on the
// portfolio screen, with nothing to show the click registered.
//
// It mirrors the real header so the swap to live content is not a jump.
export default function ProjectWorkspaceLoading() {
  return (
    <div className="mx-auto max-w-[1480px]" aria-busy role="status">
      <span className="sr-only">Loading project</span>

      <Shimmer className="mb-4 h-3 w-24 bg-black/[0.05]" />

      <section className="mesh-dark overflow-hidden rounded-[20px] border border-black/[0.07]">
        <div className="px-4 pt-5 pb-5 sm:px-6">
          <span className="block h-2 w-28 animate-pulse rounded bg-white/[0.09]" />
          <span className="mt-3 block h-7 w-2/3 max-w-sm animate-pulse rounded-lg bg-white/[0.11] sm:h-8" />
          <span className="mt-3 block h-3 w-full max-w-xl animate-pulse rounded bg-white/[0.06]" />

          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="rounded-xl border border-white/[0.07] bg-white/[0.035] px-3 py-2.5"
              >
                <span className="block h-2 w-12 animate-pulse rounded bg-white/[0.09]" />
                <span className="mt-2 block h-2.5 w-20 animate-pulse rounded bg-white/[0.06]" />
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2 border-t border-white/[0.07] px-2 py-3.5 sm:px-4">
          {["overview", "team", "milestones", "technical"].map((tab) => (
            <span
              key={tab}
              className="mx-1.5 block h-3 animate-pulse rounded bg-white/[0.09] sm:mx-2"
              style={{ width: `${tab.length * 7}px` }}
            />
          ))}
        </div>
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <div className="space-y-4">
          <PanelSkeleton lines={5} />
        </div>
        <div className="space-y-4">
          <PanelSkeleton lines={4} />
        </div>
      </div>
    </div>
  );
}
