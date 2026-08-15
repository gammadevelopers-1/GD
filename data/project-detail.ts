import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Viewer } from "@/data/auth";
import type { ProjectStatus } from "@/lib/projects/status";

export type MilestoneItem = {
  id: string;
  label: string;
  assigneeId: string | null;
  assignee: string | null;
  done: boolean;
};

export type MilestoneWeek = {
  id: string;
  number: number;
  startsOn: string | null;
  dueOn: string;
  items: MilestoneItem[];
  done: number;
  total: number;
  isCurrent: boolean;
  isOverdue: boolean;
};

export type ProjectMember = {
  id: string;
  name: string;
  responsibility: string;
  isLead: boolean;
};

export type ProjectDetail = {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  startsOn: string | null;
  dueOn: string | null;
  isArchived: boolean;
  clientId: string;
  clientName: string;
  leadId: string | null;
  leadName: string | null;
  members: ProjectMember[];
  weeks: MilestoneWeek[];
  totalItems: number;
  doneItems: number;
  overdueItems: number;
  progress: number;
  currentWeek: MilestoneWeek | null;
  technical: {
    repositoryUrl: string | null;
    hostingUrl: string | null;
    liveDomain: string | null;
    stagingDomain: string | null;
    designUrl: string | null;
    technicalContact: string | null;
    stackNotes: string | null;
    onboardingNotes: string | null;
  } | null;
};

