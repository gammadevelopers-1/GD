import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Viewer } from "@/data/auth";

export type NotificationKind =
  | "env_access"
  | "project_member"
  | "project_lead"
  | "week_planned"
  | "task_assigned"
  | "session_revoked";

export type Notification = {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string | null;
  href: string | null;
  actorName: string | null;
  createdAt: string;
  read: boolean;
};

export type Inbox = {
  items: Notification[];
  unread: number;
};

const INBOX_LIMIT = 30;

export const getMyNotifications = cache(
  async (viewer: Viewer): Promise<Inbox> => {
    const supabase = await createClient();

    const [{ data, error }, { count }] = await Promise.all([
      supabase
        .from("app_notifications")
        .select(
          "id, kind, title, body, href, created_at, read_at, actor:actor_id(full_name, display_name)",
        )
        .eq("profile_id", viewer.id)
        .order("created_at", { ascending: false })
        .limit(INBOX_LIMIT),
      supabase
        .from("app_notifications")
        .select("id", { count: "exact", head: true })
        .eq("profile_id", viewer.id)
        .is("read_at", null),
    ]);

    if (error || !data) return { items: [], unread: 0 };

    const items = data.map((row) => {
      const actor = row.actor as unknown as {
        full_name: string | null;
        display_name: string | null;
      } | null;

      return {
        id: String(row.id),
        kind: String(row.kind) as NotificationKind,
        title: String(row.title),
        body: row.body ? String(row.body) : null,
        href: row.href ? String(row.href) : null,
        actorName: actor
          ? (actor.display_name ?? actor.full_name ?? null)
          : null,
        createdAt: String(row.created_at),
        read: row.read_at !== null,
      };
    });

    return {
      items,
      unread: count ?? items.filter((item) => !item.read).length,
    };
  },
);
