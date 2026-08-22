import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Viewer } from "@/data/auth";
import type { ProjectStatus } from "@/lib/projects/status";

export type { ProjectStatus };

export type DashboardProject = {
  id: string;
  publicId: string;
  name: string;
  client: string;
  status: ProjectStatus;
  dueOn: string | null;
  lead: string;
  progress: number;
};

export type Trend = {
  current: number;
  previous: number;
};

export type DeliveryWeek = {
  label: string;
  done: number;
  total: number;
};

export type DashboardData = {
  projects: DashboardProject[];
  activeCount: number;
  dueSoonCount: number;
  overdueMilestones: number;
  shipped: Trend;
  delivery: DeliveryWeek[];
  planlessCount: number;
  financials: null | {
    revenuePkr: number;
    revenueUsd: number;
    revenuePkrPrevious: number;
    unpaidPkr: number;
    unpaidUsd: number;
    unpaidCount: number;
    overdueCount: number;
    overduePkr: number;
  };
};

type SummaryProject = {
  id: string;
  public_id: string;
  name: string;
  status: ProjectStatus;
  due_on: string | null;
  client_name: string | null;
  lead_name: string | null;
  progress: number;
  has_weeks: boolean;
};

type SummaryMoney = {
  revenue_pkr: number;
  revenue_usd: number;
  revenue_pkr_previous: number;
  unpaid_pkr: number;
  unpaid_usd: number;
  unpaid_count: number;
  overdue_count: number;
  overdue_pkr: number;
};

type Summary = {
  projects: SummaryProject[];
  overdue_cards: number;
  shipped_current: number;
  shipped_previous: number;
  delivery: Array<{ back: number; done: number }>;
  financials: SummaryMoney | null;
};

const EMPTY: DashboardData = {
  projects: [],
  activeCount: 0,
  dueSoonCount: 0,
  overdueMilestones: 0,
  shipped: { current: 0, previous: 0 },
  delivery: [],
  planlessCount: 0,
  financials: null,
};

export const getDashboardData = cache(async function getDashboardData(
  viewer: Viewer,
): Promise<DashboardData> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("app_dashboard_summary");

  if (error || !data) return EMPTY;

  const summary = data as Summary;
  const now = new Date();
  const soon = new Date(now);
  soon.setDate(soon.getDate() + 14);

  const projects: DashboardProject[] = (summary.projects ?? []).map(
    (project) => ({
      id: String(project.id),
      publicId: String(project.public_id),
      name: String(project.name),
      client: project.client_name ? String(project.client_name) : "Client",
      status: project.status,
      dueOn: project.due_on,
      lead: project.lead_name ? String(project.lead_name) : "Unassigned",
      progress: Number(project.progress ?? 0),
    }),
  );

  const delivery: DeliveryWeek[] = (summary.delivery ?? [])
    .slice()
    .sort((a, b) => b.back - a.back)
    .map((week) => ({
      label: week.back === 0 ? "Now" : `-${week.back}w`,
      done: Number(week.done ?? 0),
      total: 0,
    }));

  const peak = Math.max(1, ...delivery.map((week) => week.done));
  for (const week of delivery) week.total = peak;

  const money = summary.financials;

  return {
    projects,
    activeCount: projects.length,
    dueSoonCount: projects.filter((project) => {
      if (!project.dueOn) return false;
      const date = new Date(`${project.dueOn}T00:00:00`);
      return date >= now && date <= soon;
    }).length,
    overdueMilestones: Number(summary.overdue_cards ?? 0),
    shipped: {
      current: Number(summary.shipped_current ?? 0),
      previous: Number(summary.shipped_previous ?? 0),
    },
    delivery,
    planlessCount: (summary.projects ?? []).filter(
      (project) => !project.has_weeks,
    ).length,
    financials:
      viewer.role === "owner" || viewer.role === "finance"
        ? money
          ? {
              revenuePkr: Number(money.revenue_pkr ?? 0),
              revenueUsd: Number(money.revenue_usd ?? 0),
              revenuePkrPrevious: Number(money.revenue_pkr_previous ?? 0),
              unpaidPkr: Number(money.unpaid_pkr ?? 0),
              unpaidUsd: Number(money.unpaid_usd ?? 0),
              unpaidCount: Number(money.unpaid_count ?? 0),
              overdueCount: Number(money.overdue_count ?? 0),
              overduePkr: Number(money.overdue_pkr ?? 0),
            }
          : null
        : null,
  };
});