/** Owner-only. Read separately from the project so members have no code path to it. */
export type ProjectFinancial = {
  amount: number;
  currency: "PKR" | "USD";
  rate: number;
  bookedOn: string;
  amountPkr: number;
  amountUsd: number;
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * The week containing today. If planning has not reached today, the next week
 * due; if every week is in the past, the last one — so a project always has a
 * "where we are" answer.
 */
function pickCurrentWeek(weeks: MilestoneWeek[]) {
  const now = today();
  const containing = weeks.find(
    (week) => (week.startsOn ?? week.dueOn) <= now && week.dueOn >= now,
  );
  if (containing) return containing;

  const upcoming = weeks.find((week) => week.dueOn >= now);
  if (upcoming) return upcoming;

  return weeks.length ? weeks[weeks.length - 1] : null;
}

export async function getProjectDetail(
  projectId: string,
  viewer: Viewer,
): Promise<ProjectDetail | null> {
  if (viewer.role !== "owner" && viewer.role !== "member") return null;

  const supabase = await createClient();

  // No archived filter: an owner must be able to open an archived project to
  // restore it. Row-level security still keeps archived projects away from
  // members, so this cannot widen anyone else's access.
  const { data: project } = await supabase
    .from("app_projects")
    .select(
      "id, name, description, status, starts_on, due_on, archived_at, client_id, lead_id",
    )
    .eq("id", projectId)
    .maybeSingle();

  if (!project) return null;

  const [clientResult, membersResult, weeksResult, technicalResult] =
    await Promise.all([
      supabase
        .from("app_clients")
        .select("id, name")
        .eq("id", project.client_id)
        .maybeSingle(),
      supabase
        .from("app_project_members")
        .select("profile_id, responsibility")
        .eq("project_id", projectId)
        .is("archived_at", null),
      supabase
        .from("app_milestone_weeks")
        .select("id, week_number, starts_on, due_on")
        .eq("project_id", projectId)
        .is("archived_at", null)
        .order("week_number"),
      supabase
        .from("app_project_technical_details")
        .select(
          "repository_url, hosting_url, live_domain, staging_domain, design_url, technical_contact, stack_notes, onboarding_notes",
        )
        .eq("project_id", projectId)
        .maybeSingle(),
    ]);

  const profileIds = new Set(
    (membersResult.data ?? []).map((row) => String(row.profile_id)),
  );
  if (project.lead_id) profileIds.add(String(project.lead_id));

  let names = new Map<string, string>();
  if (profileIds.size) {
    const { data } = await supabase
      .from("app_profiles")
      .select("id, full_name")
      .in("id", [...profileIds]);
    names = new Map(
      (data ?? []).map((row) => [String(row.id), String(row.full_name)]),
    );
  }

  const weekIds = (weeksResult.data ?? []).map((week) => String(week.id));
  let itemRows: Array<{
    id: string;
    milestone_week_id: string;
    label: string;
    assigned_to: string | null;
    is_done: boolean;
  }> = [];

  if (weekIds.length) {
    const { data } = await supabase
      .from("app_milestone_items")
      .select("id, milestone_week_id, label, assigned_to, is_done")
      .in("milestone_week_id", weekIds)
      .is("archived_at", null)
      .order("created_at");
    itemRows = (data ?? []) as typeof itemRows;
  }

  const assigneeIds = itemRows
    .map((item) => item.assigned_to)
    .filter((id): id is string => Boolean(id) && !names.has(String(id)));

  if (assigneeIds.length) {
    const { data } = await supabase
      .from("app_profiles")
      .select("id, full_name")
      .in("id", [...new Set(assigneeIds)]);
    for (const row of data ?? []) {
      names.set(String(row.id), String(row.full_name));
    }
  }

  const now = today();
  const weeks: MilestoneWeek[] = (weeksResult.data ?? []).map((week) => {
    const items = itemRows
      .filter((item) => String(item.milestone_week_id) === String(week.id))
      .map((item) => ({
        id: String(item.id),
        label: String(item.label),
        assigneeId: item.assigned_to ? String(item.assigned_to) : null,
        assignee: item.assigned_to
          ? (names.get(String(item.assigned_to)) ?? "Team member")
          : null,
        done: Boolean(item.is_done),
      }));
    const done = items.filter((item) => item.done).length;
    const dueOn = String(week.due_on);

    return {
      id: String(week.id),
      number: Number(week.week_number),
      startsOn: week.starts_on ? String(week.starts_on) : null,
      dueOn,
      items,
      done,
      total: items.length,
      isCurrent: false,
      isOverdue: dueOn < now && done < items.length,
    };
  });

  const currentWeek = pickCurrentWeek(weeks);
  if (currentWeek) currentWeek.isCurrent = true;

  const totalItems = weeks.reduce((sum, week) => sum + week.total, 0);
  const doneItems = weeks.reduce((sum, week) => sum + week.done, 0);
  const overdueItems = weeks.reduce(
    (sum, week) => sum + (week.dueOn < now ? week.total - week.done : 0),
    0,
  );

  const members: ProjectMember[] = (membersResult.data ?? []).map((member) => ({
    id: String(member.profile_id),
    name: names.get(String(member.profile_id)) ?? "Team member",
    responsibility: member.responsibility
      ? String(member.responsibility)
      : "Contributor",
    isLead: String(member.profile_id) === String(project.lead_id),
  }));
  members.sort((a, b) => Number(b.isLead) - Number(a.isLead));

  return {
    id: String(project.id),
    name: String(project.name),
    description: project.description ? String(project.description) : null,
    status: project.status as ProjectStatus,
    startsOn: project.starts_on ? String(project.starts_on) : null,
    dueOn: project.due_on ? String(project.due_on) : null,
    isArchived: Boolean(project.archived_at),
    clientId: String(project.client_id),
    clientName: clientResult.data?.name
      ? String(clientResult.data.name)
      : "Client",
    leadId: project.lead_id ? String(project.lead_id) : null,
    leadName: project.lead_id
      ? (names.get(String(project.lead_id)) ?? "Unassigned")
      : null,
    members,
    weeks,
    totalItems,
    doneItems,
    overdueItems,
    progress: totalItems ? Math.round((doneItems / totalItems) * 100) : 0,
    currentWeek,
    technical: technicalResult.data
      ? {
          repositoryUrl: technicalResult.data.repository_url,
          hostingUrl: technicalResult.data.hosting_url,
          liveDomain: technicalResult.data.live_domain,
          stagingDomain: technicalResult.data.staging_domain,
          designUrl: technicalResult.data.design_url,
          technicalContact: technicalResult.data.technical_contact,
          stackNotes: technicalResult.data.stack_notes,
          onboardingNotes: technicalResult.data.onboarding_notes,
        }
      : null,
  };
}

export async function getProjectFinancial(
  projectId: string,
  viewer: Viewer,
): Promise<ProjectFinancial | null> {
  if (viewer.role !== "owner") return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("app_project_financials")
    .select("value_amount, value_currency, exchange_rate_to_pkr, booked_on")
    .eq("project_id", projectId)
    .maybeSingle();

  if (!data) return null;

  const amount = Number(data.value_amount);
  const currency = data.value_currency as "PKR" | "USD";
  const rate = Number(data.exchange_rate_to_pkr);

  // The rate is PKR per one USD on the booking date. Converting at display
  // time keeps the recorded figure true no matter what the rate does later.
  return {
    amount,
    currency,
    rate,
    bookedOn: String(data.booked_on),
    amountPkr: currency === "PKR" ? amount : amount * rate,
    amountUsd: currency === "USD" ? amount : amount / rate,
  };
}

export async function getProjectFormOptions() {
  const supabase = await createClient();
  const [clientsResult, peopleResult] = await Promise.all([
    supabase
      .from("app_clients")
      .select("id, name")
      .is("archived_at", null)
      .order("name"),
    supabase
      .from("app_profiles")
      .select("id, full_name")
      .eq("is_active", true)
      .is("archived_at", null)
      .order("full_name"),
  ]);

  return {
    clients: (clientsResult.data ?? []).map((row) => ({
      id: String(row.id),
      name: String(row.name),
    })),
    people: (peopleResult.data ?? []).map((row) => ({
      id: String(row.id),
      name: String(row.full_name),
    })),
  };
}
