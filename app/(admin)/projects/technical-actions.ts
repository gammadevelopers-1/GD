"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/data/auth";
import { createClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/projects/validation";
import {
  type TechnicalFormState,
  readTechnicalForm,
  technicalErrorSummary,
  validateTechnical,
} from "@/lib/projects/technical";

export async function saveTechnicalDetails(
  _state: TechnicalFormState,
  formData: FormData,
): Promise<TechnicalFormState> {
  await requireRole(["owner", "member"]);

  const projectId = String(formData.get("projectId") ?? "");
  const values = readTechnicalForm(formData);

  if (!isUuid(projectId)) {
    return {
      status: "error",
      message: "That project could not be found.",
      fieldErrors: {},
      values,
    };
  }

  const { errors, parsed } = validateTechnical(values);
  if (!parsed) {
    return {
      status: "error",
      message: technicalErrorSummary(errors),
      fieldErrors: errors,
      values,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("app_save_technical_details", {
    target_project_id: projectId,
    new_repository_url: parsed.repositoryUrl,
    new_hosting_url: parsed.hostingUrl,
    new_live_domain: parsed.liveDomain,
    new_staging_domain: parsed.stagingDomain,
    new_design_url: parsed.designUrl,
    new_technical_contact: null,
    new_stack_notes: null,
    new_onboarding_notes: parsed.onboardingNotes,
  });

  if (error) {
    const readable =
      error.code === "23514" ||
      error.code === "22023" ||
      error.code === "42501";
    return {
      status: "error",
      message: readable
        ? error.message
        : "The technical details could not be saved.",
      fieldErrors: {},
      values,
    };
  }

  revalidatePath("/projects/[projectId]", "page");
  return {
    status: "success",
    message: "Technical details saved.",
    fieldErrors: {},
    values: null,
  };
}
