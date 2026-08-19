import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { signStoragePaths } from "@/lib/supabase/admin";
import { isBannerFit } from "@/lib/projects/banner";
import { isProjectStatus } from "@/lib/projects/status";
import {
  type IdeaDoc,
  IdeaDocError,
  parseIdeaDoc,
} from "@/lib/projects/idea-doc";
import type { Portal, PortalPerson, PortalWeek } from "@/lib/portal/types";

const ATTACHMENTS_BUCKET = "app-project-attachments";

export type ClientViewer = {
  id: string;
  email: string;
  fullName: string;
  initials: string;
};

export type PortalProject = {
  publicId: string;
  name: string;
  status: string;
};

function initialsOf(name: string, email: string) {
  const source = name.trim() || email;
  return source
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export const getClientViewer = cache(async (): Promise<ClientViewer | null> => {
  if (!hasSupabaseConfig()) return null;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims?.sub) return null;

  const { data: account } = await supabase
    .from("app_client_users")
    .select("id, email, full_name")
    .eq("id", claims.sub)
    .is("archived_at", null)
    .maybeSingle();

  if (!account) return null;

  const fullName = String(account.full_name ?? "");
  const email = String(account.email);

  return {
    id: String(account.id),
    email,
    fullName: fullName || email,
    initials: initialsOf(fullName, email),
  };
});

export async function requireClientViewer() {
  const viewer = await getClientViewer();
  if (!viewer) redirect("/portal/sign-in?reason=access");
  return viewer;
}

export async function requirePortalAccess() {
  const viewer = await requireClientViewer();

  const supabase = await createClient();
  const { data: stale } = await supabase.rpc("app_client_touch");

  if (stale === true) {
    await supabase.auth.signOut();
    redirect("/portal/sign-in?reason=expired");
  }

  return viewer;
}

export async function getPortalProjects(): Promise<PortalProject[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("app_client_projects");
  if (error || !Array.isArray(data)) return [];

  return data.map((row) => ({
    publicId: String(row.public_id),
    name: String(row.name),
    status: String(row.status),
  }));
}

export async function getPortal(publicId: string): Promise<Portal | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("app_client_portal", {
    target_public_id: publicId,
  });
  if (error || !data) return null;
  return shapePortal(data);
}

export async function getPortalPreview(
  publicId: string,
): Promise<Portal | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("app_client_portal_preview", {
    target_public_id: publicId,
  });
  if (error || !data) return null;
  return shapePortal(data);
}

export async function markPortalSeen(publicId: string) {
  const supabase = await createClient();
  await supabase.rpc("app_client_seen", { target_public_id: publicId });
}

type RawWeek = {
  id: string;
  number: number;
  startsOn: string | null;
  dueOn: string;
  focus: string | null;
  completedAt: string | null;
  ideaDoc: unknown;
  items: Array<{ id: string; title: string; done: boolean }>;
};

type RawPayload = {
  project: {
    publicId: string;
    name: string;
    description: string | null;
    status: string;
    startsOn: string | null;
    dueOn: string | null;
    bannerPath: string | null;
    bannerFit: string | null;
  };
  canEditMilestones: boolean;
  lastUpdatedAt: string | null;
  weeks: RawWeek[];
  team: Array<{
    name: string;
    responsibility: string | null;
    avatarPath: string | null;
    isLead: boolean;
  }>;
  technical: {
    liveDomain: string | null;
    stagingDomain: string | null;
    designUrl: string | null;
    stackNotes: string | null;
  };
};

function safeDoc(raw: unknown): IdeaDoc | null {
  if (raw === null || raw === undefined) return null;
  try {
    const doc = parseIdeaDoc(raw);
    return doc.content.length ? doc : null;
  } catch (error) {
    if (error instanceof IdeaDocError) return null;
    throw error;
  }
}

async function shapePortal(raw: unknown): Promise<Portal> {
  const payload = raw as RawPayload;

  const paths = [
    payload.project.bannerPath,
    ...payload.team.map((person) => person.avatarPath),
  ].filter((path): path is string => Boolean(path));

  const signed = await signStoragePaths(ATTACHMENTS_BUCKET, [
    ...new Set(paths),
  ]);

  const weeks: PortalWeek[] = (payload.weeks ?? []).map((week) => ({
    id: String(week.id),
    number: Number(week.number),
    startsOn: week.startsOn,
    dueOn: String(week.dueOn),
    focus: week.focus,
    completedAt: week.completedAt,
    ideaDoc: safeDoc(week.ideaDoc),
    items: (week.items ?? []).map((item) => ({
      id: String(item.id),
      title: String(item.title),
      done: Boolean(item.done),
    })),
  }));

  const team: PortalPerson[] = (payload.team ?? []).map((person) => ({
    name: String(person.name),
    responsibility: person.responsibility,
    avatarUrl: person.avatarPath ? (signed[person.avatarPath] ?? null) : null,
    isLead: Boolean(person.isLead),
  }));

  const status = String(payload.project.status);
  const fit = String(payload.project.bannerFit ?? "cover");

  return {
    project: {
      publicId: String(payload.project.publicId),
      name: String(payload.project.name),
      description: payload.project.description,
      status: isProjectStatus(status) ? status : "building",
      startsOn: payload.project.startsOn,
      dueOn: payload.project.dueOn,
      bannerUrl: payload.project.bannerPath
        ? (signed[payload.project.bannerPath] ?? null)
        : null,
      bannerFit: isBannerFit(fit) ? fit : "cover",
    },
    canEditMilestones: Boolean(payload.canEditMilestones),
    lastUpdatedAt: payload.lastUpdatedAt,
    weeks,
    team,
  };
}
