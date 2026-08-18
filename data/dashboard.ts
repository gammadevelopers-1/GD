import "server-only";

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

export type DashboardData = {
  projects: DashboardProject[];
  activeCount: number;
  dueSoonCount: number;
  overdueMilestones: number;
  financials: null | {
    revenuePkr: number;
    revenueUsd: number;
    unpaidPkr: number;
    unpaidUsd: number;
    unpaidCount: number;
  };
};

type RawProject = {
  id: string;
  public_id: string;
  name: string;
  status: ProjectStatus;
  due_on: string | null;
  client_id: string;
  lead_id: string | null;
};

type RawInvoice = {
  amount: number;
  currency: "PKR" | "USD";
  exchange_rate_to_pkr: number;
  status: "draft" | "sent" | "paid" | "overdue" | "void";
  paid_at: string | null;
};

export async function getDashboardData(viewer: Viewer): Promise<DashboardData> {
  const supabase = await createClient();
  const now = new Date();
  const soon = new Date(now);
  soon.setDate(soon.getDate() + 14);
  const monthStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    1,
  ).toISOString();

  const [projectsResult, clientsResult, profilesResult, weeksResult] =
    await Promise.all([
      supabase
        .from("app_projects")
        .select("id, public_id, name, status, due_on, client_id, lead_id")
        .is("archived_at", null)
        .not("status", "in", '("paused","closed")')
        .order("due_on", { ascending: true, nullsFirst: false }),
      supabase.from("app_clients").select("id, name").is("archived_at", null),
      supabase
        .from("app_profiles")
        .select("id, full_name")
        .eq("is_active", true)
        .is("archived_at", null),
      supabase
        .from("app_milestone_weeks")
        .select("id, project_id, due_on")
        .is("archived_at", null)
        .lt("due_on", now.toISOString().slice(0, 10)),
    ]);

  const rawProjects = (projectsResult.data ?? []) as RawProject[];
  const clientNames = new Map(
    (clientsResult.data ?? []).map((client) => [
      String(client.id),
      String(client.name),
    ]),
  );
  const profileNames = new Map(
    (profilesResult.data ?? []).map((profile) => [
      String(profile.id),
      String(profile.full_name),
    ]),
  );

  const weekIds = (weeksResult.data ?? []).map((week) => String(week.id));
  let overdueMilestones = 0;
  let itemRows: Array<{ milestone_week_id: string; is_done: boolean }> = [];

  if (weekIds.length) {
    const { data } = await supabase
      .from("app_milestone_items")
      .select("milestone_week_id, is_done")
      .in("milestone_week_id", weekIds)
      .is("archived_at", null)
      .eq("is_done", false);
    itemRows = (data ?? []) as typeof itemRows;
    overdueMilestones = itemRows.length;
  }

  const openByProject = new Map<string, number>();
  const totalByProject = new Map<string, number>();
  const projectIds = rawProjects.map((project) => project.id);

  if (projectIds.length) {
    const { data: allWeeks } = await supabase
      .from("app_milestone_weeks")
      .select("id, project_id")
      .in("project_id", projectIds)
      .is("archived_at", null);
    const weekProject = new Map(
      (allWeeks ?? []).map((week) => [
        String(week.id),
        String(week.project_id),
      ]),
    );
    const allWeekIds = [...weekProject.keys()];

    if (allWeekIds.length) {
      const { data: allItems } = await supabase
        .from("app_milestone_items")
        .select("milestone_week_id, is_done")
        .in("milestone_week_id", allWeekIds)
        .is("archived_at", null);

      for (const item of allItems ?? []) {
        const projectId = weekProject.get(String(item.milestone_week_id));
        if (!projectId) continue;
        totalByProject.set(projectId, (totalByProject.get(projectId) ?? 0) + 1);
        if (!item.is_done) {
          openByProject.set(projectId, (openByProject.get(projectId) ?? 0) + 1);
        }
      }
    }
  }

  const projects = rawProjects.map((project) => {
    const total = totalByProject.get(project.id) ?? 0;
    const open = openByProject.get(project.id) ?? 0;
    return {
      id: project.id,
      publicId: project.public_id,
      name: project.name,
      client: clientNames.get(project.client_id) ?? "Client",
      status: project.status,
      dueOn: project.due_on,
      lead: project.lead_id
        ? (profileNames.get(project.lead_id) ?? "Unassigned")
        : "Unassigned",
      progress: total ? Math.round(((total - open) / total) * 100) : 0,
    };
  });

  let financials: DashboardData["financials"] = null;

  if (viewer.role === "owner" || viewer.role === "finance") {
    const { data } = await supabase
      .from("app_invoices")
      .select("amount, currency, exchange_rate_to_pkr, status, paid_at")
      .is("archived_at", null)
      .neq("status", "void");
    const invoices = (data ?? []) as RawInvoice[];

    const totals = invoices.reduce(
      (result, invoice) => {
        const pkr =
          invoice.currency === "PKR"
            ? Number(invoice.amount)
            : Number(invoice.amount) * Number(invoice.exchange_rate_to_pkr);
        const usd =
          invoice.currency === "USD"
            ? Number(invoice.amount)
            : Number(invoice.amount) / Number(invoice.exchange_rate_to_pkr);
        const paidThisMonth =
          invoice.status === "paid" &&
          invoice.paid_at &&
          invoice.paid_at >= monthStart;
        const unpaid =
          invoice.status === "sent" || invoice.status === "overdue";

        if (paidThisMonth) {
          result.revenuePkr += pkr;
          result.revenueUsd += usd;
        }
        if (unpaid) {
          result.unpaidPkr += pkr;
          result.unpaidUsd += usd;
          result.unpaidCount += 1;
        }
        return result;
      },
      {
        revenuePkr: 0,
        revenueUsd: 0,
        unpaidPkr: 0,
        unpaidUsd: 0,
        unpaidCount: 0,
      },
    );
    financials = totals;
  }

  return {
    projects,
    activeCount: projects.length,
    dueSoonCount: projects.filter((project) => {
      if (!project.dueOn) return false;
      const date = new Date(`${project.dueOn}T00:00:00`);
      return date >= now && date <= soon;
    }).length,
    overdueMilestones,
    financials,
  };
}
