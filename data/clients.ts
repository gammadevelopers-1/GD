import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Viewer } from "@/data/auth";

export type ClientContact = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  jobTitle: string | null;
  isPrimary: boolean;
};

export type ClientAccountState = "active" | "invited" | "created" | "archived";

export type ClientAccount = {
  id: string;
  fullName: string;
  email: string;
  state: ClientAccountState;
  invitedAt: string | null;
  activatedAt: string | null;
  lastSignInAt: string | null;
  archivedAt: string | null;
  projects: Array<{ id: string; name: string; accessId: string }>;
  deleteBlocker: string | null;
};

export type ClientCompany = {
  id: string;
  name: string;
  website: string | null;
  notes: string | null;
  archivedAt: string | null;
  projectCount: number;
  activeCount: number;
  primaryContact: string | null;
  primaryEmail: string | null;
};

export type ClientRecord = ClientCompany & {
  contacts: ClientContact[];
  projects: Array<{ id: string; name: string; status: string }>;
  accounts: ClientAccount[];
};

const OPEN_STATUSES = ["discovery", "building", "review", "live", "retainer"];

export function clientAccountState(row: {
  archived_at: unknown;
  activated_at: unknown;
  invited_at: unknown;
}): ClientAccountState {
  if (row.archived_at) return "archived";
  if (row.activated_at) return "active";
  if (row.invited_at) return "invited";
  return "created";
}

export const getClientCompanies = cache(
  async (viewer: Viewer): Promise<ClientCompany[]> => {
    if (viewer.role !== "owner") return [];

    const supabase = await createClient();
    const [clientsResult, projectsResult, contactsResult] = await Promise.all([
      supabase
        .from("app_clients")
        .select("id, name, website, notes, archived_at")
        .order("name"),
      supabase
        .from("app_projects")
        .select("id, client_id, status")
        .is("archived_at", null),
      supabase
        .from("app_client_contacts")
        .select("client_id, full_name, email, is_primary")
        .is("archived_at", null),
    ]);

    return (clientsResult.data ?? []).map((client) => {
      const projects = (projectsResult.data ?? []).filter(
        (project) => String(project.client_id) === String(client.id),
      );
      const contacts = (contactsResult.data ?? []).filter(
        (contact) => String(contact.client_id) === String(client.id),
      );
      const primary =
        contacts.find((contact) => contact.is_primary) ?? contacts[0];

      return {
        id: String(client.id),
        name: String(client.name),
        website: client.website ? String(client.website) : null,
        notes: client.notes ? String(client.notes) : null,
        archivedAt: client.archived_at ? String(client.archived_at) : null,
        projectCount: projects.length,
        activeCount: projects.filter((project) =>
          OPEN_STATUSES.includes(String(project.status)),
        ).length,
        primaryContact: primary ? String(primary.full_name) : null,
        primaryEmail: primary?.email ? String(primary.email) : null,
      };
    });
  },
);

export const getClientRecord = cache(
  async (clientId: string, viewer: Viewer): Promise<ClientRecord | null> => {
    if (viewer.role !== "owner") return null;

    const supabase = await createClient();

    const { data: company } = await supabase
      .from("app_clients")
      .select("id, name, website, notes, archived_at")
      .eq("id", clientId)
      .maybeSingle();

    if (!company) return null;

    const [contactsResult, projectsResult] = await Promise.all([
      supabase
        .from("app_client_contacts")
        .select("id, full_name, email, phone, job_title, is_primary")
        .eq("client_id", clientId)
        .is("archived_at", null)
        .order("is_primary", { ascending: false })
        .order("full_name"),
      supabase
        .from("app_projects")
        .select("id, name, status")
        .eq("client_id", clientId)
        .is("archived_at", null)
        .order("name"),
    ]);

    const projects = projectsResult.data ?? [];
    const accounts = await accountsForProjects(
      projects.map((project) => String(project.id)),
    );

    const contacts = contactsResult.data ?? [];
    const primary =
      contacts.find((contact) => contact.is_primary) ?? contacts[0];

    return {
      id: String(company.id),
      name: String(company.name),
      website: company.website ? String(company.website) : null,
      notes: company.notes ? String(company.notes) : null,
      archivedAt: company.archived_at ? String(company.archived_at) : null,
      projectCount: projects.length,
      activeCount: projects.filter((project) =>
        OPEN_STATUSES.includes(String(project.status)),
      ).length,
      primaryContact: primary ? String(primary.full_name) : null,
      primaryEmail: primary?.email ? String(primary.email) : null,
      contacts: contacts.map((contact) => ({
        id: String(contact.id),
        fullName: String(contact.full_name),
        email: contact.email ? String(contact.email) : null,
        phone: contact.phone ? String(contact.phone) : null,
        jobTitle: contact.job_title ? String(contact.job_title) : null,
        isPrimary: Boolean(contact.is_primary),
      })),
      projects: projects.map((project) => ({
        id: String(project.id),
        name: String(project.name),
        status: String(project.status),
      })),
      accounts,
    };
  },
);

