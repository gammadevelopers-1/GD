"use server";

import { requireRole } from "@/data/auth";
import { createClient } from "@/lib/supabase/server";
import {
  type SimpleFormState,
  formError,
  formSuccess,
} from "@/lib/projects/form-state";
import { isUuid } from "@/lib/projects/validation";
import { IdeaDocError, parseIdeaDoc } from "@/lib/projects/idea-doc";
import {
  IDEA_ATTACHMENT_MAX_BYTES,
  IDEA_ATTACHMENT_TYPES,
} from "@/lib/projects/idea-media";
import {
  IDEA_PROMPT_MAX,
  type IdeaAiState,
  isIdeaAiAction,
} from "@/lib/projects/idea-draft";
import { draftIdeaPassage } from "@/lib/projects/idea-ai";

export type UploadResult = SimpleFormState & {
  path?: string;
  name?: string;
  mime?: string;
  size?: number;
};

function isFrameworkSignal(error: unknown) {
  const digest = (error as { digest?: unknown })?.digest;
  return typeof digest === "string" && digest.startsWith("NEXT_");
}

export async function saveIdeaBoard(
  projectId: string,
  serialisedDoc: string,
): Promise<SimpleFormState> {
  try {
    await requireRole(["owner", "member"]);
    if (!isUuid(projectId))
      return formError("That project could not be found.");

    const doc = parseIdeaDoc(serialisedDoc);
    const supabase = await createClient();
    const { error } = await supabase.rpc("app_save_idea_board", {
      target_project_id: projectId,
      new_doc: doc,
    });

    if (error) {
      return formError(
        "Those changes were not saved. You may not have edit access.",
      );
    }

    return formSuccess("Saved.");
  } catch (error) {
    if (isFrameworkSignal(error)) throw error;
    if (error instanceof IdeaDocError) return formError(error.message);
    console.error("saveIdeaBoard failed", error);
    return formError("The board could not be saved. Try again.");
  }
}

export async function uploadIdeaAttachment(
  _state: UploadResult,
  formData: FormData,
): Promise<UploadResult> {
  try {
    await requireRole(["owner", "member"]);
    const projectId = String(formData.get("projectId") ?? "");
    const file = formData.get("file");

    if (!isUuid(projectId))
      return formError("That project could not be found.");
    if (!(file instanceof File) || !file.size) {
      return formError("Choose a file to add.");
    }
    if (file.size > IDEA_ATTACHMENT_MAX_BYTES) {
      return formError("Files are limited to 10 MB.");
    }
    if (!IDEA_ATTACHMENT_TYPES.has(file.type)) {
      return formError("That file type cannot be added.");
    }

    const supabase = await createClient();
    const safeName = file.name.replace(/[^\w.\-]+/g, "_").slice(-120);
    const path = `${projectId}/ideas/${crypto.randomUUID()}-${safeName}`;

    const { error } = await supabase.storage
      .from("app-project-attachments")
      .upload(path, file, { contentType: file.type, upsert: false });

    if (error) {
      return formError("Only people on this project can add files.");
    }

    return {
      ...formSuccess("Added."),
      path,
      name: file.name.slice(0, 200),
      mime: file.type,
      size: file.size,
    };
  } catch (error) {
    if (isFrameworkSignal(error)) throw error;
    console.error("uploadIdeaAttachment failed", error);
    return formError("The file could not be uploaded. Please try again.");
  }
}

export async function askIdeaAi(
  _state: IdeaAiState,
  formData: FormData,
): Promise<IdeaAiState> {
  try {
    await requireRole(["owner", "member"]);

    const projectId = String(formData.get("projectId") ?? "");
    const rawAction = String(formData.get("action") ?? "custom");
    const prompt = String(formData.get("prompt") ?? "");

    if (!isUuid(projectId)) {
      return formError("That project could not be found.");
    }
    if (!isIdeaAiAction(rawAction)) {
      return formError("That is not something AI can do here.");
    }
    if (prompt.length > IDEA_PROMPT_MAX) {
      return formError("That prompt is too long.");
    }

    const supabase = await createClient();
    const { data: project } = await supabase
      .from("app_projects")
      .select("id")
      .eq("id", projectId)
      .maybeSingle();

    if (!project) return formError("That project could not be found.");

    const draft = await draftIdeaPassage({
      action: rawAction,
      prompt,
      document: String(formData.get("document") ?? ""),
      selection: String(formData.get("selection") ?? ""),
    });

    if (!draft.ok) return formError(draft.reason);

    return { ...formSuccess("Drafted."), blocks: draft.blocks };
  } catch (error) {
    if (isFrameworkSignal(error)) throw error;
    console.error("askIdeaAi failed", error);
    return formError("The draft could not be written. Try again.");
  }
}
