import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Viewer } from "@/data/auth";
import { fingerprintOf } from "@/lib/projects/env-merge";

export type EnvVariableRow = {
  id: string;
  key: string;
  note: string | null;
  fingerprint: string;
  groupId: string;
  updatedAt: string | null;
};

export type EnvGroupRow = {
  id: string;
  name: string;
  variables: EnvVariableRow[];
};

export type EnvVersion = {
  profileId: string;
  name: string;
  initials: string;
  isViewer: boolean;
  isOwnerVersion: boolean;
  groups: EnvGroupRow[];
  total: number;
};

export type EnvHolder = {
  profileId: string;
  name: string;
  initials: string;
  credentialId: string;
  fingerprint: string;
};

export type MainEntryRow = {
  credentialId: string;
  key: string;
  note: string | null;
  groupId: string;
  fingerprint: string;
  sourceProfileId: string | null;
  sourceName: string | null;
  sourceInitials: string | null;
  holders: EnvHolder[];
  agree: boolean;
  sharedWith: { profileId: string; name: string }[];
};

export type MainGroupRow = {
  id: string;
  name: string;
  entries: MainEntryRow[];
};

export type EnvCandidate = {
  key: string;
  holders: EnvHolder[];
  agree: boolean;
};

export type SharedEntry = {
  credentialId: string;
  key: string;
  sourceName: string | null;
};

export type EnvWorkspace = {
  mainGroups: MainGroupRow[];
  mainTotal: number;
  versions: EnvVersion[];
  candidates: EnvCandidate[];
  sharedWithMe: SharedEntry[];
};

export function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type PreviewRow = {
  variable_name: unknown;
  credential_id: unknown;
  env_group_id: unknown;
  env_group_name: unknown;
  copy_kind: unknown;
  profile_id: unknown;
  profile_name: unknown;
  value_digest: unknown;
  is_main: unknown;
  main_source_credential_id: unknown;
  updated_at: unknown;
};

