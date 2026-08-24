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
import { LINK_LABEL_MAX } from "@/lib/projects/links";

function refresh() {
  revalidatePath("/projects/[projectId]", "layout");
}

function readable(error: { code?: string; message: string }) {
  return error.code === "23514" ||
    error.code === "42501" ||
    error.code === "P0001"
    ? error.message
    : null;
}

export async function setProjectLink(
  _state: SimpleFormState,
  formData: FormData,
): Promise<SimpleFormState> {
  await requireRole(["owner", "member"]);

  const linkId = String(formData.get("linkId") ?? "");
  const value = String(formData.get("value") ?? "");

  if (!isUuid(linkId)) return formError("That link could not be found.");

  const supabase = await createClient();
  const { error } = await supabase.rpc("app_set_project_link", {
    target_link_id: linkId,
    new_value: value,
  });

  if (error) {
    return formError(readable(error) ?? "That link could not be saved.");
  }

  refresh();
  return formSuccess("Link saved.");
}

export async function renameProjectLink(
  _state: SimpleFormState,
  formData: FormData,
): Promise<SimpleFormState> {
  await requireRole(["owner", "member"]);

  const linkId = String(formData.get("linkId") ?? "");
  const label = String(formData.get("label") ?? "").trim();

  if (!isUuid(linkId)) return formError("That link could not be found.");
  if (!label || label.length > LINK_LABEL_MAX) {
    return formError(`Give the link a name of up to ${LINK_LABEL_MAX} characters.`);
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("app_rename_project_link", {
    target_link_id: linkId,
    new_label: label,
  });

  if (error) {
    return formError(readable(error) ?? "That link could not be renamed.");
  }

  refresh();
  return formSuccess("Link renamed.");
}

export async function clearProjectLink(
  _state: SimpleFormState,
  formData: FormData,
): Promise<SimpleFormState> {
  await requireRole(["owner", "member"]);

  const linkId = String(formData.get("linkId") ?? "");
  if (!isUuid(linkId)) return formError("That link could not be found.");

  const supabase = await createClient();
  const { error } = await supabase.rpc("app_clear_project_link", {
    target_link_id: linkId,
  });

  if (error) {
    return formError(readable(error) ?? "That link could not be cleared.");
  }

  refresh();
  return formSuccess("Link cleared.");
}

export async function addProjectLink(
  _state: SimpleFormState,
  formData: FormData,
): Promise<SimpleFormState> {
  await requireRole(["owner", "member"]);

  const projectId = String(formData.get("projectId") ?? "");
  const label = String(formData.get("label") ?? "").trim();
  const value = String(formData.get("value") ?? "").trim();

  if (!isUuid(projectId)) return formError("That project could not be found.");
  if (!label || label.length > LINK_LABEL_MAX) {
    return formError(`Give the link a name of up to ${LINK_LABEL_MAX} characters.`);
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("app_add_project_link", {
    target_project_id: projectId,
    new_label: label,
    new_value: value,
  });

  if (error) {
    return formError(readable(error) ?? "That link could not be added.");
  }

  refresh();
  return formSuccess("Link added.");
}

export async function deleteProjectLink(
  _state: SimpleFormState,
  formData: FormData,
): Promise<SimpleFormState> {
  await requireRole(["owner", "member"]);

  const linkId = String(formData.get("linkId") ?? "");
  if (!isUuid(linkId)) return formError("That link could not be found.");

  const supabase = await createClient();
  const { error } = await supabase.rpc("app_delete_project_link", {
    target_link_id: linkId,
  });

  if (error) {
    return formError(readable(error) ?? "That link could not be removed.");
  }

  refresh();
  return formSuccess("Link removed.");
}
