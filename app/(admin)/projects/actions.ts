"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/data/auth";
import { createClient } from "@/lib/supabase/server";
import {
  type ProjectFormState,
  errorSummary,
  isUuid,
  readProjectForm,
  validateProject,
} from "@/lib/projects/validation";
import { isProjectStatus } from "@/lib/projects/status";

function refresh(projectId?: string) {
  if (projectId) revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects");
  revalidatePath("/dashboard");
}

function failure(state: Omit<ProjectFormState, "status">): ProjectFormState {
  return { ...state, status: "error" };
}

export async function toggleMilestoneItem(formData: FormData) {
  await requireRole(["owner", "member"]);
  const itemId = String(formData.get("itemId") ?? "");
  const projectId = String(formData.get("projectId") ?? "");
  if (!isUuid(itemId) || !isUuid(projectId)) return;

  const supabase = await createClient();
  const { error } = await supabase.rpc("app_toggle_milestone_item", {
    target_item_id: itemId,
  });
  if (error) return;

  refresh(projectId);
}

export async function createProject(
  _state: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const viewer = await requireRole(["owner"]);
  const values = readProjectForm(formData);
  const { errors, parsed } = validateProject(values, { allowFinancial: true });

  if (!parsed) {
    return failure({
      message: errorSummary(errors),
      fieldErrors: errors,
      values,
    });
  }

  const supabase = await createClient();
  const { data: project, error } = await supabase
    .from("app_projects")
    .insert({
      name: parsed.name,
      client_id: parsed.clientId,
      description: parsed.description,
      lead_id: parsed.leadId,
      starts_on: parsed.startsOn,
      due_on: parsed.dueOn,
      status: parsed.status,
      created_by: viewer.id,
    })
    .select("id")
    .single();

  if (error || !project) {
    return failure({
      message:
        error?.code === "23503"
          ? "That client or person no longer exists. Refresh and try again."
          : "The project could not be created. Please try again.",
      fieldErrors: {},
      values,
    });
  }

  const projectId = String(project.id);

  if (parsed.financial) {
    const { error: financialError } = await supabase
      .from("app_project_financials")
      .insert({
        project_id: projectId,
        value_amount: parsed.financial.amount,
        value_currency: parsed.financial.currency,
        exchange_rate_to_pkr: parsed.financial.rate,
        booked_on: parsed.financial.bookedOn,
      });

    if (financialError) {
      await supabase.rpc("app_record_project_event", {
        target_project_id: projectId,
        action_name: "project.created",
        event_metadata: { status: parsed.status, value_recorded: false },
      });
      refresh(projectId);
      redirect(`/projects/${projectId}?notice=value-not-saved`);
    }
  }

  await supabase.rpc("app_record_project_event", {
    target_project_id: projectId,
    action_name: "project.created",
    event_metadata: {
      status: parsed.status,
      value_recorded: Boolean(parsed.financial),
    },
  });

  refresh(projectId);
  redirect(`/projects/${projectId}?notice=created`);
}

export async function updateProject(
  _state: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  await requireRole(["owner"]);
  const projectId = String(formData.get("projectId") ?? "");
  if (!isUuid(projectId)) {
    return failure({
      message: "That project could not be found.",
      fieldErrors: {},
      values: null,
    });
  }

  const values = readProjectForm(formData);
  const supabase = await createClient();

  const { data: existingValue } = await supabase
    .from("app_project_financials")
    .select("project_id")
    .eq("project_id", projectId)
    .maybeSingle();

  const { errors, parsed } = validateProject(values, {
    allowFinancial: true,
    hasExistingValue: Boolean(existingValue),
  });

  if (!parsed) {
    return failure({
      message: errorSummary(errors),
      fieldErrors: errors,
      values,
    });
  }

  const { data: before } = await supabase
    .from("app_projects")
    .select("status")
    .eq("id", projectId)
    .maybeSingle();

  const { error } = await supabase
    .from("app_projects")
    .update({
      name: parsed.name,
      client_id: parsed.clientId,
      description: parsed.description,
      lead_id: parsed.leadId,
      starts_on: parsed.startsOn,
      due_on: parsed.dueOn,
      status: parsed.status,
    })
    .eq("id", projectId);

  if (error) {
    return failure({
      message: "The changes could not be saved. Please try again.",
      fieldErrors: {},
      values,
    });
  }

  if (parsed.financial) {
    const { error: financialError } = await supabase
      .from("app_project_financials")
      .upsert(
        {
          project_id: projectId,
          value_amount: parsed.financial.amount,
          value_currency: parsed.financial.currency,
          exchange_rate_to_pkr: parsed.financial.rate,
          booked_on: parsed.financial.bookedOn,
        },
        { onConflict: "project_id" },
      );

    if (financialError) {
      return failure({
        message: "The project was saved, but its value was not.",
        fieldErrors: {},
        values,
      });
    }
  }

  await supabase.rpc("app_record_project_event", {
    target_project_id: projectId,
    action_name: "project.updated",
    event_metadata: {
      status_from: before?.status ?? null,
      status_to: parsed.status,
    },
  });

  refresh(projectId);

  return {
    status: "success",
    message: "Project saved.",
    fieldErrors: {},
    values,
  };
}

export async function setProjectStatus(formData: FormData) {
  await requireRole(["owner"]);
  const projectId = String(formData.get("projectId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!isUuid(projectId) || !isProjectStatus(status)) return;

  const supabase = await createClient();
  const { data: before } = await supabase
    .from("app_projects")
    .select("status")
    .eq("id", projectId)
    .maybeSingle();

  if (before?.status === status) return;

  const { error } = await supabase
    .from("app_projects")
    .update({ status })
    .eq("id", projectId);
  if (error) return;

  await supabase.rpc("app_record_project_event", {
    target_project_id: projectId,
    action_name: "project.status_changed",
    event_metadata: { status_from: before?.status ?? null, status_to: status },
  });

  refresh(projectId);
}

// Archiving hides the project and cuts member access. Nothing is deleted.
export async function archiveProject(formData: FormData) {
  await requireRole(["owner"]);
  const projectId = String(formData.get("projectId") ?? "");
  if (!isUuid(projectId)) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("app_projects")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", projectId)
    .is("archived_at", null);
  if (error) return;

  await supabase.rpc("app_record_project_event", {
    target_project_id: projectId,
    action_name: "project.archived",
    event_metadata: {},
  });

  refresh(projectId);
  redirect("/projects?notice=archived");
}

export async function restoreProject(formData: FormData) {
  await requireRole(["owner"]);
  const projectId = String(formData.get("projectId") ?? "");
  if (!isUuid(projectId)) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("app_projects")
    .update({ archived_at: null })
    .eq("id", projectId)
    .not("archived_at", "is", null);
  if (error) return;

  await supabase.rpc("app_record_project_event", {
    target_project_id: projectId,
    action_name: "project.restored",
    event_metadata: {},
  });

  refresh(projectId);
  redirect(`/projects/${projectId}?notice=restored`);
}
