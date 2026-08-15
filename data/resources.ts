import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Viewer } from "@/data/auth";


export async function getPeople(viewer: Viewer) {
  if (viewer.role !== "owner" && viewer.role !== "member") return [];

  const supabase = await createClient();
  let query = supabase
    .from("app_profiles")
    .select("id, full_name, role, is_active, created_at")
    .is("archived_at", null)
    .order("full_name");

  if (viewer.role !== "owner") query = query.eq("id", viewer.id);
  const { data } = await query;
  return (data ?? []).map((row) => ({
    id: String(row.id),
    fullName: String(row.full_name),
    role: String(row.role),
    active: Boolean(row.is_active),
  }));
}

export async function getClients() {
  const supabase = await createClient();
  const [clientsResult, projectsResult, contactsResult] = await Promise.all([
    supabase
      .from("app_clients")
      .select("id, name, website")
      .is("archived_at", null)
      .order("name"),
    supabase
      .from("app_projects")
      .select("id, client_id, status")
      .is("archived_at", null),
    supabase
      .from("app_client_contacts")
      .select("client_id, full_name, email, is_primary")
      .is("archived_at", null),
  ]);

  return (clientsResult.data ?? []).map((client) => {
    const projects = (projectsResult.data ?? []).filter(
      (project) => project.client_id === client.id,
    );
    const contacts = (contactsResult.data ?? []).filter(
      (contact) => contact.client_id === client.id,
    );
    const primary =
      contacts.find((contact) => contact.is_primary) ?? contacts[0];
    return {
      id: String(client.id),
      name: String(client.name),
      website: client.website ? String(client.website) : null,
      projectCount: projects.length,
      activeCount: projects.filter(
        (project) => !["paused", "closed"].includes(String(project.status)),
      ).length,
      contact: primary ? String(primary.full_name) : "No primary contact",
      email: primary?.email ? String(primary.email) : null,
    };
  });
}

export async function getCmsPages() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("cms_pages")
    .select("id, slug, title, status, updated_at")
    .order("updated_at", { ascending: false });
  return (data ?? []).map((row) => ({
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    status: String(row.status),
    updatedAt: String(row.updated_at),
  }));
}



