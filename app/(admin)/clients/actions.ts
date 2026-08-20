"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/data/auth";
import { createClient } from "@/lib/supabase/server";
import {
  adminConfigured,
  createClientAuthUser,
  deleteAuthUser,
  generatePasswordToken,
  setAuthPassword,
} from "@/lib/supabase/admin";
import { generatePassword } from "@/lib/portal/password";
import { sendEmail } from "@/lib/notifications/send";
import { withInviteLink } from "@/lib/invites/email";
import { buildClientInviteEmail } from "@/lib/clients/invite-email";
import {
  type SimpleFormState,
  formError,
  formSuccess,
} from "@/lib/projects/form-state";
import { isUuid } from "@/lib/projects/validation";

export type ClientInviteState = SimpleFormState & { link?: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_MAX = 160;

function refresh(clientId?: string) {
  revalidatePath("/clients");
  revalidatePath("/projects");
  if (clientId) revalidatePath(`/clients/${clientId}`);
}

async function baseUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(
    /\/$/,
    "",
  );
  if (configured) return configured;

  const headerList = await headers();
  const host = headerList.get("host") ?? "";
  const scheme = host.startsWith("localhost") ? "http" : "https";
  return `${scheme}://${host}`;
}

function readCompany(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "")
      .trim()
      .slice(0, NAME_MAX),
    website: String(formData.get("website") ?? "").trim() || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
  };
}

export async function createClientCompany(
  _state: SimpleFormState,
  formData: FormData,
): Promise<SimpleFormState> {
  await requireRole(["owner"]);
  const values = readCompany(formData);

  if (values.name.length < 2) return formError("Give the client a name.");

  const supabase = await createClient();
  const { error } = await supabase.from("app_clients").insert(values);

  if (error) return formError("That client could not be saved.");

  refresh();
  return formSuccess(`${values.name} was added.`);
}

