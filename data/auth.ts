import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/config";

export type AppRole = "owner" | "member" | "finance";

export type Viewer = {
  id: string;
  email: string;
  fullName: string;
  role: AppRole;
  initials: string;
};

export const getViewer = cache(async (): Promise<Viewer | null> => {
  if (!hasSupabaseConfig()) return null;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (error || !claims?.sub) return null;

  const { data: profile, error: profileError } = await supabase
    .from("app_profiles")
    .select("id, full_name, role")
    .eq("id", claims.sub)
    .single();

  if (profileError || !profile) return null;

  const fullName = String(profile.full_name);

  return {
    id: String(profile.id),
    email: typeof claims.email === "string" ? claims.email : "",
    fullName,
    role: profile.role as AppRole,
    initials: fullName
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase(),
  };
});

export async function requireViewer() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  return viewer;
}

export async function requireRole(roles: AppRole[]) {
  const viewer = await requireViewer();
  if (!roles.includes(viewer.role)) redirect("/dashboard");
  return viewer;
}
