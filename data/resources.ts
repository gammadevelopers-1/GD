import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Viewer } from "@/data/auth";
import type { ProjectStatus } from "@/data/dashboard";

export async function getProjects() {
  const supabase = await createClient();
  const [projectsResult, clientsResult, profilesResult] = await Promise.all([
    supabase
      .from("app_projects")
      .select("id, name, status, starts_on, due_on, client_id, lead_id")
      .order("created_at", { ascending: false }),
    supabase.from("app_clients").select("id, name"),
    supabase.from("app_profiles").select("id, full_name"),
  ]);
  const clients = new Map(
    (clientsResult.data ?? []).map((row) => [String(row.id), String(row.name)]),
  );
  const people = new Map(
    (profilesResult.data ?? []).map((row) => [
      String(row.id),
      String(row.full_name),
    ]),
  );

  return (projectsResult.data ?? []).map((row) => ({
    id: String(row.id),
    name: String(row.name),
    status: row.status as ProjectStatus,
    startsOn: row.starts_on ? String(row.starts_on) : null,
    dueOn: row.due_on ? String(row.due_on) : null,
    client: clients.get(String(row.client_id)) ?? "Client",
    lead: row.lead_id
      ? (people.get(String(row.lead_id)) ?? "Unassigned")
      : "Unassigned",
  }));
}

export async function getPeople(viewer: Viewer) {
  const supabase = await createClient();
  let query = supabase
    .from("app_profiles")
    .select("id, full_name, role, is_active, created_at")
    .order("full_name");

  if (viewer.role !== "owner") query = query.eq("id", viewer.id);
  const { data } = await query;
  return (data ?? []).map((row) => ({
    id: String(row.id),
    fullName: String(row.full_name),
    role: String(row.role),
    active: Boolean(row.is_active),
  }));
}

export async function getClients() {
  const supabase = await createClient();
  const [clientsResult, projectsResult, contactsResult] = await Promise.all([
    supabase.from("app_clients").select("id, name, website").order("name"),
    supabase.from("app_projects").select("id, client_id, status"),
    supabase
      .from("app_client_contacts")
      .select("client_id, full_name, email, is_primary"),
  ]);

  return (clientsResult.data ?? []).map((client) => {
    const projects = (projectsResult.data ?? []).filter(
      (project) => project.client_id === client.id,
    );
    const contacts = (contactsResult.data ?? []).filter(
      (contact) => contact.client_id === client.id,
    );
    const primary =
      contacts.find((contact) => contact.is_primary) ?? contacts[0];
    return {
      id: String(client.id),
      name: String(client.name),
      website: client.website ? String(client.website) : null,
      projectCount: projects.length,
      activeCount: projects.filter(
        (project) => !["paused", "closed"].includes(String(project.status)),
      ).length,
      contact: primary ? String(primary.full_name) : "No primary contact",
      email: primary?.email ? String(primary.email) : null,
    };
  });
}

export async function getCmsPages() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("cms_pages")
    .select("id, slug, title, status, updated_at")
    .order("updated_at", { ascending: false });
  return (data ?? []).map((row) => ({
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    status: String(row.status),
    updatedAt: String(row.updated_at),
  }));
}

