"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/data/auth";
import { createClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/projects/validation";
import { readImageSize } from "@/lib/projects/image-size";
import {
  BANNER_FITS,
  type BannerFit,
  type BannerFormState,
  isBannerFit,
} from "@/lib/projects/banner";

const BANNER_MAX_BYTES = 5 * 1024 * 1024;
const BANNER_MIN_WIDTH = 640;
const BANNER_MIN_HEIGHT = 160;

const BANNER_EXTENSIONS = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

function fail(message: string): BannerFormState {
  return { status: "error", message, warning: null };
}

function done(message: string, warning: string | null): BannerFormState {
  return { status: "success", message, warning };
}

function refresh() {
  revalidatePath("/projects/[projectId]", "page");
  revalidatePath("/projects");
  revalidatePath("/dashboard");
}

function undersizedNote(
  width: number,
  height: number,
  fit: BannerFit,
): string | null {
  if (width >= BANNER_MIN_WIDTH && height >= BANNER_MIN_HEIGHT) return null;
  const suffix =
    fit === "cover"
      ? " Saved with Crop — switch to Fit or Fill if it looks wrong."
      : "";
  return `This image is ${width}×${height}, smaller than the ${BANNER_MIN_WIDTH}×${BANNER_MIN_HEIGHT} a banner fills, so it may look soft.${suffix}`;
}

export async function setProjectBanner(
  _state: BannerFormState,
  formData: FormData,
): Promise<BannerFormState> {
  try {
    await requireRole(["owner", "member"]);

    const projectId = String(formData.get("projectId") ?? "");
    const requestedFit = String(formData.get("fit") ?? "");
    const fit: BannerFit = isBannerFit(requestedFit) ? requestedFit : "cover";
    const file = formData.get("file");

    if (!isUuid(projectId)) return fail("That project could not be found.");
    if (!(file instanceof File) || !file.size) return fail("Choose an image.");
    if (file.size > BANNER_MAX_BYTES) {
      return fail("That image is over 5MB. Use a smaller file.");
    }

    const extension = BANNER_EXTENSIONS.get(file.type);
    if (!extension) return fail("Use a JPEG, PNG or WebP image.");

    const bytes = await file.arrayBuffer();
    const size = readImageSize(bytes);
    if (!size) {
      return fail("That file is not a readable image. Try another one.");
    }

    const supabase = await createClient();
    const path = `${projectId}/banner/${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("app-project-attachments")
      .upload(path, bytes, { contentType: file.type, upsert: false });

    if (uploadError) {
      return fail("Only an owner or the project lead can change the banner.");
    }

    const { error } = await supabase.rpc("app_set_project_banner", {
      target_project_id: projectId,
      new_path: path,
      new_fit: fit,
    });
    if (error) return fail("The banner could not be saved. Please try again.");

    refresh();
    return done(
      "Banner updated.",
      undersizedNote(size.width, size.height, fit),
    );
  } catch {
    return fail("The banner could not be uploaded. Please try again.");
  }
}

export async function setProjectBannerFit(
  _state: BannerFormState,
  formData: FormData,
): Promise<BannerFormState> {
  try {
    await requireRole(["owner", "member"]);

    const projectId = String(formData.get("projectId") ?? "");
    const fit = String(formData.get("fit") ?? "");

    if (!isUuid(projectId)) return fail("That project could not be found.");
    if (!isBannerFit(fit)) return fail("Unknown banner fit.");

    const supabase = await createClient();
    const { error } = await supabase.rpc("app_set_project_banner_fit", {
      target_project_id: projectId,
      new_fit: fit,
    });
    if (error) {
      return fail("Only an owner or the project lead can change the banner.");
    }

    refresh();
    return done(`Banner set to ${BANNER_FITS[fit]}.`, null);
  } catch {
    return fail("That could not be saved. Please try again.");
  }
}

export async function removeProjectBanner(
  _state: BannerFormState,
  formData: FormData,
): Promise<BannerFormState> {
  try {
    await requireRole(["owner", "member"]);

    const projectId = String(formData.get("projectId") ?? "");
    if (!isUuid(projectId)) return fail("That project could not be found.");

    const supabase = await createClient();
    const { error } = await supabase.rpc("app_set_project_banner", {
      target_project_id: projectId,
      new_path: null,
      new_fit: null,
    });
    if (error) {
      return fail("Only an owner or the project lead can change the banner.");
    }

    refresh();
    return done("Banner removed.", null);
  } catch {
    return fail("The banner could not be removed. Please try again.");
  }
}
