"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireViewer } from "@/data/auth";
import { createClient } from "@/lib/supabase/server";
import {
  type SimpleFormState,
  formError,
  formSuccess,
} from "@/lib/projects/form-state";

const AVATARS_BUCKET = "app-avatars";
const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
const AVATAR_MIME = ["image/png", "image/jpeg", "image/webp"];

export async function saveMyProfile(
  _state: SimpleFormState,
  formData: FormData,
): Promise<SimpleFormState> {
  const viewer = await requireViewer();
  const displayName = String(formData.get("displayName") ?? "").trim();
  const file = formData.get("avatar");

  if (displayName && (displayName.length < 2 || displayName.length > 60)) {
    return formError("A display name is between 2 and 60 characters.");
  }

  const supabase = await createClient();
  let uploadedPath: string | null = null;

  if (file instanceof File && file.size) {
    if (file.size > AVATAR_MAX_BYTES) {
      return formError("Pictures are limited to 2MB.");
    }
    if (!AVATAR_MIME.includes(file.type)) {
      return formError("Use a PNG, JPEG or WebP image.");
    }

    const extension = file.type.split("/")[1]?.replace("jpeg", "jpg") ?? "png";
    const path = `${viewer.id}/${randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(AVATARS_BUCKET)
      .upload(path, file, { contentType: file.type, upsert: false });

    if (uploadError) return formError("That picture could not be uploaded.");
    uploadedPath = path;
  }

  const { error } = await supabase.rpc("app_update_my_profile", {
    new_display_name: displayName || null,
    new_avatar_path: uploadedPath,
  });

  if (error) {
    if (uploadedPath) {
      await supabase.storage.from(AVATARS_BUCKET).remove([uploadedPath]);
    }
    return formError(error.message);
  }

  revalidatePath("/profile");
  revalidatePath("/", "layout");
  return formSuccess("Saved.");
}
