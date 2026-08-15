import { Suspense } from "react";
import Link from "next/link";
import { ArrowUpRight, FolderKanban, Plus, X } from "lucide-react";
import { PortfolioFilters } from "@/components/admin/projects/portfolio-filters";
import { PortfolioResults } from "@/components/admin/projects/portfolio-results";
import { PortfolioSkeleton } from "@/components/admin/projects/portfolio-skeleton";
import { requireRole, type Viewer } from "@/data/auth";
import { getPortfolio, getPortfolioOptions } from "@/data/portfolio";
import {
  type PortfolioQuery,
  type RawSearchParams,
  isPortfolioFiltered,
  parsePortfolioQuery,
  portfolioQueryKey,
} from "@/lib/projects/portfolio-query";

export const metadata = { title: "Projects · Internal platform" };

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const viewer = await requireRole(["owner", "member"]);
  const isOwner = viewer.role === "owner";
  const raw = await searchParams;
  const query = parsePortfolioQuery(raw, isOwner);
  const options = await getPortfolioOptions(viewer);
  const archived =
    (Array.isArray(raw.notice) ? raw.notice[0] : raw.notice) === "archived";

  return (
    <div className="mx-auto max-w-[1480px] space-y-4">
      {archived ? (
        <div
          role="status"
          className="flex items-start justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
        >
          <span>
            Project archived. It is out of the portfolio and members can no
            longer reach it — turn on the Archived filter to find or restore it.
          </span>
          <Link
            href="/projects"
            aria-label="Dismiss"
            className="shrink-0 opacity-60 transition hover:opacity-100"
          >
            <X className="size-4" />
          </Link>
        </div>
      ) : null}
      <section className="relative overflow-hidden rounded-[20px] bg-[#15181b] px-5 py-5 text-white sm:px-6">
        <div className="pointer-events-none absolute -top-32 right-0 size-72 rounded-full bg-[#2fe85c]/12 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3.5">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.055]">
              <FolderKanban className="size-[18px] text-[#2fe85c]" />
            </span>
            <div className="min-w-0">
              <p className="font-mono text-[9px] tracking-[0.16em] text-[#69ee88] uppercase">
                Delivery workspace
              </p>
              <h1 className="font-display mt-1.5 text-[1.65rem] leading-none font-semibold tracking-[-0.05em] sm:text-[2rem]">
                {isOwner ? "Every project, one view" : "Your projects"}
              </h1>
              <p className="mt-2 max-w-2xl text-[13px] leading-5 text-white/45">
                {isOwner
                  ? "Status, lead, deadline and weekly progress — filterable, bookmarkable, and the same answer the whole team sees."
                  : "The projects you are assigned to, with delivery stage, weekly progress and next deadline."}
              </p>
            </div>
          </div>

          {isOwner ? (
            <Link
              href="/projects/new"
              data-button-fill
              className="button-fill-fx button-fill-fx--lift group inline-flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-[#2fe85c] px-4 text-sm font-semibold text-[#101512] shadow-[0_16px_40px_rgba(47,232,92,0.16)] transition hover:shadow-[0_20px_48px_rgba(47,232,92,0.26)] sm:w-fit"
            >
              <Plus className="size-4" />
              <span className="button-fill-fx__label">New project</span>
              <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          ) : null}
        </div>
      </section>

      <PortfolioFilters
        query={query}
        options={options}
        canSeeArchived={isOwner}
      />

      <Suspense
        key={portfolioQueryKey(query)}
        fallback={<PortfolioSkeleton view={query.view} />}
      >
        <PortfolioList viewer={viewer} query={query} />
      </Suspense>
    </div>
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
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold tracking-[-0.02em]">
          {viewer.role === "member" ? "Assigned projects" : "Portfolio"}
        </h2>
        <p className="text-xs text-black/40" aria-live="polite">
          {projects.length} project{projects.length === 1 ? "" : "s"}
          {isPortfolioFiltered(query) ? " matching your filters" : ""}
        </p>
      </div>
      <PortfolioResults projects={projects} query={query} role={viewer.role} />
    </div>
  );
}
