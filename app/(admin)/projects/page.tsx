import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PortfolioFilters } from "@/components/admin/projects/portfolio-filters";
import { PortfolioResults } from "@/components/admin/projects/portfolio-results";
import { PortfolioSkeleton } from "@/components/admin/projects/portfolio-skeleton";
import { requireRole, type Viewer } from "@/data/auth";
import { getPortfolio, getPortfolioOptions } from "@/data/portfolio";
import {
  type PortfolioQuery,
  type RawSearchParams,
  parsePortfolioQuery,
  portfolioQueryKey,
} from "@/lib/projects/portfolio-query";

export const metadata = { title: "Projects · Internal platform" };

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  // Only the role gate blocks the shell now. The filter options and the results
  // are two more round trips that used to run one after the other in front of
  // the heading; they stream into their own boundaries instead.
  const viewer = await requireRole(["owner", "member"]);
  const isOwner = viewer.role === "owner";
  const raw = await searchParams;
  const query = parsePortfolioQuery(raw, isOwner);

  return (
    <div className="mx-auto max-w-[1480px] space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-[1.75rem] leading-none font-semibold tracking-[-0.05em] sm:text-[2.15rem]">
          {isOwner ? "Projects" : "Your projects"}
        </h1>

        {isOwner ? (
          <Link
            href="/projects/new"
            data-button-fill
            className="button-fill-fx button-fill-fx--lift inline-flex h-10 items-center gap-2 rounded-xl bg-[#15181b] px-4 text-[13px] font-semibold text-white [--button-fill-color:#2fe85c] [--button-fill-hover-text:#101512]"
          >
            <Plus className="size-4" />
            <span className="button-fill-fx__label">New project</span>
          </Link>
        ) : null}
      </div>

      <Suspense
        fallback={<PortfolioFilters query={query} canSeeArchived={isOwner} />}
      >
        <FiltersSection viewer={viewer} query={query} isOwner={isOwner} />
      </Suspense>

      <Suspense
        key={portfolioQueryKey(query)}
        fallback={<PortfolioSkeleton view={query.view} />}
      >
        <PortfolioList viewer={viewer} query={query} />
      </Suspense>
    </div>
  );
}

async function FiltersSection({
  viewer,
  query,
  isOwner,
}: {
  viewer: Viewer;
  query: PortfolioQuery;
  isOwner: boolean;
}) {
  const options = await getPortfolioOptions(viewer);

  return (
    <PortfolioFilters
      query={query}
      options={options}
      canSeeArchived={isOwner}
    />
  );
}

async function PortfolioList({
  viewer,
  query,
}: {
  viewer: Viewer;
  query: PortfolioQuery;
}) {
  const projects = await getPortfolio(viewer, query);

  return (
    <PortfolioResults projects={projects} query={query} role={viewer.role} />
  );
}
