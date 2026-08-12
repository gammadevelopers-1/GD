"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole, requireViewer } from "@/data/auth";
import { createClient } from "@/lib/supabase/server";

export async function toggleMilestoneItem(formData: FormData) {
  const viewer = await requireViewer();
  const itemId = String(formData.get("itemId") ?? "");
  const projectId = String(formData.get("projectId") ?? "");
  if (!itemId || !projectId) return;

  const supabase = await createClient();
  const { data: item } = await supabase
    .from("app_milestone_items")
    .select("is_done")
    .eq("id", itemId)
    .single();
  if (!item) return;

  const done = !item.is_done;
  await supabase
    .from("app_milestone_items")
    .update({
      is_done: done,
      completed_at: done ? new Date().toISOString() : null,
      completed_by: done ? viewer.id : null,
    })
    .eq("id", itemId);
  revalidatePath(`/projects/${projectId}`);
}

export async function createProject(formData: FormData) {
  const viewer = await requireRole(["owner"]);
  const name = String(formData.get("name") ?? "").trim();
  const clientId = String(formData.get("clientId") ?? "");
  const leadId = String(formData.get("leadId") ?? "") || null;
  const startsOn = String(formData.get("startsOn") ?? "") || null;
  const dueOn = String(formData.get("dueOn") ?? "") || null;
  const description = String(formData.get("description") ?? "").trim() || null;
  if (!name || !clientId) return;

  const supabase = await createClient();
  const { data: project, error } = await supabase
    .from("app_projects")
    .insert({
      name,
      client_id: clientId,
      lead_id: leadId,
      starts_on: startsOn,
      due_on: dueOn,
      description,
      status: "discovery",
      created_by: viewer.id,
    })
    .select("id")
    .single();

  if (error || !project) return;

  if (leadId) {
    await supabase.from("app_project_members").insert({
      project_id: project.id,
      profile_id: leadId,
      responsibility: "Project lead",
      added_by: viewer.id,
    });
  }

  redirect(`/projects/${project.id}`);
}
