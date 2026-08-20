import { HeroSkeleton } from "@/components/admin/projects/hero-skeleton";
import { PanelSkeleton } from "@/components/admin/skeletons";

// Matches the real shell, so the frame that appears while the project loads is
// the same frame that stays once it has.
export default function ProjectWorkspaceLoading() {
  return (
    <div className="mx-auto max-w-[1480px]" aria-busy role="status">
      <span className="sr-only">Loading project</span>

      <span className="mb-4 block h-3 w-24 animate-pulse rounded bg-black/[0.05]" />

      <section className="panel-dark overflow-hidden rounded-[20px] border border-black/[0.07]">
        <HeroSkeleton />
        <div className="flex gap-2 border-t border-white/[0.07] px-2 py-3.5 sm:px-4">
          {["overview", "team", "milestone", "technical"].map((tab) => (
            <span
              key={tab}
              className="mx-1.5 block h-3 animate-pulse rounded bg-white/[0.09] sm:mx-2"
              style={{ width: `${tab.length * 7}px` }}
            />
          ))}
        </div>
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <PanelSkeleton lines={8} />
        <div className="space-y-4">
          <PanelSkeleton lines={5} />
          <PanelSkeleton lines={3} />
        </div>
      </div>
    </div>
  );
}
