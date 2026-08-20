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

const RESPONSIBILITY_MAX = 120;

function refresh() {
  revalidatePath("/projects/[projectId]", "layout");
  revalidatePath("/projects");
  revalidatePath("/dashboard");
}

function readResponsibility(formData: FormData) {
  return String(formData.get("responsibility") ?? "")
    .trim()
    .slice(0, RESPONSIBILITY_MAX);
}

async function recordTeamEvent(
  supabase: Awaited<ReturnType<typeof createClient>>,
  projectId: string,
  action: string,
  profileId: string,
) {
  await supabase.rpc("app_record_project_event", {
    target_project_id: projectId,
    action_name: action,
    event_metadata: { profile_id: profileId },
  });
}

export async function addProjectMember(
  _state: SimpleFormState,
  formData: FormData,
): Promise<SimpleFormState> {
  const viewer = await requireRole(["owner"]);
  const projectId = String(formData.get("projectId") ?? "");
  const profileId = String(formData.get("profileId") ?? "");
  const responsibility = readResponsibility(formData);

  if (!isUuid(projectId)) return formError("That project could not be found.");
  if (!isUuid(profileId)) return formError("Choose who to add.");

  const supabase = await createClient();
  const { error } = await supabase.from("app_project_members").upsert(
    {
      project_id: projectId,
      profile_id: profileId,
      responsibility: responsibility || null,
      added_by: viewer.id,
      archived_at: null,
      archived_by: null,
    },
    { onConflict: "project_id,profile_id" },
  );

  if (error) {
    return formError(
      error.code === "23514"
        ? "That person is not an active team member any more."
        : "They could not be added. Please try again.",
    );
  }

  await recordTeamEvent(supabase, projectId, "project.member_added", profileId);
  refresh();
  return formSuccess("Added to the project. They can see it now.");
}

export async function updateMemberResponsibility(
  _state: SimpleFormState,
  formData: FormData,
): Promise<SimpleFormState> {
  await requireRole(["owner"]);
  const projectId = String(formData.get("projectId") ?? "");
  const profileId = String(formData.get("profileId") ?? "");
  const responsibility = readResponsibility(formData);

  if (!isUuid(projectId) || !isUuid(profileId)) {
    return formError("That assignment could not be found.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("app_project_members")
    .update({ responsibility: responsibility || null })
    .eq("project_id", projectId)
    .eq("profile_id", profileId);

  if (error) return formError("The change could not be saved.");

  refresh();
  return formSuccess(" ");
}

export async function removeProjectMember(formData: FormData) {
  await requireRole(["owner"]);
  const projectId = String(formData.get("projectId") ?? "");
  const profileId = String(formData.get("profileId") ?? "");
  if (!isUuid(projectId) || !isUuid(profileId)) return;

  const supabase = await createClient();

  const { data: project } = await supabase
    .from("app_projects")
    .select("lead_id")
    .eq("id", projectId)
    .maybeSingle();

  if (project?.lead_id && String(project.lead_id) === profileId) {
    await supabase
      .from("app_projects")
      .update({ lead_id: null })
      .eq("id", projectId);
  }

  const { error } = await supabase
    .from("app_project_members")
    .delete()
    .eq("project_id", projectId)
    .eq("profile_id", profileId);

  if (error) return;

  await recordTeamEvent(
    supabase,
    projectId,
    "project.member_removed",
    profileId,
  );
  refresh();
}

export async function restoreProjectMember(formData: FormData) {
  const viewer = await requireRole(["owner"]);
  const projectId = String(formData.get("projectId") ?? "");
  const profileId = String(formData.get("profileId") ?? "");
  if (!isUuid(projectId) || !isUuid(profileId)) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("app_project_members")
    .update({ archived_at: null, archived_by: null, added_by: viewer.id })
    .eq("project_id", projectId)
    .eq("profile_id", profileId);

  if (error) return;

  await recordTeamEvent(
    supabase,
    projectId,
    "project.member_restored",
    profileId,
  );
  refresh();
}

export async function setProjectLead(formData: FormData) {
  await requireRole(["owner"]);
  const projectId = String(formData.get("projectId") ?? "");
  const rawLead = String(formData.get("profileId") ?? "");
  const leadId = rawLead === "" ? null : rawLead;

  if (!isUuid(projectId)) return;
  if (leadId !== null && !isUuid(leadId)) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("app_projects")
    .update({ lead_id: leadId })
    .eq("id", projectId);

  if (error) return;

  await supabase.rpc("app_record_project_event", {
    target_project_id: projectId,
    action_name: "project.lead_changed",
    event_metadata: { profile_id: leadId },
  });
  refresh();
}
