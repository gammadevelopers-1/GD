"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/data/auth";
import { linkBaseMessage, resolveLinkBase } from "@/lib/invites/base-url";
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
import {
  buildClientInviteEmail,
  buildClientReturnEmail,
  withSignInLink,
} from "@/lib/clients/invite-email";
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

function readCompany(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "")
      .trim()
      .slice(0, NAME_MAX),
    website: String(formData.get("website") ?? "").trim() || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
  };
}

function readNewContacts(formData: FormData) {
  const rows: Array<{
    full_name: string;
    email: string | null;
    phone: string | null;
    job_title: string | null;
    is_primary: boolean;
  }> = [];

  for (let index = 0; index < 12; index += 1) {
    const fullName = String(formData.get(`contactName${index}`) ?? "")
      .trim()
      .slice(0, 120);
    if (!fullName) continue;

    const email = String(formData.get(`contactEmail${index}`) ?? "")
      .trim()
      .toLowerCase();

    rows.push({
      full_name: fullName,
      email: email || null,
      phone: String(formData.get(`contactPhone${index}`) ?? "").trim() || null,
      job_title:
        String(formData.get(`contactTitle${index}`) ?? "").trim() || null,
      is_primary: rows.length === 0,
    });
  }

  return rows;
}

export async function createClientCompany(
  _state: SimpleFormState,
  formData: FormData,
): Promise<SimpleFormState> {
  await requireRole(["owner"]);
  const values = readCompany(formData);

  if (values.name.length < 2) return formError("Give the client a name.");

  const contacts = readNewContacts(formData);
  const badEmail = contacts.find(
    (contact) => contact.email && !EMAIL.test(contact.email),
  );
  if (badEmail) {
    return formError(`${badEmail.email} is not a valid email address.`);
  }

  const supabase = await createClient();
  const { data: created, error } = await supabase
    .from("app_clients")
    .insert(values)
    .select("id")
    .maybeSingle();

  if (error || !created) return formError("That client could not be saved.");

  if (contacts.length) {
    const { error: contactError } = await supabase
      .from("app_client_contacts")
      .insert(
        contacts.map((contact) => ({
          ...contact,
          client_id: String(created.id),
        })),
      );

    if (contactError) {
      refresh();
      return formError(
        `${values.name} was added, but the contacts did not save. Add them from the client record.`,
      );
    }
  }

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

type Recipient = { email: string; fullName: string; accountId?: string };

function readRecipients(formData: FormData): Recipient[] {
  const found = new Map<string, Recipient>();

  for (const raw of formData.getAll("contact")) {
    const [email, ...rest] = String(raw).split("|");
    const address = email.trim().toLowerCase();
    if (!EMAIL.test(address)) continue;
    found.set(address, {
      email: address,
      fullName: rest.join("|").trim() || address,
    });
  }

  for (const raw of formData.getAll("accountId")) {
    const value = String(raw);
    if (isUuid(value))
      found.set(value, { email: "", fullName: "", accountId: value });
  }

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const fullName = String(formData.get("fullName") ?? "")
    .trim()
    .slice(0, 120);

  if (email && EMAIL.test(email)) {
    found.set(email, { email, fullName: fullName || email });
  }

  return [...found.values()];
}

async function sendProjectInvite(
  recipient: { id: string; email: string; fullName: string },
  project: { name: string },
  invitedBy: string,
  override: { subject: string; body: string } | null,
  origin: string,
): Promise<
  | { ok: true; returning: boolean }
  | { ok: false; message: string; link?: string }
> {
  const supabase = await createClient();

  const { data: account } = await supabase
    .from("app_client_users")
    .select("activated_at")
    .eq("id", recipient.id)
    .maybeSingle();

  const returning = Boolean(account?.activated_at);

  if (returning) {
    const draft = buildClientReturnEmail({
      fullName: recipient.fullName,
      projectName: project.name,
      invitedBy,
    });
    const result = await sendEmail({
      to: recipient.email,
      subject: override?.subject || draft.subject,
      body: withSignInLink(
        override?.body || draft.body,
        `${origin}/portal/sign-in`,
      ),
    });

    if (!result.sent) {
      return { ok: false, message: recipient.email };
    }
    return { ok: true, returning: true };
  }

  const token = await generatePasswordToken(recipient.email);
  if (!token.ok) return { ok: false, message: recipient.email };

  const link = `${origin}/set-password?token=${encodeURIComponent(token.token)}&email=${encodeURIComponent(recipient.email)}&id=${recipient.id}&kind=client`;

  await supabase
    .from("app_client_users")
    .update({ password_link_pending: true })
    .eq("id", recipient.id);

  const draft = buildClientInviteEmail({
    fullName: recipient.fullName,
    projectName: project.name,
    invitedBy,
  });

  const result = await sendEmail({
    to: recipient.email,
    subject: override?.subject || draft.subject,
    body: withInviteLink(override?.body || draft.body, link),
  });

  if (!result.sent) return { ok: false, message: recipient.email, link };

  await supabase
    .from("app_client_users")
    .update({ invited_at: new Date().toISOString() })
    .eq("id", recipient.id);

  return { ok: true, returning: false };
}

export async function inviteClientToProject(
  _state: ClientInviteState,
  formData: FormData,
): Promise<ClientInviteState> {
  const viewer = await requireRole(["owner"]);
  const projectId = String(formData.get("projectId") ?? "");
  const clientId = String(formData.get("clientId") ?? "");
  const canEditMilestones = formData.get("canEditMilestones") === "on";
  const saveAsContact = formData.get("saveAsContact") === "on";

  if (!isUuid(projectId)) return formError("That project was not found.");
  if (!adminConfigured()) {
    return formError(
      "SUPABASE_SECRET_KEY is not set, so client accounts cannot be created yet.",
    );
  }

  const recipients = readRecipients(formData);
  if (!recipients.length)
    return formError("Choose at least one person to invite.");

  const base = await resolveLinkBase();
  if (!base.ok) return formError(linkBaseMessage(base.reason));

  const supabase = await createClient();

  const { data: project } = await supabase
    .from("app_projects")
    .select("id, name")
    .eq("id", projectId)
    .maybeSingle();

  if (!project) return formError("That project was not found.");

  const override =
    recipients.length === 1 && formData.get("subject")
      ? {
          subject: String(formData.get("subject") ?? "").trim(),
          body: String(formData.get("body") ?? "").trim(),
        }
      : null;

  let sent = 0;
  let returning = 0;
  const failed: string[] = [];
  let fallbackLink: string | undefined;

  for (const recipient of recipients) {
    let resolved: { id: string; email: string; fullName: string };

    if (recipient.accountId) {
      const { data: account } = await supabase
        .from("app_client_users")
        .select("id, email, full_name")
        .eq("id", recipient.accountId)
        .is("archived_at", null)
        .maybeSingle();

      if (!account) {
        failed.push("an account that no longer exists");
        continue;
      }
      resolved = {
        id: String(account.id),
        email: String(account.email),
        fullName: account.full_name
          ? String(account.full_name)
          : String(account.email),
      };
    } else {
      const ensured = await ensureClientAccount(
        recipient.email,
        recipient.fullName,
        viewer.id,
      );
      if (!ensured.ok) {
        failed.push(recipient.email);
        continue;
      }
      resolved = {
        id: ensured.id,
        email: recipient.email,
        fullName: recipient.fullName,
      };

      if (saveAsContact && isUuid(clientId)) {
        await supabase.from("app_client_contacts").insert({
          client_id: clientId,
          full_name: recipient.fullName,
          email: recipient.email,
        });
      }
    }

    const { error: linkError } = await supabase
      .from("app_project_client_access")
      .upsert(
        {
          project_id: projectId,
          client_user_id: resolved.id,
          can_edit_milestones: canEditMilestones,
          granted_by: viewer.id,
          granted_at: new Date().toISOString(),
          revoked_at: null,
          revoked_by: null,
        },
        { onConflict: "project_id,client_user_id" },
      );

    if (linkError) {
      failed.push(resolved.email);
      continue;
    }

    const outcome = await sendProjectInvite(
      resolved,
      { name: String(project.name) },
      viewer.fullName,
      override,
      base.origin,
    );

    if (outcome.ok) {
      sent += 1;
      if (outcome.returning) returning += 1;
    } else {
      failed.push(outcome.message);
      if (outcome.link) fallbackLink = outcome.link;
    }
  }

  refresh(isUuid(clientId) ? clientId : undefined);

  if (!sent) {
    return {
      ...formError(
        `Nothing was sent to ${failed.join(", ")}. Send the link yourself.`,
      ),
      link: fallbackLink,
    };
  }

  const parts = [
    `${sent} invitation${sent === 1 ? "" : "s"} sent`,
    returning
      ? `${returning} already had a password and were sent a sign-in link`
      : null,
    failed.length ? `${failed.join(", ")} failed` : null,
  ].filter(Boolean);

  return failed.length
    ? { ...formError(parts.join(". ") + "."), link: fallbackLink }
    : formSuccess(parts.join(". ") + ".");
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
