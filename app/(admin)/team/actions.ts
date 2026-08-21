"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/data/auth";
import { baseUrl } from "@/lib/invites/base-url";
import { createClient } from "@/lib/supabase/server";
import {
  adminConfigured,
  createInternalAuthUser,
  deleteAuthUser,
  generatePasswordToken,
} from "@/lib/supabase/admin";
import { generatePassword } from "@/lib/portal/password";
import { sendEmail } from "@/lib/notifications/send";
import { buildInviteEmail } from "@/lib/team/invite-email";
import { withInviteLink } from "@/lib/invites/email";
import {
  type TeamFormState,
  readTeamForm,
  teamErrorSummary,
  teamFormError,
  teamFormSuccess,
  validateTeamRecord,
} from "@/lib/team/records";
import {
  type SimpleFormState,
  formError,
  formSuccess,
} from "@/lib/projects/form-state";
import { isUuid } from "@/lib/projects/validation";

export type InviteDraft = {
  profileId: string;
  fullName: string;
  email: string;
  subject: string;
  body: string;
};

export type CreateTeamState = TeamFormState & { draft?: InviteDraft };

export type InviteState = SimpleFormState & { link?: string };

const DOCUMENTS_BUCKET = "app-private-documents";
const DOCUMENT_MAX_BYTES = 10 * 1024 * 1024;
const DOCUMENT_TYPES = ["contract", "id", "certificate", "other"];
const DOCUMENT_MIME = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
];

function refresh(profileId?: string) {
  revalidatePath("/team");
  if (profileId) revalidatePath(`/team/${profileId}`);
}

async function addressIsTaken(email: string) {
  const supabase = await createClient();

  const [profile, clientUser, pendingClient] = await Promise.all([
    supabase.from("app_profiles").select("id").eq("email", email).maybeSingle(),
    supabase
      .from("app_client_users")
      .select("id")
      .eq("email", email)
      .maybeSingle(),
    supabase
      .from("app_client_registrations")
      .select("email")
      .eq("email", email)
      .maybeSingle(),
  ]);

  if (profile.data) return "Someone on the team already uses that address.";
  if (clientUser.data || pendingClient.data) {
    return "That address belongs to a client portal account, so it cannot also be a team account.";
  }
  return null;
}

export async function createTeamMember(
  _state: CreateTeamState,
  formData: FormData,
): Promise<CreateTeamState> {
  const viewer = await requireRole(["owner"]);
  const values = readTeamForm(formData);
  const { errors, parsed } = validateTeamRecord(values);

  if (!parsed) {
    return teamFormError(
      teamErrorSummary(errors) ?? "Check the form.",
      errors,
      values,
    );
  }

  if (!adminConfigured()) {
    return teamFormError(
      "SUPABASE_SECRET_KEY is not set, so accounts cannot be created yet.",
      {},
      values,
    );
  }

  const taken = await addressIsTaken(parsed.email);
  if (taken) return teamFormError(taken, { email: taken }, values);

  const created = await createInternalAuthUser({
    email: parsed.email,
    fullName: parsed.fullName,
    role: parsed.role,
    password: generatePassword(),
  });

  if (!created.ok) {
    return teamFormError(
      created.message.toLowerCase().includes("already")
        ? "An account already exists for that address on another part of the platform."
        : created.message,
      {},
      values,
    );
  }

  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("app_profiles")
    .select("id, role")
    .eq("id", created.id)
    .maybeSingle();

  if (!profile) {
    return teamFormError(
      "That account was not created as an internal account. Nothing was saved.",
      {},
      values,
    );
  }

  const { data: settled, error: profileError } = await supabase
    .from("app_profiles")
    .update({
      full_name: parsed.fullName,
      email: parsed.email,
      role: parsed.role,
      job_title: parsed.jobTitle,
      phone: parsed.phone,
      created_by: viewer.id,
    })
    .eq("id", created.id)
    .select("role")
    .maybeSingle();

  if (profileError || settled?.role !== parsed.role) {
    await supabase
      .from("app_profiles")
      .update({ archived_at: new Date().toISOString(), is_active: false })
      .eq("id", created.id);
    return teamFormError(
      "The account was created but its details could not be saved, so it has been archived. Try again.",
      {},
      values,
    );
  }

  const employment = {
    profile_id: created.id,
    employment_type: parsed.employmentType,
    start_date: parsed.startDate,
    salary_amount: parsed.salaryAmount,
    cnic: parsed.cnic,
    bank_account_title: parsed.bankAccountTitle,
    bank_account_number: parsed.bankAccountNumber,
    bank_name: parsed.bankName,
  };

  const hasEmployment = Object.entries(employment).some(
    ([key, value]) => key !== "profile_id" && value !== null,
  );

  if (hasEmployment) {
    const { error: employmentError } = await supabase
      .from("app_employment_private")
      .upsert(employment, { onConflict: "profile_id" });

    if (employmentError) {
      refresh();
      return teamFormError(
        `${parsed.fullName} was added, but the employment details did not save. Add them from their record.`,
        {},
        null,
      );
    }
  }

  refresh(created.id);

  return {
    ...teamFormSuccess(`${parsed.fullName} was added.`),
    draft: {
      profileId: created.id,
      fullName: parsed.fullName,
      email: parsed.email,
      ...buildInviteEmail({
        fullName: parsed.fullName,
        jobTitle: parsed.jobTitle,
        role: parsed.role,
        invitedBy: viewer.fullName,
      }),
    },
  };
}

