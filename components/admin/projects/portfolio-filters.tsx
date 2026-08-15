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
import { cn } from "@/lib/utils";

const SEARCH_DEBOUNCE_MS = 300;

export function PortfolioFilters({
  query,
  options,
  canSeeArchived,
}: {
  query: PortfolioQuery;
  options: PortfolioOptions;
  canSeeArchived: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState(query.search);
  const [urlSearch, setUrlSearch] = useState(query.search);
  const [submitted, setSubmitted] = useState(query.search);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const filterCount = activeFilterCount(query);

  // Keep the box in step with the URL without wiping what someone is typing.
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
        "rounded-[18px] border border-black/[0.07] bg-[#f8f8f3] p-2.5 transition-opacity sm:p-3",
        pending && "opacity-70",
      )}
    >
      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1 lg:max-w-[340px]">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-black/30" />
          <input
            type="search"
            value={search}
            maxLength={SEARCH_MAX_LENGTH}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search projects or clients"
            aria-label="Search projects"
            className="h-10 w-full rounded-xl border border-black/[0.09] bg-white pr-3 pl-9 text-sm outline-none placeholder:text-black/30 focus:border-[#16a34a] focus-visible:ring-2 focus-visible:ring-[#16a34a]/25"
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

        <div className="hidden shrink-0 items-center gap-0.5 rounded-xl border border-black/[0.09] bg-white p-1 lg:flex">
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
        <span className="mr-0.5 hidden font-mono text-[9px] tracking-[0.12em] text-black/30 uppercase sm:inline">
          Status
        </span>
        {PROJECT_STATUSES.map((status) => {
          const active = query.statuses.includes(status);
          return (
            <button
              key={status}
              type="button"
              aria-pressed={active}
              onClick={() => toggleStatus(status)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[11px] font-medium transition focus-visible:ring-2 focus-visible:ring-[#16a34a]/40 focus-visible:outline-none",
                active
                  ? "border-[#15181b] bg-[#15181b] text-white"
                  : "border-black/[0.09] bg-white text-black/55 hover:border-black/20 hover:text-black",
              )}
            >
              {PROJECT_STATUS_LABEL[status]}
            </button>
          );
        })}

        {canSeeArchived ? (
          <button
            type="button"
            aria-pressed={query.includeArchived}
            onClick={() =>
              apply({ ...query, includeArchived: !query.includeArchived })
            }
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition focus-visible:ring-2 focus-visible:ring-[#16a34a]/40 focus-visible:outline-none",
              query.includeArchived
                ? "border-amber-300 bg-amber-100 text-amber-800"
                : "border-dashed border-black/15 bg-white text-black/45 hover:text-black",
            )}
          >
            <Archive className="size-3" />
            Archived
          </button>
        ) : null}

        {filterCount ? (
          <button
            type="button"
            onClick={reset}
            className="ml-auto inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold text-black/50 underline-offset-4 transition hover:text-black hover:underline focus-visible:ring-2 focus-visible:ring-[#16a34a]/40 focus-visible:outline-none"
          >
            <X className="size-3" />
            Reset {filterCount} filter{filterCount === 1 ? "" : "s"}
          </button>
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
    <label className="flex h-10 min-w-0 items-center gap-2 rounded-xl border border-black/[0.09] bg-white pr-1 pl-3 focus-within:border-[#16a34a] lg:w-[168px]">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value || null)}
        disabled={!options.length}
        className="h-full w-full min-w-0 cursor-pointer truncate bg-transparent text-sm outline-none disabled:cursor-not-allowed disabled:text-black/30"
      >
        <option value="">{allLabel}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
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
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "grid size-8 place-items-center rounded-lg transition focus-visible:ring-2 focus-visible:ring-[#16a34a]/40 focus-visible:outline-none",
        active
          ? "bg-[#15181b] text-white"
          : "text-black/35 hover:bg-black/[0.04] hover:text-black/70",
      )}
    >
      <Icon className="size-4" />
    </button>
  );
}
