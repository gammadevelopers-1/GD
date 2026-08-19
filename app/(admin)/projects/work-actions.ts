"use server";

import { requireRole } from "@/data/auth";
import { getIdeaBoard } from "@/data/idea-board";
import { getWorkBoard } from "@/data/work-board";
import { createClient } from "@/lib/supabase/server";
import {
  type SimpleFormState,
  formError,
  formSuccess,
} from "@/lib/projects/form-state";
import { isUuid } from "@/lib/projects/validation";
import {
  type IdeaDoc,
  IdeaDocError,
  parseIdeaDoc,
} from "@/lib/projects/idea-doc";
import { ideaDocToText } from "@/lib/projects/idea-text";
import { organiseIdeaNotes } from "@/lib/projects/work-ai";

export type OrganiseMode = "replace" | "append";

export type OrganiseState = SimpleFormState & { doc?: IdeaDoc };

function isFrameworkSignal(error: unknown) {
  const digest = (error as { digest?: unknown })?.digest;
  return typeof digest === "string" && digest.startsWith("NEXT_");
}

async function persist(
  projectId: string,
  doc: IdeaDoc,
  markGenerated: boolean,
): Promise<SimpleFormState> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("app_save_work_board", {
    target_project_id: projectId,
    new_doc: doc,
    mark_generated: markGenerated,
  });

  if (error) {
    return formError(
      "Those changes were not saved. You may not have edit access.",
    );
  }
  return formSuccess("Saved.");
}

export async function saveWorkBoard(
  projectId: string,
  serialisedDoc: string,
): Promise<SimpleFormState> {
  try {
    await requireRole(["owner", "member"]);
    if (!isUuid(projectId))
      return formError("That project could not be found.");

    return await persist(projectId, parseIdeaDoc(serialisedDoc), false);
  } catch (error) {
    if (isFrameworkSignal(error)) throw error;
    if (error instanceof IdeaDocError) return formError(error.message);
    console.error("saveWorkBoard failed", error);
    return formError("The work board could not be saved. Try again.");
  }
}

export async function organiseWorkBoard(
  projectId: string,
  mode: OrganiseMode,
): Promise<OrganiseState> {
  try {
    const viewer = await requireRole(["owner", "member"]);
    if (!isUuid(projectId))
      return formError("That project could not be found.");

    const board = await getIdeaBoard(projectId, viewer);
    const notes = ideaDocToText(board.doc);
    if (!notes.trim()) {
      return formError("There is nothing on the Idea Board to organise yet.");
    }

    const organised = await organiseIdeaNotes(notes);
    if (!organised.ok) return formError(organised.reason);

    let doc = organised.doc;
    if (mode === "append") {
      const existing = await getWorkBoard(projectId, viewer);
      doc = {
        type: "doc",
        content: [
          ...existing.doc.content,
          ...(existing.doc.content.length
            ? [{ type: "horizontalRule" as const }]
            : []),
          ...organised.doc.content,
        ],
      };
    }

    const checked = parseIdeaDoc(doc);
    const saved = await persist(projectId, checked, true);
    if (saved.status === "error") return saved;

    return {
      status: "success",
      message: `Organised into ${organised.sections} ${
        organised.sections === 1 ? "section" : "sections"
      }.`,
      doc: checked,
    };
  } catch (error) {
    if (isFrameworkSignal(error)) throw error;
    if (error instanceof IdeaDocError) return formError(error.message);
    console.error("organiseWorkBoard failed", error);
    return formError("The work board could not be organised. Try again.");
  }
}
