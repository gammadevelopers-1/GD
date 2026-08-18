import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Viewer } from "@/data/auth";
import type { ProjectStatus } from "@/lib/projects/status";
import type { PortfolioQuery } from "@/lib/projects/portfolio-query";

export type PortfolioProject = {
  id: string;
  publicId: string;
  name: string;
  status: ProjectStatus;
  clientId: string | null;
  clientName: string | null;
  leadId: string | null;
  leadName: string | null;
  startsOn: string | null;
  dueOn: string | null;
  isArchived: boolean;
  memberCount: number;
  totalItems: number;
  doneItems: number;
  overdueItems: number;
  progress: number;
  currentWeek: {
    number: number;
    dueOn: string | null;
    total: number;
    done: number;
  } | null;
  value: { amount: number; currency: "PKR" | "USD" } | null;
};

export type PortfolioOptions = {
  clients: Array<{ id: string; name: string }>;
  people: Array<{ id: string; name: string }>;
};

type PortfolioRow = {
  id: string;
  public_id: string;
  name: string;
  status: ProjectStatus;
  client_id: string | null;
  client_name: string | null;
  lead_id: string | null;
  lead_name: string | null;
  starts_on: string | null;
  due_on: string | null;
  is_archived: boolean;
  member_count: number;
  total_items: number;
  done_items: number;
  overdue_items: number;
  current_week_number: number | null;
  current_week_due_on: string | null;
  current_week_total: number | null;
  current_week_done: number | null;
};

function canUseProjects(viewer: Viewer) {
  return viewer.role === "owner" || viewer.role === "member";
}

export async function getPortfolio(
  viewer: Viewer,
  query: PortfolioQuery,
): Promise<PortfolioProject[]> {
  if (!canUseProjects(viewer)) return [];

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("app_project_portfolio", {
    search_text: query.search || null,
    filter_statuses: query.statuses.length ? query.statuses : null,
    filter_client_id: query.clientId,
    filter_person_id: query.personId,
    include_archived: viewer.role === "owner" && query.includeArchived,
  });

  if (error) throw new Error(`Portfolio read failed: ${error.message}`);

  const rows = (data ?? []) as PortfolioRow[];
  const values = await getProjectValues(
    viewer,
    rows.map((row) => row.id),
  );

  return rows.map((row) => {
    const total = Number(row.total_items ?? 0);
    const done = Number(row.done_items ?? 0);
    return {
      id: String(row.id),
      publicId: String(row.public_id),
      name: String(row.name),
      status: row.status,
      clientId: row.client_id ? String(row.client_id) : null,
      clientName: row.client_name ? String(row.client_name) : null,
      leadId: row.lead_id ? String(row.lead_id) : null,
      leadName: row.lead_name ? String(row.lead_name) : null,
      startsOn: row.starts_on,
      dueOn: row.due_on,
      isArchived: Boolean(row.is_archived),
      memberCount: Number(row.member_count ?? 0),
      totalItems: total,
      doneItems: done,
      overdueItems: Number(row.overdue_items ?? 0),
      progress: total ? Math.round((done / total) * 100) : 0,
      currentWeek:
        row.current_week_number === null
          ? null
          : {
              number: Number(row.current_week_number),
              dueOn: row.current_week_due_on,
              total: Number(row.current_week_total ?? 0),
              done: Number(row.current_week_done ?? 0),
            },
      value: values.get(String(row.id)) ?? null,
    };
  });
}

// owner only
async function getProjectValues(viewer: Viewer, projectIds: string[]) {
  const values = new Map<string, { amount: number; currency: "PKR" | "USD" }>();
  if (viewer.role !== "owner" || !projectIds.length) return values;

  const supabase = await createClient();
  const { data } = await supabase
    .from("app_project_financials")
    .select("project_id, value_amount, value_currency")
    .in("project_id", projectIds);

  for (const row of data ?? []) {
    values.set(String(row.project_id), {
      amount: Number(row.value_amount),
      currency: row.value_currency as "PKR" | "USD",
    });
  }
  return values;
}

export async function getPortfolioOptions(
  viewer: Viewer,
): Promise<PortfolioOptions> {
  if (!canUseProjects(viewer)) return { clients: [], people: [] };

  const supabase = await createClient();
  const [clientsResult, peopleResult] = await Promise.all([
    supabase.rpc("app_portfolio_clients"),
    supabase.rpc("app_portfolio_people"),
  ]);

  return {
    clients: (
      (clientsResult.data ?? []) as Array<{ id: string; name: string }>
    ).map((row) => ({ id: String(row.id), name: String(row.name) })),
    people: (
      (peopleResult.data ?? []) as Array<{ id: string; full_name: string }>
    ).map((row) => ({ id: String(row.id), name: String(row.full_name) })),
  };
}
