import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { readUserAgent, type Device } from "@/lib/sessions/user-agent";

export type MySession = {
  id: string;
  device: Device;
  ip: string | null;
  createdAt: string;
  lastSeenAt: string;
  expiresAt: string | null;
  current: boolean;
};

export const getMySessions = cache(async (): Promise<MySession[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("app_my_sessions");

  if (error || !data) return [];

  return (data as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id),
    device: readUserAgent(row.user_agent ? String(row.user_agent) : null),
    ip: row.ip ? String(row.ip) : null,
    createdAt: String(row.created_at),
    lastSeenAt: String(row.last_seen_at ?? row.created_at),
    expiresAt: row.expires_at ? String(row.expires_at) : null,
    current: row.is_current === true,
  }));
});
