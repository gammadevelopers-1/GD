import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Viewer } from "@/data/auth";

export type ProjectLinkKind = "link" | "notes";

export type ProjectLink = {
  id: string;
  slug: string | null;
  label: string;
  kind: ProjectLinkKind;
  value: string;
  position: number;
};

export async function getProjectLinks(
  projectId: string,
  viewer: Viewer,
): Promise<ProjectLink[]> {
  if (viewer.role !== "owner" && viewer.role !== "member") return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("app_project_links")
    .select("id, slug, label, kind, value, position")
    .eq("project_id", projectId)
    .order("position")
    .order("created_at");

  return (data ?? []).map((row) => ({
    id: String(row.id),
    slug: row.slug ? String(row.slug) : null,
    label: String(row.label),
    kind: row.kind === "notes" ? "notes" : "link",
    value: String(row.value ?? ""),
    position: Number(row.position ?? 0),
  }));
}
