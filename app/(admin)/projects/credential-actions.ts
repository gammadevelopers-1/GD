"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/data/auth";
import { createClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/projects/validation";
import {
  type CredentialFormState,
  credentialErrorSummary,
  isCredentialAccess,
  validateCredential,
} from "@/lib/credentials/validation";
import {
  CredentialKeyError,
  credentialsConfigured,
  openSecret,
  sealSecret,
} from "@/lib/credentials/crypto";
import { sendEmailQuietly } from "@/lib/notifications/send";

// Nothing in this file logs, returns or renders a secret value except
// copyCredentialSecret, which hands it straight to the clipboard.

function readCredentialForm(formData: FormData) {
  return {
    name: String(formData.get("name") ?? ""),
    service: String(formData.get("service") ?? ""),
    environment: String(formData.get("environment") ?? "other"),
    description: String(formData.get("description") ?? ""),
    secret: String(formData.get("secret") ?? ""),
  };
}

function fail(message: string): CredentialFormState {
  return { status: "error", message, fieldErrors: {} };
}

export async function createCredential(
  _state: CredentialFormState,
  formData: FormData,
): Promise<CredentialFormState> {
  await requireRole(["owner"]);

  const projectId = String(formData.get("projectId") ?? "");
  if (!isUuid(projectId)) return fail("That project could not be found.");
  if (!credentialsConfigured()) {
    return fail(
      "No encryption key is configured, so the vault is closed. Set CREDENTIAL_ENCRYPTION_KEYS first.",
    );
  }

  const values = readCredentialForm(formData);
  const { errors, parsed } = validateCredential(values, { requireSecret: true });
  if (!parsed) {
    return {
      status: "error",
      message: credentialErrorSummary(errors),
      fieldErrors: errors,
    };
  }

  // Generated here so the id can authenticate the ciphertext.
  const credentialId = randomUUID();

  let sealed;
  try {
    sealed = sealSecret(parsed.secret, credentialId);
  } catch (error) {
    return fail(
      error instanceof CredentialKeyError
        ? error.message
        : "That value could not be encrypted.",
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("app_create_credential", {
    new_id: credentialId,
    target_project_id: projectId,
    new_name: parsed.name,
    new_service: parsed.service,
    new_environment: parsed.environment,
    new_description: parsed.description,
    new_ciphertext: sealed.ciphertext,
    new_nonce: sealed.nonce,
    new_auth_tag: sealed.authTag,
    new_key_version: sealed.keyVersion,
  });

  if (error) {
    if (error.code === "23505") {
      return fail("A credential with that name already exists on this project.");
    }
    return fail(
      error.code === "42501" || error.code === "22023" || error.code === "23503"
        ? error.message
        : "That credential could not be saved.",
    );
  }

  revalidatePath(`/projects/${projectId}`);
  return { status: "success", message: "Credential stored.", fieldErrors: {} };
}

export async function updateCredentialMetadata(
  _state: CredentialFormState,
  formData: FormData,
): Promise<CredentialFormState> {
  await requireRole(["owner"]);

  const projectId = String(formData.get("projectId") ?? "");
  const credentialId = String(formData.get("credentialId") ?? "");
  if (!isUuid(projectId) || !isUuid(credentialId)) {
    return fail("That credential could not be found.");
  }

  const values = readCredentialForm(formData);
  const { errors, parsed } = validateCredential(values, { requireSecret: false });
  if (!parsed) {
    return {
      status: "error",
      message: credentialErrorSummary(errors),
      fieldErrors: errors,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("app_update_credential_metadata", {
    target_credential_id: credentialId,
    new_name: parsed.name,
    new_service: parsed.service,
    new_environment: parsed.environment,
    new_description: parsed.description,
  });

  if (error) {
    return fail(
      error.code === "23505"
        ? "A credential with that name already exists on this project."
        : "Those details could not be saved.",
    );
  }

  revalidatePath(`/projects/${projectId}`);
  return { status: "success", message: "Details updated.", fieldErrors: {} };
}

export async function replaceCredentialSecret(
  _state: CredentialFormState,
  formData: FormData,
): Promise<CredentialFormState> {
  await requireRole(["owner", "member"]);

  const projectId = String(formData.get("projectId") ?? "");
  const credentialId = String(formData.get("credentialId") ?? "");
  if (!isUuid(projectId) || !isUuid(credentialId)) {
    return fail("That credential could not be found.");
  }

  const secret = String(formData.get("secret") ?? "");
  if (!secret) {
    return {
      status: "error",
      message: "One field needs attention.",
      fieldErrors: { secret: "Paste the new value." },
    };
  }

  let sealed;
  try {
    sealed = sealSecret(secret, credentialId);
  } catch (error) {
    return fail(
      error instanceof CredentialKeyError
        ? error.message
        : "That value could not be encrypted.",
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("app_replace_credential_secret", {
    target_credential_id: credentialId,
    new_ciphertext: sealed.ciphertext,
    new_nonce: sealed.nonce,
    new_auth_tag: sealed.authTag,
    new_key_version: sealed.keyVersion,
  });

  if (error) return fail("That value could not be saved.");
  if (data !== true) {
    return fail("You do not have edit access to this credential.");
  }

  revalidatePath(`/projects/${projectId}`);
  return { status: "success", message: "Value replaced.", fieldErrors: {} };
}

export async function setCredentialArchived(formData: FormData) {
  await requireRole(["owner"]);

  const projectId = String(formData.get("projectId") ?? "");
  const credentialId = String(formData.get("credentialId") ?? "");
  const archived = String(formData.get("archived") ?? "") === "true";
  if (!isUuid(projectId) || !isUuid(credentialId)) return;

  const supabase = await createClient();
  await supabase.rpc("app_set_credential_archived", {
    target_credential_id: credentialId,
    archived,
  });

  revalidatePath(`/projects/${projectId}`);
}

export async function grantCredentialAccess(
  _state: CredentialFormState,
  formData: FormData,
): Promise<CredentialFormState> {
  const viewer = await requireRole(["owner"]);

  const projectId = String(formData.get("projectId") ?? "");
  const credentialId = String(formData.get("credentialId") ?? "");
  const profileId = String(formData.get("profileId") ?? "");
  const access = String(formData.get("access") ?? "view");

  if (!isUuid(projectId) || !isUuid(credentialId)) {
    return fail("That credential could not be found.");
  }
  if (!isUuid(profileId)) return fail("Choose who to share it with.");
  if (!isCredentialAccess(access)) return fail("Access is either view or edit.");

  const supabase = await createClient();
  const { error } = await supabase.rpc("app_grant_credential_access", {
    target_credential_id: credentialId,
    target_profile_id: profileId,
    access_level: access,
  });

  if (error) {
    return fail(
      error.code === "23514" || error.code === "42501" || error.code === "22023"
        ? error.message
        : "That access could not be granted.",
    );
  }

  await notifyGrant({ credentialId, profileId, access, grantedBy: viewer.fullName });

  revalidatePath(`/projects/${projectId}`);
  return { status: "success", message: "Access granted.", fieldErrors: {} };
}

export async function revokeCredentialAccess(formData: FormData) {
  await requireRole(["owner"]);

  const projectId = String(formData.get("projectId") ?? "");
  const credentialId = String(formData.get("credentialId") ?? "");
  const profileId = String(formData.get("profileId") ?? "");
  if (!isUuid(projectId) || !isUuid(credentialId) || !isUuid(profileId)) return;

  const supabase = await createClient();
  await supabase.rpc("app_revoke_credential_access", {
    target_credential_id: credentialId,
    target_profile_id: profileId,
  });

  revalidatePath(`/projects/${projectId}`);
}

export type CopyResult =
  | { ok: true; value: string }
  | { ok: false; message: string };

// The one place a plaintext secret exists outside the vault. It is returned to
// the caller for the clipboard and is never rendered, cached or logged.
export async function copyCredentialSecret(
  credentialId: string,
): Promise<CopyResult> {
  await requireRole(["owner", "member"]);

  if (!isUuid(credentialId)) {
    return { ok: false, message: "That credential could not be found." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("app_read_credential_secret", {
    target_credential_id: credentialId,
  });

  if (error) return { ok: false, message: "That credential could not be read." };

  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.allowed) {
    return {
      ok: false,
      message: "You do not have access to this credential. The attempt was logged.",
    };
  }
  if (!row.ciphertext) {
    return { ok: false, message: "That credential has no stored value." };
  }

  try {
    const value = openSecret(
      {
        ciphertext: String(row.ciphertext),
        nonce: String(row.nonce),
        authTag: String(row.auth_tag),
        keyVersion: Number(row.key_version),
      },
      credentialId,
    );
    return { ok: true, value };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof CredentialKeyError
          ? error.message
          : "That credential could not be decrypted.",
    };
  }
}

async function notifyGrant({
  credentialId,
  profileId,
  access,
  grantedBy,
}: {
  credentialId: string;
  profileId: string;
  access: string;
  grantedBy: string;
}) {
  const supabase = await createClient();

  const { data: credential } = await supabase
    .from("app_project_credentials")
    .select("name, environment, project_id")
    .eq("id", credentialId)
    .maybeSingle();

  if (!credential) return;

  const { data: project } = await supabase
    .from("app_projects")
    .select("name")
    .eq("id", credential.project_id)
    .maybeSingle();

  const { data: recipient } = await supabase
    .from("app_profiles")
    .select("full_name")
    .eq("id", profileId)
    .maybeSingle();

  const email = await recipientEmail(profileId);
  if (!email) return;

  // A security signal, not a convenience. The name of the credential is not a
  // secret; its value is, and never appears here.
  await sendEmailQuietly({
    to: email,
    subject: `You now have ${access} access to ${credential.name}`,
    body: [
      `Hello ${recipient?.full_name ?? "there"},`,
      "",
      `${grantedBy} gave you ${access} access to the credential "${credential.name}" (${credential.environment}) on ${project?.name ?? "a project"}.`,
      "",
      "You can copy it from the project's Technical & Credentials tab. Every copy is recorded.",
      "",
      "If you were not expecting this, tell an owner.",
    ].join("\n"),
  });
}

async function recipientEmail(profileId: string) {
  // auth.users is not reachable with the publishable key, so this needs the
  // admin API. Without it configured, the grant still succeeds silently.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const secretKey = process.env.SUPABASE_SECRET_KEY?.trim();
  if (!url || !secretKey) return null;

  try {
    const response = await fetch(`${url}/auth/v1/admin/users/${profileId}`, {
      headers: {
        apikey: secretKey,
        Authorization: `Bearer ${secretKey}`,
      },
    });
    if (!response.ok) return null;
    const user = (await response.json()) as { email?: string };
    return user.email ?? null;
  } catch {
    return null;
  }
}
