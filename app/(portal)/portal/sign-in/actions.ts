"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { hashIp } from "@/lib/audit/rate-limit";

export type PortalAuthState = { error?: string };

async function clientIp() {
  const headerList = await headers();
  const forwarded = headerList.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

export async function signIn(
  _state: PortalAuthState,
  formData: FormData,
): Promise<PortalAuthState> {
  if (!hasSupabaseConfig()) return { error: "Sign-in is not available yet." };

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  const supabase = await createClient();
  const ipKey = hashIp(await clientIp());

  const { data: wait } = await supabase.rpc("app_client_signin_gate", {
    email_key: email,
    ip_key: ipKey,
  });

  if (Number(wait ?? 0) > 0) {
    return {
      error: `Too many attempts. Try again in ${Math.ceil(Number(wait) / 60)} minutes.`,
    };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    await supabase.rpc("app_client_signin_record", {
      email_key: email,
      ip_key: ipKey,
      succeeded: false,
    });
    return { error: "That email and password were not accepted." };
  }

  const { data: account } = await supabase
    .from("app_client_users")
    .select("id")
    .eq("id", data.user.id)
    .is("archived_at", null)
    .maybeSingle();

  if (!account) {
    await supabase.auth.signOut();
    await supabase.rpc("app_client_signin_record", {
      email_key: email,
      ip_key: ipKey,
      succeeded: false,
    });
    return { error: "That email and password were not accepted." };
  }

  await supabase.rpc("app_client_signin_record", {
    email_key: email,
    ip_key: ipKey,
    succeeded: true,
  });
  await supabase.rpc("app_client_signed_in");

  redirect("/portal");
}

export async function signOutClient() {
  if (hasSupabaseConfig()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/portal/sign-in");
}
