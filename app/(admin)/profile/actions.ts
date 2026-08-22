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
const BANNERS_BUCKET = "app-banners";
const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
const BANNER_MAX_BYTES = 4 * 1024 * 1024;
const IMAGE_MIME = ["image/png", "image/jpeg", "image/webp"];

function refresh() {
  revalidatePath("/profile");
  revalidatePath("/", "layout");
}

async function uploadPicture(
  bucket: string,
  file: unknown,
  maxBytes: number,
  limitMessage: string,
) {
  if (!(file instanceof File) || !file.size) {
    return { error: "Choose an image first." as string, path: null };
  }
  if (file.size > maxBytes) return { error: limitMessage, path: null };
  if (!IMAGE_MIME.includes(file.type)) {
    return { error: "Use a PNG, JPEG or WebP image.", path: null };
  }

  const viewer = await requireViewer();
  const extension = file.type.split("/")[1]?.replace("jpeg", "jpg") ?? "png";
  const path = `${viewer.id}/${randomUUID()}.${extension}`;

  const supabase = await createClient();
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) return { error: "That image could not be uploaded.", path: null };
  return { error: null, path };
}

export async function saveMyProfile(
  _state: SimpleFormState,
  formData: FormData,
): Promise<SimpleFormState> {
  await requireViewer();
  const displayName = String(formData.get("displayName") ?? "").trim();

  if (displayName && (displayName.length < 2 || displayName.length > 60)) {
    return formError("A display name is between 2 and 60 characters.");
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("app_update_my_profile", {
    new_display_name: displayName || null,
    new_avatar_path: null,
  });

  if (error) return formError(error.message);

  refresh();
  return formSuccess("Saved.");
}

export async function saveMyAvatar(
  _state: SimpleFormState,
  formData: FormData,
): Promise<SimpleFormState> {
  await requireViewer();
  const { error: uploadError, path } = await uploadPicture(
    AVATARS_BUCKET,
    formData.get("avatar"),
    AVATAR_MAX_BYTES,
    "Pictures are limited to 2MB.",
  );
  if (uploadError || !path) return formError(uploadError ?? "Upload failed.");

  const supabase = await createClient();
  const { error } = await supabase.rpc("app_update_my_avatar", {
    new_avatar_path: path,
  });

  if (error) {
    await supabase.storage.from(AVATARS_BUCKET).remove([path]);
    return formError(error.message);
  }

  refresh();
  return formSuccess("Picture updated.");
}

export async function saveMyBanner(
  _state: SimpleFormState,
  formData: FormData,
): Promise<SimpleFormState> {
  await requireViewer();
  const { error: uploadError, path } = await uploadPicture(
    BANNERS_BUCKET,
    formData.get("banner"),
    BANNER_MAX_BYTES,
    "Covers are limited to 4MB.",
  );
  if (uploadError || !path) return formError(uploadError ?? "Upload failed.");

  const supabase = await createClient();
  const { error } = await supabase.rpc("app_update_my_banner", {
    new_banner_path: path,
  });

  if (error) {
    await supabase.storage.from(BANNERS_BUCKET).remove([path]);
    return formError(error.message);
  }

  refresh();
  return formSuccess("Cover updated.");
}

export async function removeMyBanner() {
  await requireViewer();
  const supabase = await createClient();
  await supabase.rpc("app_update_my_banner", { new_banner_path: null });
  refresh();
}
