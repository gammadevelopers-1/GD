import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Viewer } from "@/data/auth";
import {
  EMPTY_DOC,
  type IdeaDoc,
  IdeaDocError,
  parseIdeaDoc,
} from "@/lib/projects/idea-doc";

export type WorkBoard = {
  doc: IdeaDoc;
  updatedAt: string | null;
  updatedBy: string | null;
  generatedAt: string | null;
};

export async function getWorkBoard(
  projectId: string,
  viewer: Viewer,
): Promise<WorkBoard> {
  if (viewer.role !== "owner" && viewer.role !== "member") {
    return {
      doc: EMPTY_DOC,
      updatedAt: null,
      updatedBy: null,
      generatedAt: null,
    };
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("app_project_work_boards")
    .select(
      "doc, updated_at, generated_at, editor:app_profiles!app_project_work_boards_updated_by_fkey(full_name)",
    )
    .eq("project_id", projectId)
    .maybeSingle();

  if (!data) {
    return {
      doc: EMPTY_DOC,
      updatedAt: null,
      updatedBy: null,
      generatedAt: null,
    };
  }

  const row = data as unknown as {
    doc: unknown;
    updated_at: string | null;
    generated_at: string | null;
    editor: { full_name: string } | null;
  };

  let doc = EMPTY_DOC;
  try {
    doc = parseIdeaDoc(row.doc);
  } catch (error) {
    if (!(error instanceof IdeaDocError)) throw error;
  }

  return {
    doc,
    updatedAt: row.updated_at,
    updatedBy: row.editor?.full_name ?? null,
    generatedAt: row.generated_at,
  };
}
