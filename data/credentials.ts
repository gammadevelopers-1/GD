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
  // 'owner' and 'edit' can replace the value, 'view' can only copy it, and
  // null means the person knows it exists and nothing more.
  myAccess: "owner" | CredentialAccess | null;
  grants: CredentialGrant[];
};

export type CredentialAuditEntry = {
  id: number;
  credentialId: string | null;
  credentialName: string;
  action: string;
  actor: string;
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
      "id, name, service, environment, description, archived_at, created_by, updated_at",
    )
    .eq("project_id", projectId)
    .order("environment", { ascending: true })
    .order("name", { ascending: true });

  if (error || !rows?.length) return [];

  const ids = rows.map((row) => String(row.id));

  // Row-level security decides what comes back here: every grant for an owner,
  // only their own for anybody else.
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

  const names = await resolveNames(supabase, [...profileIds]);

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
      myAccess: isOwner ? "owner" : (myAccessById.get(id) ?? null),
      grants: (grantsByCredential.get(id) ?? []).sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
    };
  });
}

// Owner-only by policy on app_audit_logs — this returns nothing for anyone
// else, which is the intended answer rather than an error.
export async function getCredentialAudit(
  credentials: ProjectCredential[],
  viewer: Viewer,
  limit = 40,
): Promise<CredentialAuditEntry[]> {
  if (viewer.role !== "owner" || !credentials.length) return [];

  const supabase = await createClient();
  const nameById = new Map(
    credentials.map((credential) => [credential.id, credential.name]),
  );

  const { data, error } = await supabase
    .from("app_audit_logs")
    .select("id, actor_id, action, resource_id, metadata, occurred_at")
    .eq("resource_type", "credential")
    .in("resource_id", [...nameById.keys()])
    .order("occurred_at", { ascending: false })
    .limit(limit);

  if (error || !data?.length) return [];

  const actorIds = new Set<string>();
  const subjectIds = new Set<string>();
  for (const row of data) {
    if (row.actor_id) actorIds.add(String(row.actor_id));
    const profileId = (row.metadata as Record<string, unknown> | null)?.profile_id;
    if (typeof profileId === "string") subjectIds.add(profileId);
  }

  const names = await resolveNames(supabase, [...actorIds, ...subjectIds]);

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
      actor: row.actor_id
        ? (names.get(String(row.actor_id)) ?? "Unknown")
        : "System",
      occurredAt: String(row.occurred_at),
      detail: parts.length ? parts.join(" · ") : null,
    };
  });
}

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

async function resolveNames(supabase: SupabaseClient, ids: string[]) {
  const unique = [...new Set(ids)].filter(Boolean);
  const names = new Map<string, string>();
  if (!unique.length) return names;

  const { data } = await supabase
    .from("app_profiles")
    .select("id, full_name")
    .in("id", unique);

  for (const profile of data ?? []) {
    names.set(String(profile.id), String(profile.full_name));
  }
  return names;
}
