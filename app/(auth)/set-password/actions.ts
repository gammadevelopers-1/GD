"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { PASSWORD_MIN } from "@/lib/team/records";

export type SetPasswordState = { error?: string; spent?: boolean };

export async function setPassword(
  _state: SetPasswordState,
  formData: FormData,
): Promise<SetPasswordState> {
  if (!hasSupabaseConfig()) {
    return { error: "Supabase has not been connected yet." };
  }

  const token = String(formData.get("token") ?? "");
  const isClient = String(formData.get("kind") ?? "") === "client";
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");

  if (!token) {
    return {
      error: "That link is incomplete. Ask an owner to send you a new one.",
    };
  }
  if (password.length < PASSWORD_MIN) {
    return { error: `Use at least ${PASSWORD_MIN} characters.` };
  }
  if (password !== confirmation) {
    return { error: "Those two passwords do not match." };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.verifyOtp({
    type: "recovery",
    token_hash: token,
  });

  if (error || !data.user) {
    return {
      error:
        "This link has already been used or has expired. If you have set your password, sign in below. Otherwise ask an owner to send a new one.",
      spent: true,
    };
  }

  const account = isClient
    ? await supabase
        .from("app_client_users")
        .select("id")
        .eq("id", data.user.id)
        .is("archived_at", null)
        .maybeSingle()
    : await supabase
        .from("app_profiles")
        .select("id")
        .eq("id", data.user.id)
        .eq("is_active", true)
        .is("archived_at", null)
        .maybeSingle();

  if (!account.data) {
    await supabase.auth.signOut();
    return {
      error: isClient
        ? "This account no longer has portal access. Ask your Gamma contact for a new invitation."
        : "This account is not active on the internal platform. Ask an owner for access.",
    };
  }

  const { error: passwordError } = await supabase.auth.updateUser({ password });

  if (passwordError) {
    return { error: "That password was not accepted. Try a different one." };
  }

  await supabase.rpc(
    isClient ? "app_client_password_set" : "app_member_activated",
  );
  await supabase.auth.signOut();

  redirect(
    isClient ? "/portal/sign-in?reason=password-set" : "/login?reason=password-set",
  );
}
