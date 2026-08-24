import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Viewer } from "@/data/auth";
import { auditCategory, type AuditCategory } from "@/lib/projects/audit";

export type ProjectAuditEntry = {
  id: number;
  action: string;
  category: AuditCategory;
  target: string;
  actorId: string | null;
  actor: string;
  actorEmail: string | null;
  actorRole: string | null;
  ip: string | null;
  userAgent: string | null;
  occurredAt: string;
  version: string | null;
  group: string | null;
  detail: string | null;
};

type Row = {
  id: unknown;
  actor_id: unknown;
  action: unknown;
  resource_type: unknown;
  resource_id: unknown;
  metadata: unknown;
  occurred_at: unknown;
  ip: unknown;
  user_agent: unknown;
};

export async function getProjectAudit(
  projectId: string,
  viewer: Viewer,
  limit = 250,
): Promise<ProjectAuditEntry[]> {
  if (viewer.role !== "owner" && viewer.role !== "member") return [];

  const supabase = await createClient();

  const [credentials, links, groups] = await Promise.all([
    supabase
      .from("app_project_credentials")
      .select("id, name, env_group_id")
      .eq("project_id", projectId),
    supabase
      .from("app_project_links")
      .select("id, label")
      .eq("project_id", projectId),
    supabase
      .from("app_env_groups")
      .select("id, name, kind, owner_profile_id")
      .eq("project_id", projectId),
  ]);

  const credentialRows = credentials.data ?? [];
  const groupRows = groups.data ?? [];

  const credentialName = new Map(
    credentialRows.map((row) => [String(row.id), String(row.name)] as const),
  );
  const credentialGroup = new Map(
    credentialRows.map(
      (row) =>
        [
          String(row.id),
          row.env_group_id ? String(row.env_group_id) : null,
        ] as const,
    ),
  );
  const linkName = new Map(
    (links.data ?? []).map((row) => [String(row.id), String(row.label)] as const),
  );
  const groupById = new Map(
    groupRows.map(
      (row) =>
        [
          String(row.id),
          {
            name: String(row.name),
            kind: String(row.kind ?? "main"),
            ownerId: row.owner_profile_id ? String(row.owner_profile_id) : null,
          },
        ] as const,
    ),
  );

  const ids = [
    ...credentialName.keys(),
    ...linkName.keys(),
    ...groupById.keys(),
  ];
  if (!ids.length) return [];

  const { data, error } = await supabase
    .from("app_audit_logs")
    .select(
      "id, actor_id, action, resource_type, resource_id, metadata, occurred_at, ip, user_agent",
    )
    .in("resource_type", ["credential", "project_link", "env_group"])
    .in("resource_id", ids)
    .order("occurred_at", { ascending: false })
    .limit(limit);

  if (error || !data?.length) return [];

  const rows = data as Row[];
  const peopleIds = new Set<string>();
  for (const row of rows) {
    if (row.actor_id) peopleIds.add(String(row.actor_id));
  }
  for (const group of groupById.values()) {
    if (group.ownerId) peopleIds.add(group.ownerId);
  }

  const people = await resolvePeople(supabase, [...peopleIds]);

  function versionOf(groupId: string | null) {
    if (!groupId) return null;
    const group = groupById.get(groupId);
    if (!group) return null;
    if (group.kind !== "personal") return "Main environment";
    const owner = group.ownerId ? people.get(group.ownerId)?.name : null;
    return owner ? `${owner}'s version` : "A member's version";
  }

  return rows.map((row) => {
    const metadata = (row.metadata ?? {}) as Record<string, unknown>;
    const resourceType = String(row.resource_type);
    const resourceId = row.resource_id ? String(row.resource_id) : null;

    let target = "—";
    let group: string | null = null;
    let version: string | null = null;

    if (resourceType === "credential" && resourceId) {
      target = credentialName.get(resourceId) ?? "Removed variable";
      const groupId = credentialGroup.get(resourceId) ?? null;
      group = groupId ? (groupById.get(groupId)?.name ?? null) : null;
      version = versionOf(groupId);
    } else if (resourceType === "project_link" && resourceId) {
      target =
        linkName.get(resourceId) ??
        (typeof metadata.label === "string" ? metadata.label : "Removed link");
      version = "Working links";
    } else if (resourceType === "env_group" && resourceId) {
      const known = groupById.get(resourceId);
      target =
        known?.name ??
        (typeof metadata.group_name === "string"
          ? metadata.group_name
          : "Removed group");
      group = target;
      version =
        known?.kind === "personal"
          ? versionOf(resourceId)
          : typeof metadata.group_kind === "string" &&
              metadata.group_kind === "personal"
            ? "A member's version"
            : "Main environment";
    }

    const actor = row.actor_id ? people.get(String(row.actor_id)) : undefined;

    return {
      id: Number(row.id),
      action: String(row.action),
      category: auditCategory(String(row.action)),
      target,
      actorId: row.actor_id ? String(row.actor_id) : null,
      actor:
        actor?.name ??
        (typeof metadata.deleted_actor === "string"
          ? `${metadata.deleted_actor} (deleted)`
          : "System"),
      actorEmail: actor?.email ?? null,
      actorRole: actor?.role ?? null,
      ip: row.ip ? String(row.ip) : null,
      userAgent: row.user_agent ? String(row.user_agent) : null,
      occurredAt: String(row.occurred_at),
      version,
      group,
      detail: describe(metadata),
    };
  });
}

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;
type AuditPerson = { name: string; email: string | null; role: string | null };

function describe(metadata: Record<string, unknown>) {
  if (typeof metadata.detail === "string" && metadata.detail) {
    return metadata.detail;
  }

  const parts: string[] = [];
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
  return parts.length ? parts.join(" · ") : null;
}

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
