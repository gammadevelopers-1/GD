import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Viewer } from "@/data/auth";
import type { ProjectStatus } from "@/lib/projects/status";
import { type Board, type CardStatus, workRank } from "@/lib/projects/board";
import { type Block, parseBlocks } from "@/lib/projects/blocks";

// A card on one of the week's two boards. No assignee by design: the board
// records what was done, not who did it.
export type MilestoneCard = {
  id: string;
  title: string;
  board: Board;
  status: CardStatus;
  blocks: Block[];
  position: number;
  // Kept even after a card is unblocked or finished, so the history of what
  // got in the way survives.
  blockerReason: string | null;
  carryReason: string | null;
  carriedFromWeek: number | null;
  completedAt: string | null;
  isArchived: boolean;
};

export type MilestoneWeek = {
  id: string;
  number: number;
  startsOn: string | null;
  dueOn: string;
  ideaCards: MilestoneCard[];
  workCards: MilestoneCard[];
  archivedCards: MilestoneCard[];
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
  // Short random identifier that stands in for the uuid in URLs.
  publicId: string;
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

// Content is validated before it is written. On the way out a row that somehow
// fails to parse should cost that card its blocks, not take the page down.
function safeBlocks(raw: unknown): Block[] {
  try {
    return parseBlocks(raw);
  } catch {
    return [];
  }
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
  publicId: string,
  viewer: Viewer,
): Promise<ProjectDetail | null> {
  if (viewer.role !== "owner" && viewer.role !== "member") return null;

  const supabase = await createClient();

  const { data: project } = await supabase
    .from("app_projects")
    .select(
      "id, public_id, name, description, status, starts_on, due_on, archived_at, client_id, lead_id",
    )
    .eq("public_id", publicId)
    .maybeSingle();

  if (!project) return null;

  const projectId = String(project.id);
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
  const weekNumbers = new Map(
    (weeksResult.data ?? []).map((week) => [
      String(week.id),
      Number(week.week_number),
    ]),
  );

  let cardRows: Array<{
    id: string;
    milestone_week_id: string;
    board: string;
    status: string;
    title: string;
    blocks: unknown;
    position: number;
    blocker_reason: string | null;
    carry_reason: string | null;
    carried_from_week_id: string | null;
    completed_at: string | null;
    archived_at: string | null;
  }> = [];

  if (weekIds.length) {
    const cardsQuery = supabase
      .from("app_milestone_cards")
      .select(
        "id, milestone_week_id, board, status, title, blocks, position, blocker_reason, carry_reason, carried_from_week_id, completed_at, archived_at",
      )
      .in("milestone_week_id", weekIds)
      .order("position");
    const { data } = await (isOwner
      ? cardsQuery
      : cardsQuery.is("archived_at", null));
    cardRows = (data ?? []) as typeof cardRows;
  }

  const now = today();
  const toCard = (card: (typeof cardRows)[number]): MilestoneCard => ({
    id: String(card.id),
    title: String(card.title),
    board: card.board as Board,
    status: card.status as CardStatus,
    // Content is validated on the way in; a bad row should not take the page
    // down, so a card that cannot be read renders with no blocks.
    blocks: safeBlocks(card.blocks),
    position: Number(card.position ?? 0),
    blockerReason: card.blocker_reason ? String(card.blocker_reason) : null,
    carryReason: card.carry_reason ? String(card.carry_reason) : null,
    carriedFromWeek: card.carried_from_week_id
      ? (weekNumbers.get(String(card.carried_from_week_id)) ?? null)
      : null,
    completedAt: card.completed_at ? String(card.completed_at) : null,
    isArchived: Boolean(card.archived_at),
  });

  const allWeeks: MilestoneWeek[] = (weeksResult.data ?? []).map((week) => {
    const rows = cardRows.filter(
      (card) => String(card.milestone_week_id) === String(week.id),
    );
    const live = rows.filter((card) => !card.archived_at).map(toCard);
    const ideaCards = live
      .filter((card) => card.board === "idea")
      .sort((a, b) => a.position - b.position);
    // Reads as the story of the week: moving, stuck, landed, and — last —
    // what did not get done.
    const workCards = live
      .filter((card) => card.board === "work")
      .sort(
        (a, b) =>
          workRank(a.status) - workRank(b.status) || a.position - b.position,
      );
    const done = workCards.filter((card) => card.status === "completed").length;
    const total = live.length;
    const dueOn = String(week.due_on);

    return {
      id: String(week.id),
      number: Number(week.week_number),
      startsOn: week.starts_on ? String(week.starts_on) : null,
      dueOn,
      ideaCards,
      workCards,
      archivedCards: rows.filter((card) => card.archived_at).map(toCard),
      done,
      total,
      isCurrent: false,
      isOverdue: dueOn < now && done < total,
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
    id: projectId,
    publicId: String(project.public_id),
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
