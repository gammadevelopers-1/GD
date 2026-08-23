"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { adminConfigured, adminRpc } from "@/lib/supabase/admin";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { hashIp } from "@/lib/audit/rate-limit";

export type PortalAuthState = { error?: string };

async function clientIp() {
  const headerList = await headers();
  const forwarded = headerList.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

async function recordAttempt(
  email: string,
  ipKey: string,
  succeeded: boolean,
) {
  await adminRpc("app_client_signin_record", {
    email_key: email,
    ip_key: ipKey,
    succeeded,
  });
}

export async function signIn(
  _state: PortalAuthState,
  formData: FormData,
): Promise<PortalAuthState> {
  if (!hasSupabaseConfig() || !adminConfigured()) {
    return { error: "Sign-in is not available yet." };
  }

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  const supabase = await createClient();
  const ipKey = hashIp(await clientIp());

  const gate = await adminRpc("app_client_signin_gate", {
    email_key: email,
    ip_key: ipKey,
  });

  if (!gate.ok) return { error: "Sign-in is not available yet." };

  const wait = Number(gate.data ?? 0);
  if (wait > 0) {
    return {
      error: `Too many attempts. Try again in ${Math.ceil(wait / 60)} minutes.`,
    };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    await recordAttempt(email, ipKey, false);
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
    await recordAttempt(email, ipKey, false);
    return { error: "That email and password were not accepted." };
  }

  await recordAttempt(email, ipKey, true);
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
