"use server";

import { revalidatePath } from "next/cache";
import {
  linkBaseMessage,
  resolveLinkBase,
} from "@/lib/invites/base-url";
import { requireRole } from "@/data/auth";
import { createClient } from "@/lib/supabase/server";
import {
  adminConfigured,
  createClientAuthUser,
  deleteAuthUser,
  setAuthPassword,
} from "@/lib/supabase/admin";
import {
  type SimpleFormState,
  formError,
  formSuccess,
} from "@/lib/projects/form-state";
import { isUuid } from "@/lib/projects/validation";
import { generatePassword } from "@/lib/portal/password";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type IssuedAccess = {
  name: string;
  email: string;
  password: string;
  url: string;
};

export type ShareState = SimpleFormState & { issued?: IssuedAccess };

function refresh() {
  revalidatePath("/projects/[projectId]", "layout");
}

export async function shareWithClient(
  _state: ShareState,
  formData: FormData,
): Promise<ShareState> {
  const viewer = await requireRole(["owner"]);
  const projectId = String(formData.get("projectId") ?? "");
  const publicId = String(formData.get("publicId") ?? "");
  const fullName = String(formData.get("fullName") ?? "")
    .trim()
    .slice(0, 120);
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const canEditMilestones = formData.get("canEditMilestones") === "on";

  if (!isUuid(projectId)) return formError("That project could not be found.");
  if (!fullName) return formError("Enter the client's name.");
  if (!EMAIL.test(email)) return formError("Enter a valid email address.");
  if (!adminConfigured()) {
    return formError(
      "SUPABASE_SECRET_KEY is not set, so client accounts cannot be created yet.",
    );
  }

  const base = await resolveLinkBase();
  if (!base.ok) return formError(linkBaseMessage(base.reason));

  const supabase = await createClient();
  const password = generatePassword();

  const { data: existing } = await supabase
    .from("app_client_users")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  let clientUserId = existing?.id ? String(existing.id) : null;

  if (clientUserId) {
    const reset = await setAuthPassword(clientUserId, password);
    if (!reset.ok) return formError(reset.message);
  } else {
    const { error: pendingError } = await supabase
      .from("app_client_registrations")
      .upsert(
        { email, full_name: fullName, created_by: viewer.id },
        { onConflict: "email" },
      );

    if (pendingError) return formError("The account could not be prepared.");

    const created = await createClientAuthUser({ email, fullName, password });

    if (!created.ok) {
      await supabase
        .from("app_client_registrations")
        .delete()
        .eq("email", email);
      return formError(
        created.message.toLowerCase().includes("already")
          ? "An account already exists for that address on another part of the platform."
          : created.message,
      );
    }
    clientUserId = created.id;

    const { data: account } = await supabase
      .from("app_client_users")
      .select("id")
      .eq("id", clientUserId)
      .maybeSingle();

    if (!account) {
      await deleteAuthUser(clientUserId);
      await supabase
        .from("app_client_registrations")
        .delete()
        .eq("email", email);
      return formError(
        "That account was not created as a client account. Nothing was shared.",
      );
    }
  }

  const { error: accountError } = await supabase
    .from("app_client_users")
    .update({
      full_name: fullName,
      password_issued_at: new Date().toISOString(),
      created_by: viewer.id,
    })
    .eq("id", clientUserId);

  if (accountError) return formError("The account could not be prepared.");

  const { error: linkError } = await supabase
    .from("app_project_client_access")
    .upsert(
      {
        project_id: projectId,
        client_user_id: clientUserId,
        can_edit_milestones: canEditMilestones,
        granted_by: viewer.id,
        granted_at: new Date().toISOString(),
        revoked_at: null,
        revoked_by: null,
      },
      { onConflict: "project_id,client_user_id" },
    );

  if (linkError) return formError("The project could not be linked.");

  refresh();
  return {
    ...formSuccess(`${fullName} can now sign in.`),
    issued: {
      name: fullName,
      email,
      password,
      url: `${base.origin}/portal/${publicId}`,
    },
  };
}

export async function regenerateClientPassword(
  _state: ShareState,
  formData: FormData,
): Promise<ShareState> {
  await requireRole(["owner"]);
  const clientUserId = String(formData.get("clientUserId") ?? "");
  const publicId = String(formData.get("publicId") ?? "");
  if (!isUuid(clientUserId)) {
    return formError("That client could not be found.");
  }
  if (!adminConfigured()) {
    return formError("SUPABASE_SECRET_KEY is not set.");
  }

  const base = await resolveLinkBase();
  if (!base.ok) return formError(linkBaseMessage(base.reason));

  const supabase = await createClient();
  const { data: account } = await supabase
    .from("app_client_users")
    .select("full_name, email")
    .eq("id", clientUserId)
    .maybeSingle();

  if (!account) return formError("That client could not be found.");

  const password = generatePassword();
  const reset = await setAuthPassword(clientUserId, password);
  if (!reset.ok) return formError(reset.message);

  const { error } = await supabase
    .from("app_client_users")
    .update({ password_issued_at: new Date().toISOString() })
    .eq("id", clientUserId);

  if (error) return formError("The account could not be updated.");

  refresh();
  return {
    ...formSuccess("A new password has been generated."),
    issued: {
      name: String(account.full_name ?? ""),
      email: String(account.email),
      password,
      url: `${base.origin}/portal/${publicId}`,
    },
  };
}

export async function setClientMilestoneEditing(formData: FormData) {
  await requireRole(["owner"]);
  const accessId = String(formData.get("accessId") ?? "");
  const enabled = String(formData.get("enabled") ?? "") === "1";
  if (!isUuid(accessId)) return;

  const supabase = await createClient();
  await supabase
    .from("app_project_client_access")
    .update({ can_edit_milestones: enabled })
    .eq("id", accessId);

  refresh();
}

export async function revokeClientAccess(formData: FormData) {
  const viewer = await requireRole(["owner"]);
  const accessId = String(formData.get("accessId") ?? "");
  if (!isUuid(accessId)) return;

  const supabase = await createClient();
  await supabase
    .from("app_project_client_access")
    .update({ revoked_at: new Date().toISOString(), revoked_by: viewer.id })
    .eq("id", accessId);

  refresh();
}
