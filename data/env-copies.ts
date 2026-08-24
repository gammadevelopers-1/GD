import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Viewer } from "@/data/auth";
import type { MergeRow } from "@/lib/projects/env-merge";

export type EnvCopy = {
  id: string;
  name: string;
  ownerId: string;
  ownerName: string;
  variableCount: number;
};

export type CopyVariable = {
  id: string;
  key: string;
  fingerprint: string;
  updatedAt: string | null;
};

export async function getMyCopies(
  projectId: string,
  viewer: Viewer,
): Promise<EnvCopy[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("app_env_groups")
    .select("id, name, owner_profile_id")
    .eq("project_id", projectId)
    .eq("kind", "personal")
    .eq("owner_profile_id", viewer.id)
    .is("archived_at", null)
    .order("name");

  return (data ?? []).map((row) => ({
    id: String(row.id),
    name: String(row.name),
    ownerId: String(row.owner_profile_id),
    ownerName: viewer.displayName ?? viewer.fullName,
    variableCount: 0,
  }));
}

export async function getCopyVariables(
  groupId: string,
): Promise<CopyVariable[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("app_project_credentials")
    .select("id, name, updated_at")
    .eq("env_group_id", groupId)
    .is("archived_at", null)
    .order("name");

  return (data ?? []).map((row) => ({
    id: String(row.id),
    key: String(row.name),
    fingerprint: "····",
    updatedAt: row.updated_at ? String(row.updated_at) : null,
  }));
}

export async function getMergeRows(
  projectId: string,
  viewer: Viewer,
): Promise<MergeRow[]> {
  if (viewer.role !== "owner") return [];

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("app_env_merge_preview", {
    target_project_id: projectId,
  });

  if (error || !data) return [];

  return (data as Array<Record<string, unknown>>).map((row) => ({
    key: String(row.variable_name),
    credentialId: String(row.credential_id),
    groupId: String(row.env_group_id),
    groupName: String(row.env_group_name),
    kind: row.copy_kind === "main" ? "main" : "personal",
    profileId: row.profile_id ? String(row.profile_id) : null,
    profileName: row.profile_name ? String(row.profile_name) : "Unknown",
    digest: row.value_digest ? String(row.value_digest) : null,
    isMain: Boolean(row.is_main),
    mainSourceCredentialId: row.main_source_credential_id
      ? String(row.main_source_credential_id)
      : null,
    updatedAt: row.updated_at ? String(row.updated_at) : null,
  }));
}
