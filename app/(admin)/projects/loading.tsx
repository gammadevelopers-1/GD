import { PortfolioSkeleton } from "@/components/admin/projects/portfolio-skeleton";

export default function ProjectsLoading() {
  return (
    <div className="mx-auto max-w-[1480px] space-y-4" aria-busy>
      <div className="h-[168px] animate-pulse rounded-[20px] bg-[#15181b]/90 sm:h-[124px]" />
      <div className="h-[124px] animate-pulse rounded-[18px] border border-black/[0.07] bg-[#f8f8f3] sm:h-[104px]" />
      <PortfolioSkeleton />
    </div>
  );
}
