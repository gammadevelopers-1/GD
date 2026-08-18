import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Viewer } from "@/data/auth";
import type { ProjectStatus } from "@/lib/projects/status";
import { type Board, type CardStatus, workRank } from "@/lib/projects/board";
import { type Block, parseBlocks } from "@/lib/projects/blocks";
import type { BannerFit } from "@/lib/projects/banner";

export type MilestoneCard = {
  id: string;
  title: string;
  board: Board;
  status: CardStatus;
  blocks: Block[];
  position: number;
  blockerReason: string | null;
  carryReason: string | null;
  carriedFromWeek: number | null;
  completedAt: string | null;
  isArchived: boolean;
  createdBy: string | null;
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
  addedBy: string | null;
};

export type FormerProjectMember = ProjectMember & {
  removedAt: string;
  removedBy: string | null;
};

export type ProjectDetail = {
  id: string;
  publicId: string;
  bannerUrl: string | null;
  bannerFit: BannerFit;
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

function safeBlocks(raw: unknown): Block[] {
  try {
    return parseBlocks(raw);
  } catch {
    return [];
  }
}

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

type NameRef = { full_name: string } | null;

type CardRow = {
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
  created_by: string | null;
  createdBy: NameRef;
};

type ProjectRow = {
  id: string;
  public_id: string;
  banner_path: string | null;
  banner_fit: BannerFit | null;
  name: string;
  description: string | null;
  status: string;
  starts_on: string | null;
  due_on: string | null;
  archived_at: string | null;
  client_id: string | null;
  lead_id: string | null;
  client: { name: string } | null;
  lead: NameRef;
  members: Array<{
    profile_id: string;
    responsibility: string | null;
    archived_at: string | null;
    added_by: string | null;
    archived_by: string | null;
    profile: NameRef;
    addedBy: NameRef;
    archivedBy: NameRef;
  }>;
  weeks: Array<{
    id: string;
    week_number: number;
    starts_on: string | null;
    due_on: string;
    archived_at: string | null;
    cards: CardRow[];
  }>;
  technical: {
    repository_url: string | null;
    hosting_url: string | null;
    live_domain: string | null;
    staging_domain: string | null;
    design_url: string | null;
    technical_contact: string | null;
    stack_notes: string | null;
    onboarding_notes: string | null;
    updated_by: string | null;
    updated_at: string | null;
    updatedBy: NameRef;
  } | null;
};

export async function getProjectDetail(
  publicId: string,
  viewer: Viewer,
): Promise<ProjectDetail | null> {
  if (viewer.role !== "owner" && viewer.role !== "member") return null;

  const supabase = await createClient();
  const isOwner = viewer.role === "owner";

  let query = supabase
    .from("app_projects")
    .select(
      `id, public_id, banner_path, banner_fit, name, description, status, starts_on, due_on, archived_at, client_id, lead_id,
       client:app_clients(name),
       lead:app_profiles!app_projects_lead_id_fkey(full_name),
       members:app_project_members(
         profile_id, responsibility, archived_at, added_by, archived_by,
         profile:app_profiles!app_project_members_profile_id_fkey(full_name),
         addedBy:app_profiles!app_project_members_added_by_fkey(full_name),
         archivedBy:app_profiles!app_project_members_archived_by_fkey(full_name)
       ),
       weeks:app_milestone_weeks(
         id, week_number, starts_on, due_on, archived_at,
         cards:app_milestone_cards!app_milestone_cards_milestone_week_id_fkey(
           id, milestone_week_id, board, status, title, blocks, position,
           blocker_reason, carry_reason, carried_from_week_id, completed_at, archived_at,
           createdBy:app_profiles!app_milestone_cards_created_by_fkey(full_name)
         )
       ),
       technical:app_project_technical_details(
         repository_url, hosting_url, live_domain, staging_domain, design_url,
         technical_contact, stack_notes, onboarding_notes, updated_by, updated_at,
         updatedBy:app_profiles!app_project_technical_details_updated_by_fkey(full_name)
       )`,
    )
    .eq("public_id", publicId);

  if (!isOwner) {
    query = query
      .is("members.archived_at", null)
      .is("weeks.archived_at", null)
      .is("weeks.cards.archived_at", null);
  }

  const { data } = await query
    .order("week_number", { referencedTable: "weeks" })
    .maybeSingle();

  if (!data) return null;

  const project = data as unknown as ProjectRow;
  const projectId = String(project.id);

  let bannerUrl: string | null = null;
  if (project.banner_path) {
    const { data: signed } = await supabase.storage
      .from("app-project-attachments")
      .createSignedUrl(String(project.banner_path), 60 * 60);
    bannerUrl = signed?.signedUrl ?? null;
  }

  const names = new Map<string, string>();
  const remember = (id: string | null, ref: NameRef) => {
    if (id && ref?.full_name) names.set(String(id), String(ref.full_name));
  };
  for (const member of project.members) {
    remember(member.profile_id, member.profile);
    remember(member.added_by, member.addedBy);
    remember(member.archived_by, member.archivedBy);
  }
  remember(project.lead_id, project.lead);
  remember(
    project.technical?.updated_by ?? null,
    project.technical?.updatedBy ?? null,
  );

  const weekNumbers = new Map(
    project.weeks.map((week) => [String(week.id), Number(week.week_number)]),
  );

  const now = today();
  const toCard = (card: CardRow): MilestoneCard => ({
    id: String(card.id),
    title: String(card.title),
    board: card.board as Board,
    status: card.status as CardStatus,
    blocks: safeBlocks(card.blocks),
    position: Number(card.position ?? 0),
    blockerReason: card.blocker_reason ? String(card.blocker_reason) : null,
    carryReason: card.carry_reason ? String(card.carry_reason) : null,
    carriedFromWeek: card.carried_from_week_id
      ? (weekNumbers.get(String(card.carried_from_week_id)) ?? null)
      : null,
    completedAt: card.completed_at ? String(card.completed_at) : null,
    isArchived: Boolean(card.archived_at),
    createdBy: card.createdBy?.full_name
      ? String(card.createdBy.full_name)
      : null,
  });

  const allWeeks: MilestoneWeek[] = project.weeks.map((week) => {
    const rows = [...week.cards].sort(
      (a, b) => Number(a.position ?? 0) - Number(b.position ?? 0),
    );
    const live = rows.filter((card) => !card.archived_at).map(toCard);
    const ideaCards = live
      .filter((card) => card.board === "idea")
      .sort((a, b) => a.position - b.position);
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

  const memberRows = project.members;
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
    bannerUrl,
    bannerFit: project.banner_fit ?? "cover",
    name: String(project.name),
    description: project.description ? String(project.description) : null,
    status: project.status as ProjectStatus,
    startsOn: project.starts_on ? String(project.starts_on) : null,
    dueOn: project.due_on ? String(project.due_on) : null,
    isArchived: Boolean(project.archived_at),
    clientId: project.client_id ? String(project.client_id) : null,
    clientName: project.client?.name ? String(project.client.name) : null,
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
    technical: project.technical
      ? {
          repositoryUrl: project.technical.repository_url,
          hostingUrl: project.technical.hosting_url,
          liveDomain: project.technical.live_domain,
          stagingDomain: project.technical.staging_domain,
          designUrl: project.technical.design_url,
          technicalContact: project.technical.technical_contact,
          stackNotes: project.technical.stack_notes,
          onboardingNotes: project.technical.onboarding_notes,
          updatedBy: project.technical.updated_by
            ? (names.get(String(project.technical.updated_by)) ?? null)
            : null,
          updatedAt: project.technical.updated_at
            ? String(project.technical.updated_at)
            : null,
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

  return {
    amount,
    currency,
    rate,
    bookedOn: String(data.booked_on),
    amountPkr: currency === "PKR" ? amount : amount * rate,
    amountUsd: currency === "USD" ? amount : amount / rate,
  };
}

export async function getActivePeople() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("app_profiles")
    .select("id, full_name")
    .eq("is_active", true)
    .is("archived_at", null)
    .order("full_name");

  return (data ?? []).map((row) => ({
    id: String(row.id),
    name: String(row.full_name),
  }));
}

export async function getProjectFormOptions() {
  const supabase = await createClient();
  const [clientsResult, people] = await Promise.all([
    supabase
      .from("app_clients")
      .select("id, name")
      .is("archived_at", null)
      .order("name"),
    getActivePeople(),
  ]);

  return {
    clients: (clientsResult.data ?? []).map((row) => ({
      id: String(row.id),
      name: String(row.name),
    })),
    people,
  };
}
