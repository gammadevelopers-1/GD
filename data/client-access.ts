import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Viewer } from "@/data/auth";

export type ClientGrant = {
  id: string;
  clientUserId: string;
  name: string;
  email: string;
  canEditMilestones: boolean;
  grantedAt: string;
  lastSeenAt: string | null;
  activatedAt: string | null;
};

export async function getClientAccess(
  projectId: string,
  viewer: Viewer,
): Promise<ClientGrant[]> {
  if (viewer.role !== "owner") return [];

  const supabase = await createClient();

  const { data: accessRows } = await supabase
    .from("app_project_client_access")
    .select("id, client_user_id, can_edit_milestones, granted_at, last_seen_at")
    .eq("project_id", projectId)
    .is("revoked_at", null)
    .order("granted_at", { ascending: false });

  const rows = accessRows ?? [];
  if (!rows.length) return [];

  const { data: people } = await supabase
    .from("app_client_users")
    .select("id, full_name, email, activated_at")
    .in(
      "id",
      rows.map((row) => String(row.client_user_id)),
    );

  const byId = new Map(
    (people ?? []).map((person) => [String(person.id), person]),
  );

  return rows.map((row) => {
    const person = byId.get(String(row.client_user_id));
    const email = person?.email ? String(person.email) : "";
    return {
      id: String(row.id),
      clientUserId: String(row.client_user_id),
      name: person?.full_name ? String(person.full_name) : email || "Unknown",
      email,
      canEditMilestones: Boolean(row.can_edit_milestones),
      grantedAt: String(row.granted_at),
      lastSeenAt: row.last_seen_at ? String(row.last_seen_at) : null,
      activatedAt: person?.activated_at ? String(person.activated_at) : null,
    };
  });
}
