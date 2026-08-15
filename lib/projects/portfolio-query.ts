import {
  type ProjectStatus,
  PROJECT_STATUSES,
  isProjectStatus,
} from "@/lib/projects/status";

// Filters live in the URL so a portfolio view can be bookmarked, refreshed and
// shared. Everything here is validated: an unknown status or a malformed id is
// dropped rather than passed to the database.

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const SEARCH_MAX_LENGTH = 80;

export type PortfolioView = "grid" | "table";

export type PortfolioQuery = {
  search: string;
  statuses: ProjectStatus[];
  clientId: string | null;
  personId: string | null;
  includeArchived: boolean;
  view: PortfolioView;
};

export type RawSearchParams = Record<string, string | string[] | undefined>;

export const EMPTY_PORTFOLIO_QUERY: PortfolioQuery = {
  search: "",
  statuses: [],
  clientId: null,
  personId: null,
  includeArchived: false,
  view: "grid",
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function uuidOrNull(value: string | string[] | undefined) {
  const raw = first(value)?.trim();
  return raw && UUID.test(raw) ? raw : null;
}

/**
 * @param canSeeArchived Only owners may ask for archived rows. The database
 * refuses either way; this keeps the URL honest for everyone else.
 */
export function parsePortfolioQuery(
  params: RawSearchParams,
  canSeeArchived = false,
): PortfolioQuery {
  const statusValues = (first(params.status) ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(isProjectStatus);

  return {
    search: (first(params.q) ?? "").trim().slice(0, SEARCH_MAX_LENGTH),
    statuses: PROJECT_STATUSES.filter((status) =>
      statusValues.includes(status),
    ),
    clientId: uuidOrNull(params.client),
    personId: uuidOrNull(params.person),
    includeArchived: canSeeArchived && first(params.archived) === "1",
    view: first(params.view) === "table" ? "table" : "grid",
  };
}

export function portfolioQueryToSearchParams(query: PortfolioQuery) {
  const params = new URLSearchParams();
  if (query.search) params.set("q", query.search);
  if (query.statuses.length) params.set("status", query.statuses.join(","));
  if (query.clientId) params.set("client", query.clientId);
  if (query.personId) params.set("person", query.personId);
  if (query.includeArchived) params.set("archived", "1");
  if (query.view === "table") params.set("view", "table");
  return params;
}

/** A stable key for the current filters, used to re-suspend the results list. */
export function portfolioQueryKey(query: PortfolioQuery) {
  return portfolioQueryToSearchParams(query).toString();
}

/** The view toggle is a preference, not a filter, so it never counts here. */
export function activeFilterCount(query: PortfolioQuery) {
  return (
    (query.search ? 1 : 0) +
    query.statuses.length +
    (query.clientId ? 1 : 0) +
    (query.personId ? 1 : 0) +
    (query.includeArchived ? 1 : 0)
  );
}

export function isPortfolioFiltered(query: PortfolioQuery) {
  return activeFilterCount(query) > 0;
}
