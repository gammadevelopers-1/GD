import "server-only";

import { createClient } from "@/lib/supabase/server";

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