export async function getProjectDetail(projectId: string, viewer: Viewer) {
  const supabase = await createClient();
  const { data: project } = await supabase
    .from("app_projects")
    .select(
      "id, name, description, status, starts_on, due_on, client_id, lead_id",
    )
    .eq("id", projectId)
    .single();

  if (!project) return null;

  const [clientResult, membersResult, weeksResult, technicalResult] =
    await Promise.all([
      supabase
        .from("app_clients")
        .select("id, name")
        .eq("id", project.client_id)
        .single(),
      supabase
        .from("app_project_members")
        .select("profile_id, responsibility")
        .eq("project_id", projectId),
      supabase
        .from("app_milestone_weeks")
        .select("id, week_number, starts_on, due_on")
        .eq("project_id", projectId)
        .order("week_number"),
      supabase
        .from("app_project_technical_details")
        .select(
          "repository_url, hosting_url, live_domain, staging_domain, design_url, technical_contact, stack_notes, onboarding_notes",
        )
        .eq("project_id", projectId)
        .maybeSingle(),
    ]);

  const memberIds = (membersResult.data ?? []).map((row) =>
    String(row.profile_id),
  );
  if (project.lead_id && !memberIds.includes(String(project.lead_id))) {
    memberIds.push(String(project.lead_id));
  }

  let profiles: Array<{ id: string; full_name: string }> = [];
  if (memberIds.length) {
    const { data } = await supabase
      .from("app_profiles")
      .select("id, full_name")
      .in("id", memberIds);
    profiles = (data ?? []) as typeof profiles;
  }
  const names = new Map(
    profiles.map((profile) => [String(profile.id), String(profile.full_name)]),
  );

  const weekIds = (weeksResult.data ?? []).map((week) => String(week.id));
  let items: Array<{
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
      .order("created_at");
    items = (data ?? []) as typeof items;
  }

  let financial: null | {
    amount: number;
    currency: "PKR" | "USD";
    rate: number;
  } = null;
  if (viewer.role === "owner") {
    const { data } = await supabase
      .from("app_project_financials")
      .select("value_amount, value_currency, exchange_rate_to_pkr")
      .eq("project_id", projectId)
      .maybeSingle();
    if (data) {
      financial = {
        amount: Number(data.value_amount),
        currency: data.value_currency as "PKR" | "USD",
        rate: Number(data.exchange_rate_to_pkr),
      };
    }
  }

  return {
    id: String(project.id),
    name: String(project.name),
    description: project.description ? String(project.description) : null,
    status: project.status as ProjectStatus,
    startsOn: project.starts_on ? String(project.starts_on) : null,
    dueOn: project.due_on ? String(project.due_on) : null,
    client: clientResult.data?.name ? String(clientResult.data.name) : "Client",
    lead: project.lead_id
      ? (names.get(String(project.lead_id)) ?? "Unassigned")
      : "Unassigned",
    members: (membersResult.data ?? []).map((member) => ({
      id: String(member.profile_id),
      name: names.get(String(member.profile_id)) ?? "Team member",
      responsibility: member.responsibility
        ? String(member.responsibility)
        : "Contributor",
    })),
    weeks: (weeksResult.data ?? []).map((week) => ({
      id: String(week.id),
      number: Number(week.week_number),
      startsOn: week.starts_on ? String(week.starts_on) : null,
      dueOn: String(week.due_on),
      items: items
        .filter((item) => item.milestone_week_id === week.id)
        .map((item) => ({
          id: String(item.id),
          label: String(item.label),
          assignee: item.assigned_to
            ? (names.get(String(item.assigned_to)) ?? "Team member")
            : null,
          done: Boolean(item.is_done),
        })),
    })),
    technical: technicalResult.data
      ? {
          repositoryUrl: technicalResult.data.repository_url as string | null,
          hostingUrl: technicalResult.data.hosting_url as string | null,
          liveDomain: technicalResult.data.live_domain as string | null,
          stagingDomain: technicalResult.data.staging_domain as string | null,
          designUrl: technicalResult.data.design_url as string | null,
          technicalContact: technicalResult.data.technical_contact as
            string | null,
          stackNotes: technicalResult.data.stack_notes as string | null,
          onboardingNotes: technicalResult.data.onboarding_notes as
            string | null,
        }
      : null,
    financial,
  };
}

export async function getProjectFormOptions() {
  const supabase = await createClient();
  const [clientsResult, peopleResult] = await Promise.all([
    supabase.from("app_clients").select("id, name").order("name"),
    supabase
      .from("app_profiles")
      .select("id, full_name")
      .eq("is_active", true)
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
