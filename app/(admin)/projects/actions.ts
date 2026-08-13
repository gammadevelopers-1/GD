"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/data/auth";
import { createClient } from "@/lib/supabase/server";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function toggleMilestoneItem(formData: FormData) {
  await requireRole(["owner", "member"]);
  const itemId = String(formData.get("itemId") ?? "");
  const projectId = String(formData.get("projectId") ?? "");
  if (!UUID.test(itemId) || !UUID.test(projectId)) return;

  const supabase = await createClient();
  const { error } = await supabase.rpc("app_toggle_milestone_item", {
    target_item_id: itemId,
  });
  if (error) return;

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects");
  revalidatePath("/dashboard");
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
