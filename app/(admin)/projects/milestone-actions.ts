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

const WEEK_MAX = 999;

function refresh() {
  revalidatePath("/projects/[projectId]", "page");
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

  refresh();
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

  refresh();
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
  refresh();
}
