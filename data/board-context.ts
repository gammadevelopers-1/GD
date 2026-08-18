import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Viewer } from "@/data/auth";
import type { MilestoneWeek } from "@/data/project-detail";

const SIGNED_URL_TTL_SECONDS = 60 * 60;

export type BoardContext = {
  canManage: boolean;
  canUpdateStatus: boolean;
  credentials: Array<{ id: string; name: string }>;
  signedUrls: Record<string, string>;
};

export async function getBoardContext(
  projectId: string,
  viewer: Viewer,
  weeks: MilestoneWeek[],
): Promise<BoardContext> {
  const supabase = await createClient();

  const paths = [
    ...new Set(
      weeks
        .flatMap((week) => [...week.ideaCards, ...week.workCards])
        .flatMap((card) => card.blocks)
        .flatMap((block) =>
          block.type === "image" || block.type === "file" ? [block.path] : [],
        ),
    ),
  ];

  const [manageResult, statusResult, credentialResult, signedResult] =
    await Promise.all([
      supabase.rpc("app_can_manage_project", { target_project_id: projectId }),
      supabase.rpc("app_can_update_card_status", {
        target_project_id: projectId,
      }),
      supabase
        .from("app_project_credentials")
        .select("id, name")
        .eq("project_id", projectId)
        .is("archived_at", null)
        .order("name"),
      paths.length
        ? supabase.storage
            .from("app-project-attachments")
            .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS)
        : Promise.resolve({
            data: [] as Array<{ path?: string | null; signedUrl: string }>,
          }),
    ]);

  const signedUrls: Record<string, string> = {};
  for (const entry of signedResult.data ?? []) {
    if (entry?.path && entry.signedUrl)
      signedUrls[entry.path] = entry.signedUrl;
  }

  return {
    canManage: manageResult.data === true,
    canUpdateStatus: statusResult.data === true,
    credentials: (credentialResult.data ?? []).map((row) => ({
      id: String(row.id),
      name: String(row.name),
    })),
    signedUrls,
  };
}

export function isViewerLead(viewer: Viewer, leadId: string | null) {
  return Boolean(leadId && leadId === viewer.id);
}
