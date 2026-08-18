"use server";

import { revalidatePath } from "next/cache";
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

export type UploadResult = SimpleFormState & {
  path?: string;
  name?: string;
  mime?: string;
  size?: number;
};

export async function saveIdeaBoard(
  projectId: string,
  raw: unknown,
): Promise<SimpleFormState> {
  try {
    await requireRole(["owner", "member"]);
    if (!isUuid(projectId))
      return formError("That project could not be found.");

    const doc = parseIdeaDoc(raw);
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

    revalidatePath("/projects/[projectId]", "page");
    return formSuccess("Saved.");
  } catch (error) {
    if (error instanceof IdeaDocError) return formError(error.message);
    return formError("Could not save. Check your connection.");
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
  } catch {
    return formError("The file could not be uploaded. Please try again.");
  }
}
