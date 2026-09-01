import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { readUserAgent, type Device } from "@/lib/sessions/user-agent";
import { initials } from "@/lib/projects/format";
import type { AppRole } from "@/data/auth";

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

export type PersonSessions = {
  profileId: string;
  name: string;
  email: string;
  role: AppRole;
  initials: string;
  isYou: boolean;
  sessions: MySession[];
};

export const getAllSessions = cache(async (): Promise<PersonSessions[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("app_all_sessions");

  if (error || !data) return [];

  const people = new Map<string, PersonSessions>();

  for (const row of data as Array<Record<string, unknown>>) {
    const profileId = String(row.profile_id);
    let person = people.get(profileId);

    if (!person) {
      const name =
        (row.display_name ? String(row.display_name) : null) ??
        String(row.full_name ?? "Unnamed");

      person = {
        profileId,
        name,
        email: row.email ? String(row.email) : "No email on record",
        role: String(row.role) as AppRole,
        initials: initials(name),
        isYou: false,
        sessions: [],
      };
      people.set(profileId, person);
    }

    if (!row.session_id) continue;

    const current = row.is_current === true;
    if (current) person.isYou = true;

    person.sessions.push({
      id: String(row.session_id),
      device: readUserAgent(row.user_agent ? String(row.user_agent) : null),
      ip: row.ip ? String(row.ip) : null,
      createdAt: String(row.created_at),
      lastSeenAt: String(row.last_seen_at ?? row.created_at),
      expiresAt: null,
      current,
    });
  }

  return [...people.values()];
});