export async function updateTeamMember(
  _state: TeamFormState,
  formData: FormData,
): Promise<TeamFormState> {
  const viewer = await requireRole(["owner"]);
  const profileId = String(formData.get("profileId") ?? "");
  if (!isUuid(profileId)) return teamFormError("That person was not found.");

  const values = readTeamForm(formData);
  const { errors, parsed } = validateTeamRecord(values);

  if (!parsed) {
    return teamFormError(
      teamErrorSummary(errors) ?? "Check the form.",
      errors,
      values,
    );
  }

  const supabase = await createClient();
  const { data: current } = await supabase
    .from("app_profiles")
    .select("id, email, role")
    .eq("id", profileId)
    .maybeSingle();

  if (!current) return teamFormError("That person was not found.");

  if (current.email && String(current.email) !== parsed.email) {
    const message = "A sign-in address cannot be changed here.";
    return teamFormError(message, { email: message }, values);
  }

  if (profileId === viewer.id && parsed.role !== current.role) {
    const message = "You cannot change your own role.";
    return teamFormError(message, { role: message }, values);
  }

  const { error: profileError } = await supabase
    .from("app_profiles")
    .update({
      full_name: parsed.fullName,
      role: parsed.role,
      job_title: parsed.jobTitle,
      phone: parsed.phone,
    })
    .eq("id", profileId);

  if (profileError) return teamFormError("Those details could not be saved.");

  const { error: employmentError } = await supabase
    .from("app_employment_private")
    .upsert(
      {
        profile_id: profileId,
        employment_type: parsed.employmentType,
        start_date: parsed.startDate,
        salary_amount: parsed.salaryAmount,
        cnic: parsed.cnic,
        bank_account_title: parsed.bankAccountTitle,
        bank_account_number: parsed.bankAccountNumber,
        bank_name: parsed.bankName,
      },
      { onConflict: "profile_id" },
    );

  if (employmentError) {
    return teamFormError("The employment details could not be saved.");
  }

  refresh(profileId);
  return teamFormSuccess("Saved.");
}