export async function updateClientCompany(
  _state: SimpleFormState,
  formData: FormData,
): Promise<SimpleFormState> {
  await requireRole(["owner"]);
  const clientId = String(formData.get("clientId") ?? "");
  const values = readCompany(formData);

  if (!isUuid(clientId)) return formError("That client was not found.");
  if (values.name.length < 2) return formError("Give the client a name.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("app_clients")
    .update(values)
    .eq("id", clientId);

  if (error) return formError("Those changes could not be saved.");

  refresh(clientId);
  return formSuccess("Saved.");
}

export async function setClientArchived(formData: FormData) {
  await requireRole(["owner"]);
  const clientId = String(formData.get("clientId") ?? "");
  const archived = String(formData.get("archived") ?? "") === "1";
  if (!isUuid(clientId)) return;

  const supabase = await createClient();
  await supabase
    .from("app_clients")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", clientId);

  refresh(clientId);
}

export async function saveClientContact(
  _state: SimpleFormState,
  formData: FormData,
): Promise<SimpleFormState> {
  await requireRole(["owner"]);
  const clientId = String(formData.get("clientId") ?? "");
  const contactId = String(formData.get("contactId") ?? "");
  const fullName = String(formData.get("fullName") ?? "")
    .trim()
    .slice(0, 120);
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();
  const jobTitle = String(formData.get("jobTitle") ?? "").trim();
  const isPrimary = formData.get("isPrimary") === "on";

  if (!isUuid(clientId)) return formError("That client was not found.");
  if (fullName.length < 2) return formError("Enter the contact's name.");
  if (email && !EMAIL.test(email)) {
    return formError("Enter a valid email address.");
  }

  const supabase = await createClient();
  const row = {
    client_id: clientId,
    full_name: fullName,
    email: email || null,
    phone: phone || null,
    job_title: jobTitle || null,
    is_primary: isPrimary,
  };

  const { error } = contactId
    ? await supabase.from("app_client_contacts").update(row).eq("id", contactId)
    : await supabase.from("app_client_contacts").insert(row);

  if (error) return formError("That contact could not be saved.");

  if (isPrimary) {
    let others = supabase
      .from("app_client_contacts")
      .update({ is_primary: false })
      .eq("client_id", clientId)
      .neq("full_name", fullName);
    if (contactId) others = others.neq("id", contactId);
    await others;
  }

  refresh(clientId);
  return formSuccess(`${fullName} saved.`);
}

export async function archiveClientContact(formData: FormData) {
  await requireRole(["owner"]);
  const clientId = String(formData.get("clientId") ?? "");
  const contactId = String(formData.get("contactId") ?? "");
  if (!isUuid(clientId) || !isUuid(contactId)) return;

  const supabase = await createClient();
  await supabase
    .from("app_client_contacts")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", contactId);

  refresh(clientId);
}

async function addressBelongsToTeam(email: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("app_profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  return Boolean(data);
}

async function ensureClientAccount(
  email: string,
  fullName: string,
  ownerId: string,
): Promise<{ ok: true; id: string } | { ok: false; message: string }> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("app_client_users")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existing?.id) return { ok: true, id: String(existing.id) };

  if (await addressBelongsToTeam(email)) {
    return {
      ok: false,
      message:
        "That address is a Gamma team account, so it cannot also be a client.",
    };
  }

  const { error: pendingError } = await supabase
    .from("app_client_registrations")
    .upsert(
      { email, full_name: fullName, created_by: ownerId },
      { onConflict: "email" },
    );

  if (pendingError)
    return { ok: false, message: "The account could not be prepared." };

  const created = await createClientAuthUser({
    email,
    fullName,
    password: generatePassword(),
  });

  if (!created.ok) {
    await supabase.from("app_client_registrations").delete().eq("email", email);
    return {
      ok: false,
      message: created.message.toLowerCase().includes("already")
        ? "An account already exists for that address on another part of the platform."
        : created.message,
    };
  }

  const { data: account } = await supabase
    .from("app_client_users")
    .select("id")
    .eq("id", created.id)
    .maybeSingle();

  if (!account) {
    await deleteAuthUser(created.id);
    await supabase.from("app_client_registrations").delete().eq("email", email);
    return {
      ok: false,
      message: "That account was not created as a client account.",
    };
  }

  await supabase
    .from("app_client_users")
    .update({ full_name: fullName, created_by: ownerId })
    .eq("id", created.id);

  return { ok: true, id: created.id };
}