export async function getEnvWorkspace(
  projectId: string,
  viewer: Viewer,
): Promise<EnvWorkspace> {
  const empty: EnvWorkspace = {
    mainGroups: [],
    mainTotal: 0,
    versions: [],
    candidates: [],
    sharedWithMe: [],
  };

  if (viewer.role !== "owner" && viewer.role !== "member") return empty;

  const supabase = await createClient();
  const isOwner = viewer.role === "owner";

  const [groupsResult, previewResult, credentialsResult] = await Promise.all([
      supabase
        .from("app_env_groups")
        .select("id, name, kind, owner_profile_id, position")
        .eq("project_id", projectId)
        .is("archived_at", null)
        .order("position")
        .order("name"),
      supabase.rpc("app_env_merge_preview", { target_project_id: projectId }),
      supabase
        .from("app_project_credentials")
        .select("id, name, description, env_group_id, updated_at")
        .eq("project_id", projectId)
        .is("archived_at", null)
        .order("name"),
  ]);

  const groups = groupsResult.data ?? [];
  const preview = (previewResult.data ?? []) as PreviewRow[];
  const credentials = credentialsResult.data ?? [];

  const credentialIds = credentials.map((row) => String(row.id));
  const { data: grantRows } = credentialIds.length
    ? await supabase
        .from("app_credential_grants")
        .select("credential_id, profile_id")
        .in("credential_id", credentialIds)
        .is("revoked_at", null)
    : { data: [] };
  const grants = grantRows ?? [];

  const digestByCredential = new Map<string, string | null>();
  const profileByCredential = new Map<string, string>();
  const nameByProfile = new Map<string, string>();
  const sourceByCredential = new Map<string, string | null>();

  for (const row of preview) {
    const credentialId = String(row.credential_id);
    digestByCredential.set(
      credentialId,
      row.value_digest ? String(row.value_digest) : null,
    );
    if (row.profile_id) {
      profileByCredential.set(credentialId, String(row.profile_id));
      nameByProfile.set(
        String(row.profile_id),
        row.profile_name ? String(row.profile_name) : "Unknown",
      );
    }
    if (row.is_main) {
      sourceByCredential.set(
        credentialId,
        row.main_source_credential_id
          ? String(row.main_source_credential_id)
          : null,
      );
    }
  }

  const ownerIds = new Set<string>();
  for (const group of groups) {
    if (group.owner_profile_id) ownerIds.add(String(group.owner_profile_id));
  }
  for (const id of ownerIds) {
    if (!nameByProfile.has(id)) nameByProfile.set(id, "Unknown");
  }

  for (const grant of grants) {
    const profileId = String(grant.profile_id);
    if (!nameByProfile.has(profileId)) nameByProfile.set(profileId, "Unknown");
  }

  const missing = [...nameByProfile.entries()]
    .filter(([, name]) => name === "Unknown")
    .map(([id]) => id);
  if (missing.length) {
    const { data } = await supabase
      .from("app_profiles")
      .select("id, full_name, display_name")
      .in("id", missing);
    for (const row of data ?? []) {
      nameByProfile.set(
        String(row.id),
        String(row.display_name ?? row.full_name),
      );
    }
  }

  const variablesByGroup = new Map<string, EnvVariableRow[]>();
  for (const row of credentials) {
    const groupId = row.env_group_id ? String(row.env_group_id) : null;
    if (!groupId) continue;
    const list = variablesByGroup.get(groupId) ?? [];
    list.push({
      id: String(row.id),
      key: String(row.name),
      note: row.description ? String(row.description) : null,
      fingerprint: fingerprintOf(digestByCredential.get(String(row.id)) ?? null),
      groupId,
      updatedAt: row.updated_at ? String(row.updated_at) : null,
    });
    variablesByGroup.set(groupId, list);
  }

  const versionsByProfile = new Map<string, EnvGroupRow[]>();
  const mainGroupRows: { id: string; name: string }[] = [];

  for (const group of groups) {
    const id = String(group.id);
    const row: EnvGroupRow = {
      id,
      name: String(group.name),
      variables: variablesByGroup.get(id) ?? [],
    };

    if (String(group.kind) === "personal" && group.owner_profile_id) {
      const profileId = String(group.owner_profile_id);
      const list = versionsByProfile.get(profileId) ?? [];
      list.push(row);
      versionsByProfile.set(profileId, list);
    } else {
      mainGroupRows.push({ id, name: row.name });
    }
  }

  const holdersByKey = new Map<string, EnvHolder[]>();
  for (const [profileId, groupRows] of versionsByProfile) {
    for (const group of groupRows) {
      for (const variable of group.variables) {
        const list = holdersByKey.get(variable.key) ?? [];
        const name = nameByProfile.get(profileId) ?? "Unknown";
        list.push({
          profileId,
          name,
          initials: initialsOf(name),
          credentialId: variable.id,
          fingerprint: variable.fingerprint,
        });
        holdersByKey.set(variable.key, list);
      }
    }
  }

  function agreementOf(holders: EnvHolder[]) {
    const seen = new Set(holders.map((holder) => holder.fingerprint));
    return seen.size <= 1;
  }

  const sharedByCredential = new Map<string, { profileId: string; name: string }[]>();
  const myGrants = new Set<string>();
  for (const grant of grants) {
    const credentialId = String(grant.credential_id);
    const profileId = String(grant.profile_id);
    if (profileId === viewer.id) myGrants.add(credentialId);
    const list = sharedByCredential.get(credentialId) ?? [];
    list.push({
      profileId,
      name: nameByProfile.get(profileId) ?? "Unknown",
      });
    sharedByCredential.set(credentialId, list);
  }

  const mainGroups: MainGroupRow[] = mainGroupRows.map((group) => ({
    id: group.id,
    name: group.name,
    entries: (variablesByGroup.get(group.id) ?? []).map((variable) => {
      const sourceCredential = sourceByCredential.get(variable.id) ?? null;
      const sourceProfileId = sourceCredential
        ? (profileByCredential.get(sourceCredential) ?? null)
        : null;
      const sourceName = sourceProfileId
        ? (nameByProfile.get(sourceProfileId) ?? null)
        : null;
      const holders = holdersByKey.get(variable.key) ?? [];

      return {
        credentialId: variable.id,
        key: variable.key,
        note: variable.note,
        groupId: group.id,
        fingerprint: variable.fingerprint,
        sourceProfileId,
        sourceName,
        sourceInitials: sourceName ? initialsOf(sourceName) : null,
        holders,
        agree: agreementOf(holders),
        sharedWith: sharedByCredential.get(variable.id) ?? [],
      };
    }),
  }));

  const inMain = new Set(
    mainGroups.flatMap((group) => group.entries.map((entry) => entry.key)),
  );

  const candidates: EnvCandidate[] = [...holdersByKey.entries()]
    .filter(([key]) => !inMain.has(key))
    .map(([key, holders]) => ({
      key,
      holders,
      agree: agreementOf(holders),
    }))
    .sort((a, b) => a.key.localeCompare(b.key));

  const versions: EnvVersion[] = [...versionsByProfile.entries()]
    .map(([profileId, groupRows]) => {
      const name = nameByProfile.get(profileId) ?? "Unknown";
      return {
        profileId,
        name,
        initials: initialsOf(name),
        isViewer: profileId === viewer.id,
        isOwnerVersion: false,
        groups: groupRows,
        total: groupRows.reduce((sum, group) => sum + group.variables.length, 0),
      };
    })
    .sort((a, b) =>
      a.isViewer === b.isViewer
        ? a.name.localeCompare(b.name)
        : a.isViewer
          ? -1
          : 1,
    );

  const sharedWithMe: SharedEntry[] = isOwner
    ? []
    : mainGroups
        .flatMap((group) => group.entries)
        .filter((entry) => myGrants.has(entry.credentialId))
        .map((entry) => ({
          credentialId: entry.credentialId,
          key: entry.key,
          sourceName: entry.sourceName,
        }));

  return {
    mainGroups,
    mainTotal: mainGroups.reduce((sum, group) => sum + group.entries.length, 0),
    versions,
    candidates,
    sharedWithMe,
  };
}
