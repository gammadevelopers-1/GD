"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Archive, LayoutGrid, Rows3, Search, X } from "lucide-react";
import type { PortfolioOptions } from "@/data/portfolio";
import {
  type PortfolioQuery,
  type PortfolioView,
  EMPTY_PORTFOLIO_QUERY,
  SEARCH_MAX_LENGTH,
  activeFilterCount,
  portfolioQueryToSearchParams,
} from "@/lib/projects/portfolio-query";
import {
  PROJECT_STATUSES,
  PROJECT_STATUS_LABEL,
  type ProjectStatus,
} from "@/lib/projects/status";
import { FormSelect } from "@/components/common/form-select";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const SEARCH_DEBOUNCE_MS = 300;

export function PortfolioFilters({
  query,
  options = { clients: [], people: [] },
  canSeeArchived,
}: {
  query: PortfolioQuery;
  options?: PortfolioOptions;
  canSeeArchived: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState(query.search);
  const [urlSearch, setUrlSearch] = useState(query.search);
  const [submitted, setSubmitted] = useState(query.search);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const filterCount = activeFilterCount(query);

  if (query.search !== urlSearch) {
    setUrlSearch(query.search);
    if (query.search !== submitted) {
      setSubmitted(query.search);
      setSearch(query.search);
    }
  }

  useEffect(() => {
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, []);

  function apply(next: PortfolioQuery) {
    const params = portfolioQueryToSearchParams(next).toString();
    startTransition(() => {
      router.replace(params ? `/projects?${params}` : "/projects", {
        scroll: false,
      });
    });
  }

  function onSearchChange(value: string) {
    setSearch(value);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      const next = value.trim();
      setSubmitted(next);
      apply({ ...query, search: next });
    }, SEARCH_DEBOUNCE_MS);
  }

  function toggleStatus(status: ProjectStatus) {
    const statuses = query.statuses.includes(status)
      ? query.statuses.filter((value) => value !== status)
      : [...query.statuses, status];
    apply({ ...query, statuses });
  }

  function setView(view: PortfolioView) {
    apply({ ...query, view });
  }

  function reset() {
    if (debounce.current) clearTimeout(debounce.current);
    setSearch("");
    setSubmitted("");
    apply({ ...EMPTY_PORTFOLIO_QUERY, view: query.view });
  }

  return (
    <section
      aria-label="Portfolio filters"
      aria-busy={pending}
      className={cn(
        "card-surface rounded-2xl border border-black/[0.06] p-3 transition-opacity",
        pending && "opacity-70",
      )}
    >
      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1 lg:max-w-[320px]">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-black/28" />
          <Input
            variant="bare"
            type="search"
            value={search}
            maxLength={SEARCH_MAX_LENGTH}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search projects or clients"
            aria-label="Search projects"
            className="h-10 w-full rounded-xl border border-black/8 bg-black/[0.02] pr-3 pl-9 text-sm transition outline-none placeholder:text-black/28 hover:border-black/15 focus:border-black/35 focus:bg-white focus-visible:ring-0"
          />
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:ml-auto lg:w-auto lg:grid-flow-col lg:grid-cols-none">
          <Select
            label="Client"
            value={query.clientId ?? ""}
            allLabel="All clients"
            options={options.clients}
            onChange={(value) => apply({ ...query, clientId: value })}
          />
          <Select
            label="Person"
            value={query.personId ?? ""}
            allLabel="All people"
            options={options.people}
            onChange={(value) => apply({ ...query, personId: value })}
          />
        </div>

        <div className="hidden shrink-0 items-center gap-0.5 rounded-xl border border-black/8 bg-black/[0.02] p-1 lg:flex">
          <ViewButton
            active={query.view === "grid"}
            label="Card view"
            icon={LayoutGrid}
            onClick={() => setView("grid")}
          />
          <ViewButton
            active={query.view === "table"}
            label="Table view"
            icon={Rows3}
            onClick={() => setView("table")}
          />
        </div>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5 border-t border-black/[0.06] pt-2.5">
        {PROJECT_STATUSES.map((status) => {
          const active = query.statuses.includes(status);
          return (
            <Button
              variant="bare"
              size="none"
              key={status}
              type="button"
              aria-pressed={active}
              onClick={() => toggleStatus(status)}
              className={cn(
                "focus-visible:ring-gd-green/40 rounded-full border px-3 py-1 text-[11px] font-medium transition duration-200 focus-visible:ring-2 focus-visible:outline-none",
                active
                  ? "border-gd-panel-dark bg-gd-panel-dark text-white shadow-[0_6px_16px_-6px_rgba(20,23,26,0.55)]"
                  : "hover:border-brand/45 border-black/8 bg-white text-black/50 hover:-translate-y-px hover:bg-white hover:text-black",
              )}
            >
              {PROJECT_STATUS_LABEL[status]}
            </Button>
          );
        })}

        {canSeeArchived ? (
          <Button
            variant="bare"
            size="none"
            type="button"
            aria-pressed={query.includeArchived}
            onClick={() =>
              apply({ ...query, includeArchived: !query.includeArchived })
            }
            className={cn(
              "focus-visible:ring-gd-green/40 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition focus-visible:ring-2 focus-visible:outline-none",
              query.includeArchived
                ? "border-amber-300 bg-amber-100 text-amber-800"
                : "border-dashed border-black/15 bg-white text-black/45 hover:text-black",
            )}
          >
            <Archive className="size-3" />
            Archived
          </Button>
        ) : null}

        {filterCount ? (
          <Button
            variant="bare"
            size="none"
            type="button"
            onClick={reset}
            className="focus-visible:ring-gd-green/40 ml-auto inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold text-black/50 underline-offset-4 transition hover:text-black hover:underline focus-visible:ring-2 focus-visible:outline-none"
          >
            <X className="size-3" />
            Reset {filterCount} filter{filterCount === 1 ? "" : "s"}
          </Button>
        ) : null}
      </div>
    </section>
  );
}

function Select({
  label,
  value,
  allLabel,
  options,
  onChange,
}: {
  label: string;
  value: string;
  allLabel: string;
  options: Array<{ id: string; name: string }>;
  onChange: (value: string | null) => void;
}) {
  return (
    <label className="focus-within:border-gd-green flex h-10 min-w-0 items-center gap-2 rounded-xl border border-black/8 bg-black/[0.02] pr-1 pl-3 transition hover:border-black/15 lg:w-42">
      <span className="sr-only">{label}</span>
      <FormSelect
        value={value}
        onValueChange={(nextValue) => onChange(nextValue || null)}
        disabled={!options.length}
        ariaLabel={label}
        triggerClassName="h-full w-full min-w-0 cursor-pointer truncate rounded-none border-0 bg-transparent px-0 text-sm shadow-none outline-none focus-visible:border-transparent focus-visible:ring-0 disabled:cursor-not-allowed disabled:text-black/30"
        options={[
          { value: "", label: allLabel },
          ...options.map((option) => ({
            value: option.id,
            label: option.name,
          })),
        ]}
      />
    </label>
  );
}

function ViewButton({
  active,
  label,
  icon: Icon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: typeof LayoutGrid;
  onClick: () => void;
}) {
  return (
    <Button
      variant="bare"
      size="none"
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "focus-visible:ring-gd-green/40 grid size-8 place-items-center rounded-lg transition focus-visible:ring-2 focus-visible:outline-none",
        active
          ? "bg-gd-panel-dark text-white"
          : "text-black/35 hover:bg-black/[0.04] hover:text-black/70",
      )}
    >
      <Icon className="size-4" />
    </Button>
  );
}
