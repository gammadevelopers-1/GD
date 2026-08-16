import { PortfolioSkeleton } from "@/components/admin/projects/portfolio-skeleton";

export default function ProjectsLoading() {
  return (
    <div className="mx-auto max-w-[1480px] space-y-5" aria-busy>
      <div className="flex items-center justify-between gap-3">
        <span className="block h-8 w-44 animate-pulse rounded-lg bg-black/[0.07]" />
        <span className="block h-10 w-32 animate-pulse rounded-xl bg-black/[0.07]" />
      </div>
      <div className="h-26 animate-pulse rounded-[18px] border border-black/[0.07] bg-white/55 backdrop-blur-sm" />
      <PortfolioSkeleton />
    </div>
  );
}
