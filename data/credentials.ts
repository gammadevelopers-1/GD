import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Viewer } from "@/data/auth";
import type {
  CredentialAccess,
  CredentialEnvironment,
} from "@/lib/credentials/validation";

export type CredentialGrant = {
  profileId: string;
  name: string;
  access: CredentialAccess;
  grantedAt: string;
  grantedBy: string | null;
};

export type ProjectCredential = {
  id: string;
  name: string;
  service: string | null;
  environment: CredentialEnvironment;
  description: string | null;
  isArchived: boolean;
  createdBy: string | null;
  updatedAt: string;
  envGroupId: string | null;
  myAccess: "owner" | CredentialAccess | null;
  grants: CredentialGrant[];
};

export type CredentialAuditEntry = {
  id: number;
  credentialId: string | null;
  credentialName: string;
  action: string;
  actorId: string | null;
  actor: string;
  actorEmail: string | null;
  actorRole: string | null;
  ip: string | null;
  occurredAt: string;
  detail: string | null;
};

export async function getProjectCredentials(
  projectId: string,
  viewer: Viewer,
): Promise<ProjectCredential[]> {
  const supabase = await createClient();
  const isOwner = viewer.role === "owner";

  const { data: rows, error } = await supabase
    .from("app_project_credentials")
    .select(
      "id, name, service, environment, description, archived_at, created_by, updated_at, env_group_id",
    )
    .eq("project_id", projectId)
    .order("environment", { ascending: true })
    .order("name", { ascending: true });

  if (error || !rows?.length) return [];

  const ids = rows.map((row) => String(row.id));

  const { data: grantRows } = await supabase
    .from("app_credential_grants")
    .select("credential_id, profile_id, access, granted_at, granted_by")
    .in("credential_id", ids)
    .is("revoked_at", null);

  const profileIds = new Set<string>();
  for (const row of rows) {
    if (row.created_by) profileIds.add(String(row.created_by));
  }
  for (const grant of grantRows ?? []) {
    profileIds.add(String(grant.profile_id));
    if (grant.granted_by) profileIds.add(String(grant.granted_by));
  }

  const names = new Map(
    [...(await resolvePeople(supabase, [...profileIds]))].map(
      ([id, person]) => [id, person.name] as const,
    ),
  );

  const grantsByCredential = new Map<string, CredentialGrant[]>();
  let myAccessById = new Map<string, CredentialAccess>();

  for (const grant of grantRows ?? []) {
    const credentialId = String(grant.credential_id);
    const profileId = String(grant.profile_id);

    if (profileId === viewer.id) {
      myAccessById.set(credentialId, grant.access as CredentialAccess);
    }
    if (!isOwner) continue;

    const list = grantsByCredential.get(credentialId) ?? [];
    list.push({
      profileId,
      name: names.get(profileId) ?? "Unknown",
      access: grant.access as CredentialAccess,
      grantedAt: String(grant.granted_at),
      grantedBy: grant.granted_by
        ? (names.get(String(grant.granted_by)) ?? null)
        : null,
    });
    grantsByCredential.set(credentialId, list);
  }

  if (isOwner) myAccessById = new Map();

  return rows.map((row) => {
    const id = String(row.id);
    return {
      id,
      name: String(row.name),
      service: row.service ? String(row.service) : null,
      environment: String(row.environment) as CredentialEnvironment,
      description: row.description ? String(row.description) : null,
      isArchived: Boolean(row.archived_at),
      createdBy: row.created_by
        ? (names.get(String(row.created_by)) ?? null)
        : null,
      updatedAt: String(row.updated_at),
      envGroupId: row.env_group_id ? String(row.env_group_id) : null,
      myAccess: isOwner ? "owner" : (myAccessById.get(id) ?? null),
      grants: (grantsByCredential.get(id) ?? []).sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
    };
  });
}

export async function getCredentialAudit(
  credentials: ProjectCredential[],
  viewer: Viewer,
  limit = 250,
): Promise<CredentialAuditEntry[]> {
  if (viewer.role !== "owner" || !credentials.length) return [];

  const supabase = await createClient();
  const nameById = new Map(
    credentials.map((credential) => [credential.id, credential.name]),
  );

  const { data, error } = await supabase
    .from("app_audit_logs")
    .select("id, actor_id, action, resource_id, metadata, occurred_at, ip")
    .eq("resource_type", "credential")
    .in("resource_id", [...nameById.keys()])
    .order("occurred_at", { ascending: false })
    .limit(limit);

  if (error || !data?.length) return [];

  const actorIds = new Set<string>();
  const subjectIds = new Set<string>();
  for (const row of data) {
    if (row.actor_id) actorIds.add(String(row.actor_id));
    const profileId = (row.metadata as Record<string, unknown> | null)
      ?.profile_id;
    if (typeof profileId === "string") subjectIds.add(profileId);
  }

  const people = await resolvePeople(supabase, [...actorIds, ...subjectIds]);
  const names = new Map(
    [...people].map(([id, person]) => [id, person.name] as const),
  );

  return data.map((row) => {
    const metadata = (row.metadata ?? {}) as Record<string, unknown>;
    const subject =
      typeof metadata.profile_id === "string"
        ? (names.get(metadata.profile_id) ?? "someone")
        : null;

    const parts: string[] = [];
    if (subject) parts.push(subject);
    if (typeof metadata.access === "string") parts.push(metadata.access);
    if (metadata.reason === "removed_from_project") {
      parts.push("removed from the project");
    }
    if (metadata.reason === "account_deactivated") {
      parts.push("account deactivated");
    }
    if (typeof metadata.operation === "string") {
      parts.push(`tried to ${metadata.operation}`);
    }

    return {
      id: Number(row.id),
      credentialId: row.resource_id ? String(row.resource_id) : null,
      credentialName: row.resource_id
        ? (nameById.get(String(row.resource_id)) ?? "Removed credential")
        : "Unknown",
      action: String(row.action),
      actorId: row.actor_id ? String(row.actor_id) : null,
      actor: row.actor_id
        ? (people.get(String(row.actor_id))?.name ?? "Unknown")
        : "System",
      actorEmail: row.actor_id
        ? (people.get(String(row.actor_id))?.email ?? null)
        : null,
      actorRole: row.actor_id
        ? (people.get(String(row.actor_id))?.role ?? null)
        : null,
      ip: row.ip ? String(row.ip) : null,
      occurredAt: String(row.occurred_at),
      detail: parts.length ? parts.join(" · ") : null,
    };
  });
}

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

type AuditPerson = { name: string; email: string | null; role: string | null };

async function resolvePeople(supabase: SupabaseClient, ids: string[]) {
  const unique = [...new Set(ids)].filter(Boolean);
  const people = new Map<string, AuditPerson>();
  if (!unique.length) return people;

  const { data } = await supabase
    .from("app_profiles")
    .select("id, full_name, email, role")
    .in("id", unique);

  for (const profile of data ?? []) {
    people.set(String(profile.id), {
      name: String(profile.full_name),
      email: profile.email ? String(profile.email) : null,
      role: profile.role ? String(profile.role) : null,
    });
  }
  return people;
}
