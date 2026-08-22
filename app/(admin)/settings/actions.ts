"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireViewer } from "@/data/auth";
import { createClient } from "@/lib/supabase/server";
import { PASSWORD_MIN } from "@/lib/team/records";
import { isUuid } from "@/lib/projects/validation";
import {
  type SimpleFormState,
  formError,
  formSuccess,
} from "@/lib/projects/form-state";

export async function changeMyPassword(
  _state: SimpleFormState,
  formData: FormData,
): Promise<SimpleFormState> {
  await requireViewer();
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");

  if (password.length < PASSWORD_MIN) {
    return formError(`Use at least ${PASSWORD_MIN} characters.`);
  }
  if (password !== confirmation) {
    return formError("Those two passwords do not match.");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return formError("That password was not accepted. Try a different one.");
  }

  return formSuccess("Password changed.");
}

export async function saveMyNotifications(
  _state: SimpleFormState,
  formData: FormData,
): Promise<SimpleFormState> {
  await requireViewer();

  const supabase = await createClient();
  const { error } = await supabase.rpc("app_update_my_notifications", {
    milestones: formData.get("notifyMilestones") === "on",
    weekly: formData.get("notifyWeeklySummary") === "on",
  });

  if (error) return formError("Those preferences could not be saved.");

  revalidatePath("/settings");
  return formSuccess("Saved.");
}

export async function signOutEverywhere() {
  await requireViewer();
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "global" });
  redirect("/login?reason=signed-out");
}

export async function revokeSession(formData: FormData) {
  await requireViewer();
  const sessionId = String(formData.get("sessionId") ?? "");
  if (!isUuid(sessionId)) return;

  const supabase = await createClient();
  await supabase.rpc("app_revoke_my_session", { target_session_id: sessionId });

  revalidatePath("/settings");
}
