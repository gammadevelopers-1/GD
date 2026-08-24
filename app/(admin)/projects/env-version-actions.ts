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
import { ENV_GROUP_NAME_MAX } from "@/lib/projects/env";

function refresh() {
  revalidatePath("/projects/[projectId]", "layout");
}

export async function moveEnvVariable(
  _state: SimpleFormState,
  formData: FormData,
): Promise<SimpleFormState> {
  await requireRole(["owner", "member"]);

  const credentialId = String(formData.get("credentialId") ?? "");
  const groupId = String(formData.get("groupId") ?? "");

  if (!isUuid(credentialId)) return formError("That variable could not be found.");
  if (!isUuid(groupId)) return formError("Pick a group to move it to.");

  const supabase = await createClient();
  const { error } = await supabase.rpc("app_move_env_variable", {
    target_credential_id: credentialId,
    target_group_id: groupId,
  });

  if (error) {
    return formError(
      error.code === "42501" || error.code === "P0001"
        ? error.message
        : "That variable could not be moved.",
    );
  }

  refresh();
  return formSuccess("Variable moved.");
}

export async function deleteEnvVersion(
  _state: SimpleFormState,
  formData: FormData,
): Promise<SimpleFormState> {
  await requireRole(["owner", "member"]);

  const projectId = String(formData.get("projectId") ?? "");
  const profileId = String(formData.get("profileId") ?? "");

  if (!isUuid(projectId)) return formError("That project could not be found.");
  if (!isUuid(profileId)) return formError("That version could not be found.");

  const supabase = await createClient();
  const { error } = await supabase.rpc("app_delete_env_version", {
    target_project_id: projectId,
    target_profile_id: profileId,
  });

  if (error) {
    return formError(
      error.code === "42501"
        ? error.message
        : "That version could not be deleted.",
    );
  }

  refresh();
  return formSuccess("Version deleted.");
}

export async function renameMyGroup(
  _state: SimpleFormState,
  formData: FormData,
): Promise<SimpleFormState> {
  await requireRole(["owner", "member"]);

  const groupId = String(formData.get("groupId") ?? "");
  const name = String(formData.get("name") ?? "").trim();

  if (!isUuid(groupId)) return formError("That group could not be found.");
  if (!name || name.length > ENV_GROUP_NAME_MAX) {
    return formError(`Give the group a name of up to ${ENV_GROUP_NAME_MAX} characters.`);
  }

  const supabase = await createClient();
  const { error, count } = await supabase
    .from("app_env_groups")
    .update({ name }, { count: "exact" })
    .eq("id", groupId)
    .is("archived_at", null);

  if (error) {
    return formError(
      error.code === "23505"
        ? "This project already has a group with that name."
        : "That group could not be renamed.",
    );
  }
  if (!count) return formError("That group is not yours to rename.");

  refresh();
  return formSuccess("Group renamed.");
}

export async function deleteMyGroup(
  _state: SimpleFormState,
  formData: FormData,
): Promise<SimpleFormState> {
  await requireRole(["owner", "member"]);

  const groupId = String(formData.get("groupId") ?? "");
  if (!isUuid(groupId)) return formError("That group could not be found.");

  const supabase = await createClient();

  const { error: variableError } = await supabase
    .from("app_project_credentials")
    .update({ archived_at: new Date().toISOString() })
    .eq("env_group_id", groupId)
    .is("archived_at", null);

  if (variableError) {
    return formError("The variables in that group could not be removed.");
  }

  const { error, count } = await supabase
    .from("app_env_groups")
    .update({ archived_at: new Date().toISOString() }, { count: "exact" })
    .eq("id", groupId)
    .is("archived_at", null);

  if (error) return formError("That group could not be deleted.");
  if (!count) return formError("That group is not yours to delete.");

  refresh();
  return formSuccess("Group deleted.");
}
