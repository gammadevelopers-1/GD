import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Viewer } from "@/data/auth";

// ENV containers and uploaded files. The variables themselves are credentials
// and come back from getProjectCredentials, so nothing here reads a value —
// this is the container metadata only.

export type EnvGroup = {
  id: string;
  name: string;
  description: string | null;
  position: number;
  isArchived: boolean;
};

export type EnvFile = {
  id: string;
  fileName: string;
  storagePath: string;
  byteSize: number;
  envGroupId: string | null;
  uploadedBy: string | null;
  createdAt: string;
};

export async function getEnvGroups(
  projectId: string,
  viewer: Viewer,
): Promise<EnvGroup[]> {
  if (viewer.role !== "owner" && viewer.role !== "member") return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("app_env_groups")
    .select("id, name, description, position, archived_at")
    .eq("project_id", projectId)
    .is("archived_at", null)
    .order("position")
    .order("name");

  return (data ?? []).map((row) => ({
    id: String(row.id),
    name: String(row.name),
    description: row.description ? String(row.description) : null,
    position: Number(row.position ?? 0),
    isArchived: Boolean(row.archived_at),
  }));
}

// Owner-only by policy. Anyone else gets an empty list rather than an error,
// because the section simply is not theirs to see.
export async function getEnvFiles(
  projectId: string,
  viewer: Viewer,
): Promise<EnvFile[]> {
  if (viewer.role !== "owner") return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("app_env_files")
    .select(
      "id, file_name, storage_path, byte_size, env_group_id, uploaded_by, created_at",
    )
    .eq("project_id", projectId)
    .is("archived_at", null)
    .order("created_at", { ascending: false });

  const rows = data ?? [];
  const uploaderIds = [
    ...new Set(rows.map((row) => String(row.uploaded_by)).filter(Boolean)),
  ];

  const names = new Map<string, string>();
  if (uploaderIds.length) {
    const { data: profiles } = await supabase
      .from("app_profiles")
      .select("id, full_name")
      .in("id", uploaderIds);
    for (const profile of profiles ?? []) {
      names.set(String(profile.id), String(profile.full_name));
    }
  }

  return rows.map((row) => ({
    id: String(row.id),
    fileName: String(row.file_name),
    storagePath: String(row.storage_path),
    byteSize: Number(row.byte_size ?? 0),
    envGroupId: row.env_group_id ? String(row.env_group_id) : null,
    uploadedBy: names.get(String(row.uploaded_by)) ?? null,
    createdAt: String(row.created_at),
  }));
}
