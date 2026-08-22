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
