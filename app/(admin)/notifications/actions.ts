"use server";

import { requireViewer } from "@/data/auth";
import { createClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/projects/validation";

export async function markNotificationsRead(ids?: string[]) {
  await requireViewer();
  const targets = ids?.filter(isUuid) ?? null;
  if (targets && !targets.length) return;

  const supabase = await createClient();
  await supabase.rpc("app_mark_notifications_read", { target_ids: targets });
}

export type FreshNotification = {
  id: string;
  title: string;
  body: string | null;
  href: string | null;
  createdAt: string;
};

const FRESH_LIMIT = 5;

export async function notificationsSince(
  since: string | null,
): Promise<FreshNotification[]> {
  const viewer = await requireViewer();
  const supabase = await createClient();

  let query = supabase
    .from("app_notifications")
    .select("id, title, body, href, created_at")
    .eq("profile_id", viewer.id)
    .is("read_at", null)
    .order("created_at", { ascending: false })
    .limit(FRESH_LIMIT);

  if (since && Number.isFinite(Date.parse(since))) {
    query = query.gt("created_at", since);
  }

  const { data } = await query;

  return (data ?? []).map((row) => ({
    id: String(row.id),
    title: String(row.title),
    body: row.body ? String(row.body) : null,
    href: row.href ? String(row.href) : null,
    createdAt: String(row.created_at),
  }));
}
