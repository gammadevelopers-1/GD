"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/config";

export type LoginState = { error?: string };

export async function login(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  if (!hasSupabaseConfig()) {
    return { error: "Supabase has not been connected yet." };
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/dashboard");

  if (!email || !password) {
    return { error: "Enter both your email and password." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return { error: "Those sign-in details were not accepted." };
  }

  const { data: profile } = await supabase
    .from("app_profiles")
    .select("id")
    .eq("id", data.user.id)
    .eq("is_active", true)
    .is("archived_at", null)
    .maybeSingle();

  if (!profile) {
    await supabase.auth.signOut();
    return {
      error:
        "This account is not active on the internal platform. Ask an owner for access.",
    };
  }

  redirect(
    next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard",
  );
}

export async function logout() {
  if (hasSupabaseConfig()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  redirect("/login");
}
