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
