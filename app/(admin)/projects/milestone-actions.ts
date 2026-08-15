"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/data/auth";
import { createClient } from "@/lib/supabase/server";
import {
  type SimpleFormState,
  formError,
  formSuccess,
} from "@/lib/projects/form-state";
import { isIsoDate, isUuid } from "@/lib/projects/validation";

const LABEL_MAX = 240;
const WEEK_MAX = 999;

function refresh(projectId: string) {
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects");
  revalidatePath("/dashboard");
}

function readWeekFields(formData: FormData) {
  return {
    weekNumber: Number(String(formData.get("weekNumber") ?? "").trim()),
    startsOn: String(formData.get("startsOn") ?? "").trim(),
    dueOn: String(formData.get("dueOn") ?? "").trim(),
  };
}

function validateWeek({
  weekNumber,
  startsOn,
  dueOn,
}: ReturnType<typeof readWeekFields>) {
  if (
    !Number.isInteger(weekNumber) ||
    weekNumber < 1 ||
    weekNumber > WEEK_MAX
  ) {
    return "Week number must be a whole number from 1 upwards.";
  }
  if (!isIsoDate(dueOn)) return "Give the week a due date.";
  if (startsOn && !isIsoDate(startsOn)) return "Use a real start date.";
  if (startsOn && dueOn < startsOn) {
    return "The week cannot be due before it starts.";
  }
  return null;
}

export async function addMilestoneWeek(
  _state: SimpleFormState,
  formData: FormData,
): Promise<SimpleFormState> {
  await requireRole(["owner"]);
  const projectId = String(formData.get("projectId") ?? "");
  if (!isUuid(projectId)) return formError("That project could not be found.");

  const fields = readWeekFields(formData);
  const problem = validateWeek(fields);
  if (problem) return formError(problem);

  const supabase = await createClient();
  const { error } = await supabase.from("app_milestone_weeks").insert({
    project_id: projectId,
    week_number: fields.weekNumber,
    starts_on: fields.startsOn || null,
    due_on: fields.dueOn,
  });

  if (error) {
    return formError(
      error.code === "23505"
        ? `Week ${fields.weekNumber} already exists on this project.`
        : "The week could not be added.",
    );
  }

  refresh(projectId);
  return formSuccess(`Week ${fields.weekNumber} planned.`);
}

export async function updateMilestoneWeek(
  _state: SimpleFormState,
  formData: FormData,
): Promise<SimpleFormState> {
  await requireRole(["owner"]);
  const projectId = String(formData.get("projectId") ?? "");
  const weekId = String(formData.get("weekId") ?? "");
  if (!isUuid(projectId) || !isUuid(weekId)) {
    return formError("That week could not be found.");
  }

  const fields = readWeekFields(formData);
  const problem = validateWeek(fields);
  if (problem) return formError(problem);

  const supabase = await createClient();
  const { error } = await supabase
    .from("app_milestone_weeks")
    .update({
      week_number: fields.weekNumber,
      starts_on: fields.startsOn || null,
      due_on: fields.dueOn,
    })
    .eq("id", weekId);

  if (error) {
    return formError(
      error.code === "23505"
        ? `Week ${fields.weekNumber} already exists on this project.`
        : "The week could not be saved.",
    );
  }

  refresh(projectId);
  return formSuccess("Week updated.");
}

export async function setMilestoneWeekArchived(formData: FormData) {
  await requireRole(["owner"]);
  const projectId = String(formData.get("projectId") ?? "");
  const weekId = String(formData.get("weekId") ?? "");
  const archived = String(formData.get("archived") ?? "") === "1";
  if (!isUuid(projectId) || !isUuid(weekId)) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("app_milestone_weeks")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", weekId);

  if (error) return;
  refresh(projectId);
}

export async function addMilestoneItem(
  _state: SimpleFormState,
  formData: FormData,
): Promise<SimpleFormState> {
  await requireRole(["owner"]);
  const projectId = String(formData.get("projectId") ?? "");
  const weekId = String(formData.get("weekId") ?? "");
  const label = String(formData.get("label") ?? "").trim();
  const rawAssignee = String(formData.get("assignedTo") ?? "").trim();

  if (!isUuid(projectId) || !isUuid(weekId)) {
    return formError("That week could not be found.");
  }
  if (!label) return formError("Describe what should be done.");
  if (label.length > LABEL_MAX) {
    return formError(`Keep it under ${LABEL_MAX} characters.`);
  }
  if (rawAssignee && !isUuid(rawAssignee)) {
    return formError("That person is not valid.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("app_milestone_items").insert({
    milestone_week_id: weekId,
    label,
    assigned_to: rawAssignee || null,
  });

  if (error) {
    return formError(
      error.code === "23514"
        ? "Items can only be assigned to someone on the project team."
        : "The item could not be added.",
    );
  }

  refresh(projectId);
  return formSuccess("Item added.");
}

// Goes through the RPC because nobody can update this table directly.
export async function saveMilestoneItem(
  _state: SimpleFormState,
  formData: FormData,
): Promise<SimpleFormState> {
  await requireRole(["owner"]);
  const projectId = String(formData.get("projectId") ?? "");
  const itemId = String(formData.get("itemId") ?? "");
  const label = String(formData.get("label") ?? "").trim();
  const rawAssignee = String(formData.get("assignedTo") ?? "").trim();

  if (!isUuid(projectId) || !isUuid(itemId)) {
    return formError("That item could not be found.");
  }
  if (!label) return formError("Describe what should be done.");
  if (label.length > LABEL_MAX) {
    return formError(`Keep it under ${LABEL_MAX} characters.`);
  }
  if (rawAssignee && !isUuid(rawAssignee)) {
    return formError("That person is not valid.");
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("app_save_milestone_item", {
    target_item_id: itemId,
    new_label: label,
    new_assigned_to: rawAssignee || null,
  });

  if (error) {
    return formError(
      error.code === "23514"
        ? "Items can only be assigned to someone on the project team."
        : "The item could not be saved.",
    );
  }

  refresh(projectId);
  return formSuccess("Item saved.");
}

export async function setMilestoneItemArchived(formData: FormData) {
  await requireRole(["owner"]);
  const projectId = String(formData.get("projectId") ?? "");
  const itemId = String(formData.get("itemId") ?? "");
  const archived = String(formData.get("archived") ?? "") === "1";
  if (!isUuid(projectId) || !isUuid(itemId)) return;

  const supabase = await createClient();
  const { error } = await supabase.rpc("app_set_milestone_item_archived", {
    target_item_id: itemId,
    archived,
  });

  if (error) return;
  refresh(projectId);
}