export async function sendInvite(
  _state: InviteState,
  formData: FormData,
): Promise<InviteState> {
  await requireRole(["owner"]);
  const profileId = String(formData.get("profileId") ?? "");
  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!isUuid(profileId)) return formError("That person was not found.");
  if (!subject) return formError("Give the email a subject.");
  if (!body) return formError("The message cannot be empty.");
  if (!adminConfigured()) {
    return formError("SUPABASE_SECRET_KEY is not set, so no link can be made.");
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("app_profiles")
    .select("id, full_name, email, archived_at")
    .eq("id", profileId)
    .maybeSingle();

  if (!profile?.email) {
    return formError("That person has no email address on record.");
  }
  if (profile.archived_at) {
    return formError("That person is archived.");
  }

  const email = String(profile.email);
  const token = await generatePasswordToken(email);
  if (!token.ok) return formError(token.message);

  const link = `${await baseUrl()}/set-password?token=${encodeURIComponent(token.token)}&email=${encodeURIComponent(email)}&id=${profileId}`;

  await supabase
    .from("app_profiles")
    .update({ password_link_pending: true })
    .eq("id", profileId);

  const result = await sendEmail({
    to: email,
    subject,
    body: withInviteLink(body, link),
  });

  if (!result.sent) {
    return {
      ...formError(
        result.reason === "not-configured"
          ? "Email is not configured, so nothing was sent. Send this link yourself."
          : "That email could not be sent. Send this link yourself.",
      ),
      link,
    };
  }

  const { error } = await supabase
    .from("app_profiles")
    .update({ invited_at: new Date().toISOString() })
    .eq("id", profileId);

  if (error) {
    return formSuccess(
      `Sent to ${email}, but the record was not stamped as invited.`,
    );
  }

  refresh(profileId);
  return formSuccess(`Sent to ${email}.`);
}

export async function uploadTeamDocument(
  _state: SimpleFormState,
  formData: FormData,
): Promise<SimpleFormState> {
  const viewer = await requireRole(["owner"]);
  const profileId = String(formData.get("profileId") ?? "");
  const documentType = String(formData.get("documentType") ?? "contract");
  const file = formData.get("file");

  if (!isUuid(profileId)) return formError("That person was not found.");
  if (!DOCUMENT_TYPES.includes(documentType)) {
    return formError("Choose what kind of document this is.");
  }
  if (!(file instanceof File) || !file.size) {
    return formError("Choose a file to upload.");
  }
  if (file.size > DOCUMENT_MAX_BYTES) {
    return formError("Documents are limited to 10MB.");
  }
  if (!DOCUMENT_MIME.includes(file.type)) {
    return formError("Upload a PDF or an image.");
  }

  const supabase = await createClient();
  const safeName = file.name.replace(/[^\w.\-]+/g, "_").slice(-120);
  const path = `${profileId}/${randomUUID()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadError) return formError("The file could not be uploaded.");

  const { error } = await supabase.from("app_documents").insert({
    profile_id: profileId,
    document_type: documentType,
    file_name: file.name.slice(0, 200),
    storage_path: path,
    mime_type: file.type,
    size_bytes: file.size,
    uploaded_by: viewer.id,
  });

  if (error) {
    await supabase.storage.from(DOCUMENTS_BUCKET).remove([path]);
    return formError("The file could not be recorded.");
  }

  refresh(profileId);
  return formSuccess(`${file.name} attached.`);
}

export async function archiveTeamDocument(formData: FormData) {
  await requireRole(["owner"]);
  const profileId = String(formData.get("profileId") ?? "");
  const documentId = String(formData.get("documentId") ?? "");
  if (!isUuid(profileId) || !isUuid(documentId)) return;

  const supabase = await createClient();
  await supabase
    .from("app_documents")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", documentId);

  refresh(profileId);
}

export async function setTeamMemberArchived(formData: FormData) {
  const viewer = await requireRole(["owner"]);
  const profileId = String(formData.get("profileId") ?? "");
  const archived = String(formData.get("archived") ?? "") === "1";
  if (!isUuid(profileId) || profileId === viewer.id) return;

  const supabase = await createClient();
  await supabase
    .from("app_profiles")
    .update({
      archived_at: archived ? new Date().toISOString() : null,
      is_active: !archived,
    })
    .eq("id", profileId);

  refresh(profileId);
}

export async function deleteTeamMember(
  _state: SimpleFormState,
  formData: FormData,
): Promise<SimpleFormState> {
  const viewer = await requireRole(["owner"]);
  const profileId = String(formData.get("profileId") ?? "");

  if (!isUuid(profileId)) return formError("That person was not found.");
  if (profileId === viewer.id) {
    return formError("You cannot delete your own account.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("app_delete_team_member", {
    target: profileId,
  });

  if (error) return formError(error.message);

  const paths = Array.isArray(data) ? data.map(String).filter(Boolean) : [];
  if (paths.length) {
    await supabase.storage.from(DOCUMENTS_BUCKET).remove(paths);
  }

  if (adminConfigured()) await deleteAuthUser(profileId);

  revalidatePath("/team");
  redirect("/team");
}
