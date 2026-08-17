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
  isArchived: boolean;
  // Who ticked it and when. Cleared by the toggle when an item is reopened,
  // so these are always null for an item that is not done.
  completedAt: string | null;
  completedBy: string | null;
};

export type MilestoneWeek = {
  id: string;
  number: number;
  startsOn: string | null;
  dueOn: string;
  items: MilestoneItem[];
  archivedItems: MilestoneItem[];
  done: number;
  total: number;
  isCurrent: boolean;
  isOverdue: boolean;
  isArchived: boolean;
};

export type ProjectMember = {
  id: string;
  name: string;
  responsibility: string;
  isLead: boolean;
  // Assignment is what grants access, so who granted it is worth showing.
  addedBy: string | null;
};

export type FormerProjectMember = ProjectMember & {
  removedAt: string;
  removedBy: string | null;
};

export type ProjectDetail = {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  startsOn: string | null;
  dueOn: string | null;
  isArchived: boolean;
  clientId: string | null;
  clientName: string | null;
  leadId: string | null;
  leadName: string | null;
  members: ProjectMember[];
  formerMembers: FormerProjectMember[];
  weeks: MilestoneWeek[];
  archivedWeeks: MilestoneWeek[];
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
    updatedBy: string | null;
    updatedAt: string | null;
  } | null;
};

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