async function accountsForProjects(
  projectIds: string[],
): Promise<ClientAccount[]> {
  if (!projectIds.length) return [];

  const supabase = await createClient();

  const { data: grants } = await supabase
    .from("app_project_client_access")
    .select("id, project_id, client_user_id, app_projects(id, name)")
    .in("project_id", projectIds)
    .is("revoked_at", null);

  const rows = grants ?? [];
  if (!rows.length) return [];

  const accountIds = [
    ...new Set(rows.map((row) => String(row.client_user_id))),
  ];

  const { data: people } = await supabase
    .from("app_client_users")
    .select(
      "id, full_name, email, invited_at, activated_at, last_sign_in_at, archived_at",
    )
    .in("id", accountIds);

  const blockers = await Promise.all(
    accountIds.map(async (id) => {
      const { data, error } = await supabase.rpc(
        "app_client_account_deletable",
        { target: id },
      );
      return [
        id,
        data ? String(data) : error ? "that could not be checked" : null,
      ] as const;
    }),
  );
  const blockerById = new Map(blockers);

  return (people ?? [])
    .map((person) => {
      const mine = rows.filter(
        (row) => String(row.client_user_id) === String(person.id),
      );
      return {
        id: String(person.id),
        fullName: person.full_name
          ? String(person.full_name)
          : String(person.email),
        email: String(person.email),
        state: clientAccountState(person),
        invitedAt: person.invited_at ? String(person.invited_at) : null,
        activatedAt: person.activated_at ? String(person.activated_at) : null,
        lastSignInAt: person.last_sign_in_at
          ? String(person.last_sign_in_at)
          : null,
        archivedAt: person.archived_at ? String(person.archived_at) : null,
        deleteBlocker: blockerById.get(String(person.id)) ?? null,
        projects: mine.flatMap((row) => {
          const project = row.app_projects as unknown as {
            id: string;
            name: string;
          } | null;
          if (!project) return [];
          return [
            {
              id: String(project.id),
              name: String(project.name),
              accessId: String(row.id),
            },
          ];
        }),
      };
    })
    .sort((a, b) => a.fullName.localeCompare(b.fullName));
}

export type ProjectInviteContext = {
  suggestion: { fullName: string; email: string } | null;
  accounts: Array<{
    id: string;
    fullName: string;
    email: string;
    state: ClientAccountState;
  }>;
};

export const getProjectInviteContext = cache(
  async (projectId: string, viewer: Viewer): Promise<ProjectInviteContext> => {
    if (viewer.role !== "owner") return { suggestion: null, accounts: [] };

    const supabase = await createClient();

    const { data: project } = await supabase
      .from("app_projects")
      .select("id, client_id")
      .eq("id", projectId)
      .maybeSingle();

    const { data: grants } = await supabase
      .from("app_project_client_access")
      .select("client_user_id")
      .eq("project_id", projectId)
      .is("revoked_at", null);

    const grantedIds = (grants ?? []).map((row) => String(row.client_user_id));

    const { data: people } = grantedIds.length
      ? await supabase
          .from("app_client_users")
          .select("id, full_name, email, invited_at, activated_at, archived_at")
          .in("id", grantedIds)
      : { data: [] };

    let suggestion: ProjectInviteContext["suggestion"] = null;

    if (project?.client_id) {
      const { data: contacts } = await supabase
        .from("app_client_contacts")
        .select("full_name, email, is_primary")
        .eq("client_id", String(project.client_id))
        .is("archived_at", null)
        .not("email", "is", null)
        .order("is_primary", { ascending: false });

      const first = (contacts ?? [])[0];
      if (first?.email) {
        suggestion = {
          fullName: String(first.full_name),
          email: String(first.email),
        };
      }
    }

    return {
      suggestion,
      accounts: (people ?? []).map((person) => ({
        id: String(person.id),
        fullName: person.full_name
          ? String(person.full_name)
          : String(person.email),
        email: String(person.email),
        state: clientAccountState(person),
      })),
    };
  },
);