export async function inviteClientToProject(
  _state: ClientInviteState,
  formData: FormData,
): Promise<ClientInviteState> {
  const viewer = await requireRole(["owner"]);
  const projectId = String(formData.get("projectId") ?? "");
  const existingAccountId = String(formData.get("clientUserId") ?? "");
  const fullName = String(formData.get("fullName") ?? "")
    .trim()
    .slice(0, 120);
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const canEditMilestones = formData.get("canEditMilestones") === "on";

  if (!isUuid(projectId)) return formError("That project was not found.");
  if (!adminConfigured()) {
    return formError(
      "SUPABASE_SECRET_KEY is not set, so client accounts cannot be created yet.",
    );
  }

  const supabase = await createClient();

  const { data: project } = await supabase
    .from("app_projects")
    .select("id, name")
    .eq("id", projectId)
    .maybeSingle();

  if (!project) return formError("That project was not found.");

  let accountId: string;
  let recipient: string;
  let recipientName: string;

  if (isUuid(existingAccountId)) {
    const { data: account } = await supabase
      .from("app_client_users")
      .select("id, email, full_name")
      .eq("id", existingAccountId)
      .is("archived_at", null)
      .maybeSingle();

    if (!account) return formError("That client account was not found.");
    accountId = String(account.id);
    recipient = String(account.email);
    recipientName = account.full_name ? String(account.full_name) : recipient;
  } else {
    if (!EMAIL.test(email)) return formError("Enter a valid email address.");
    if (fullName.length < 2) return formError("Enter the client's name.");

    const ensured = await ensureClientAccount(email, fullName, viewer.id);
    if (!ensured.ok) return formError(ensured.message);

    accountId = ensured.id;
    recipient = email;
    recipientName = fullName;
  }

  const { error: linkError } = await supabase
    .from("app_project_client_access")
    .upsert(
      {
        project_id: projectId,
        client_user_id: accountId,
        can_edit_milestones: canEditMilestones,
        granted_by: viewer.id,
        granted_at: new Date().toISOString(),
        revoked_at: null,
        revoked_by: null,
      },
      { onConflict: "project_id,client_user_id" },
    );

  if (linkError) return formError("The project could not be linked.");

  const token = await generatePasswordToken(recipient);
  if (!token.ok) return formError(token.message);

  const link = `${await baseUrl()}/set-password?token=${encodeURIComponent(token.token)}&email=${encodeURIComponent(recipient)}&id=${accountId}&kind=client`;

  await supabase
    .from("app_client_users")
    .update({ password_link_pending: true })
    .eq("id", accountId);

  const draft = buildClientInviteEmail({
    fullName: recipientName,
    projectName: String(project.name),
    invitedBy: viewer.fullName,
  });

  const subject = String(formData.get("subject") ?? "").trim() || draft.subject;
  const body = String(formData.get("body") ?? "").trim() || draft.body;

  const result = await sendEmail({
    to: recipient,
    subject,
    body: withInviteLink(body, link),
  });

  if (!result.sent) {
    refresh();
    return {
      ...formError(
        result.reason === "not-configured"
          ? "Email is not configured, so nothing was sent. Send this link yourself."
          : "The invitation could not be sent. Send this link yourself.",
      ),
      link,
    };
  }

  await supabase
    .from("app_client_users")
    .update({ invited_at: new Date().toISOString() })
    .eq("id", accountId);

  refresh();
  return formSuccess(`Invitation sent to ${recipient}.`);
}

export async function setClientAccountArchived(formData: FormData) {
  await requireRole(["owner"]);
  const clientUserId = String(formData.get("clientUserId") ?? "");
  const clientId = String(formData.get("clientId") ?? "");
  const archived = String(formData.get("archived") ?? "") === "1";
  if (!isUuid(clientUserId)) return;

  const supabase = await createClient();
  await supabase
    .from("app_client_users")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", clientUserId);

  refresh(isUuid(clientId) ? clientId : undefined);
}

export async function resetClientPassword(
  _state: ClientInviteState,
  formData: FormData,
): Promise<ClientInviteState> {
  await requireRole(["owner"]);
  const clientUserId = String(formData.get("clientUserId") ?? "");
  if (!isUuid(clientUserId)) return formError("That client was not found.");
  if (!adminConfigured()) return formError("SUPABASE_SECRET_KEY is not set.");

  const supabase = await createClient();
  const { data: account } = await supabase
    .from("app_client_users")
    .select("id, email, full_name")
    .eq("id", clientUserId)
    .is("archived_at", null)
    .maybeSingle();

  if (!account) return formError("That client was not found.");

  const password = generatePassword();
  const reset = await setAuthPassword(clientUserId, password);
  if (!reset.ok) return formError(reset.message);

  await supabase
    .from("app_client_users")
    .update({ password_issued_at: new Date().toISOString() })
    .eq("id", clientUserId);

  refresh();
  return formSuccess("A new password has been generated.");
}

export async function deleteClientAccount(
  _state: SimpleFormState,
  formData: FormData,
): Promise<SimpleFormState> {
  await requireRole(["owner"]);
  const clientUserId = String(formData.get("clientUserId") ?? "");
  const clientId = String(formData.get("clientId") ?? "");
  if (!isUuid(clientUserId)) return formError("That client was not found.");

  const supabase = await createClient();
  const { error } = await supabase.rpc("app_delete_client_account", {
    target: clientUserId,
  });

  if (error) return formError(error.message);

  if (adminConfigured()) await deleteAuthUser(clientUserId);

  refresh(isUuid(clientId) ? clientId : undefined);
  redirect(isUuid(clientId) ? `/clients/${clientId}` : "/clients");
}