// The week we are in now. If planning has not reached today, the next one.
// If every week has passed, the last one, so there is always an answer.
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

  const { data: project } = await supabase
    .from("app_projects")
    .select(
      "id, name, description, status, starts_on, due_on, archived_at, client_id, lead_id",
    )
    .eq("id", projectId)
    .maybeSingle();

  if (!project) return null;

  const isOwner = viewer.role === "owner";

  const membersQuery = supabase
    .from("app_project_members")
    .select("profile_id, responsibility, archived_at, added_by, archived_by")
    .eq("project_id", projectId);
  const weeksQuery = supabase
    .from("app_milestone_weeks")
    .select("id, week_number, starts_on, due_on, archived_at")
    .eq("project_id", projectId)
    .order("week_number");

  const [clientResult, membersResult, weeksResult, technicalResult] =
    await Promise.all([
      // A project may not have a client yet, and there is nothing to look up
      // when it does not.
      project.client_id
        ? supabase
            .from("app_clients")
            .select("id, name")
            .eq("id", project.client_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      isOwner ? membersQuery : membersQuery.is("archived_at", null),
      isOwner ? weeksQuery : weeksQuery.is("archived_at", null),
      supabase
        .from("app_project_technical_details")
        .select(
          "repository_url, hosting_url, live_domain, staging_domain, design_url, technical_contact, stack_notes, onboarding_notes, updated_by, updated_at",
        )
        .eq("project_id", projectId)
        .maybeSingle(),
    ]);

  const profileIds = new Set(
    (membersResult.data ?? []).map((row) => String(row.profile_id)),
  );
  // Whoever added or removed each member needs a name too, and both are known
  // already, so they ride along in the same lookup instead of a second trip.
  for (const row of membersResult.data ?? []) {
    if (row.added_by) profileIds.add(String(row.added_by));
    if (row.archived_by) profileIds.add(String(row.archived_by));
  }
  if (project.lead_id) profileIds.add(String(project.lead_id));
  if (technicalResult.data?.updated_by) {
    profileIds.add(String(technicalResult.data.updated_by));
  }

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
    archived_at: string | null;
    completed_at: string | null;
    completed_by: string | null;
  }> = [];

  if (weekIds.length) {
    const itemsQuery = supabase
      .from("app_milestone_items")
      .select(
        "id, milestone_week_id, label, assigned_to, is_done, archived_at, completed_at, completed_by",
      )
      .in("milestone_week_id", weekIds)
      .order("created_at");
    const { data } = await (isOwner
      ? itemsQuery
      : itemsQuery.is("archived_at", null));
    itemRows = (data ?? []) as typeof itemRows;
  }

  // An item's assignee and whoever ticked it are both unknown until the items
  // come back, so they share this second lookup.
  const itemProfileIds = itemRows
    .flatMap((item) => [item.assigned_to, item.completed_by])
    .filter((id): id is string => Boolean(id) && !names.has(String(id)));

  if (itemProfileIds.length) {
    const { data } = await supabase
      .from("app_profiles")
      .select("id, full_name")
      .in("id", [...new Set(itemProfileIds)]);
    for (const row of data ?? []) {
      names.set(String(row.id), String(row.full_name));
    }
  }

  const now = today();
  const toItem = (item: (typeof itemRows)[number]): MilestoneItem => ({
    id: String(item.id),
    label: String(item.label),
    assigneeId: item.assigned_to ? String(item.assigned_to) : null,
    assignee: item.assigned_to
      ? (names.get(String(item.assigned_to)) ?? "Team member")
      : null,
    done: Boolean(item.is_done),
    isArchived: Boolean(item.archived_at),
    completedAt: item.completed_at ? String(item.completed_at) : null,
    completedBy: item.completed_by
      ? (names.get(String(item.completed_by)) ?? "Team member")
      : null,
  });

  const allWeeks: MilestoneWeek[] = (weeksResult.data ?? []).map((week) => {
    const rows = itemRows.filter(
      (item) => String(item.milestone_week_id) === String(week.id),
    );
    const items = rows.filter((item) => !item.archived_at).map(toItem);
    const done = items.filter((item) => item.done).length;
    const dueOn = String(week.due_on);

    return {
      id: String(week.id),
      number: Number(week.week_number),
      startsOn: week.starts_on ? String(week.starts_on) : null,
      dueOn,
      items,
      archivedItems: rows.filter((item) => item.archived_at).map(toItem),
      done,
      total: items.length,
      isCurrent: false,
      isOverdue: dueOn < now && done < items.length,
      isArchived: Boolean(week.archived_at),
    };
  });

  const weeks = allWeeks.filter((week) => !week.isArchived);
  const archivedWeeks = allWeeks.filter((week) => week.isArchived);

  const currentWeek = pickCurrentWeek(weeks);
  if (currentWeek) currentWeek.isCurrent = true;

  const totalItems = weeks.reduce((sum, week) => sum + week.total, 0);
  const doneItems = weeks.reduce((sum, week) => sum + week.done, 0);
  const overdueItems = weeks.reduce(
    (sum, week) => sum + (week.dueOn < now ? week.total - week.done : 0),
    0,
  );

  const memberRows = membersResult.data ?? [];
  const members: ProjectMember[] = memberRows
    .filter((member) => !member.archived_at)
    .map((member) => ({
      id: String(member.profile_id),
      name: names.get(String(member.profile_id)) ?? "Team member",
      responsibility: member.responsibility
        ? String(member.responsibility)
        : "Contributor",
      isLead: String(member.profile_id) === String(project.lead_id),
      addedBy: member.added_by
        ? (names.get(String(member.added_by)) ?? "An owner")
        : null,
    }));
  members.sort((a, b) => Number(b.isLead) - Number(a.isLead));

  const formerMembers: FormerProjectMember[] = memberRows
    .filter((member) => member.archived_at)
    .map((member) => ({
      id: String(member.profile_id),
      name: names.get(String(member.profile_id)) ?? "Team member",
      responsibility: member.responsibility
        ? String(member.responsibility)
        : "Contributor",
      isLead: false,
      addedBy: member.added_by
        ? (names.get(String(member.added_by)) ?? "An owner")
        : null,
      removedAt: String(member.archived_at),
      removedBy: member.archived_by
        ? (names.get(String(member.archived_by)) ?? "An owner")
        : null,
    }));

  return {
    id: String(project.id),
    name: String(project.name),
    description: project.description ? String(project.description) : null,
    status: project.status as ProjectStatus,
    startsOn: project.starts_on ? String(project.starts_on) : null,
    dueOn: project.due_on ? String(project.due_on) : null,
    isArchived: Boolean(project.archived_at),
    clientId: project.client_id ? String(project.client_id) : null,
    clientName: clientResult.data?.name
      ? String(clientResult.data.name)
      : null,
    leadId: project.lead_id ? String(project.lead_id) : null,
    leadName: project.lead_id
      ? (names.get(String(project.lead_id)) ?? "Unassigned")
      : null,
    members,
    formerMembers,
    weeks,
    archivedWeeks,
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
          updatedBy: technicalResult.data.updated_by
            ? (names.get(String(technicalResult.data.updated_by)) ?? null)
            : null,
          updatedAt: technicalResult.data.updated_at
            ? String(technicalResult.data.updated_at)
            : null,
        }
      : null,
  };
}

// Owner only
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
