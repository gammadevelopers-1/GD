"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/data/auth";
import { createClient } from "@/lib/supabase/server";
import {
  type SimpleFormState,
  formError,
  formSuccess,
} from "@/lib/projects/form-state";
import { isUuid } from "@/lib/projects/validation";
import {
  ENV_GROUP_NAME_MAX,
  ENV_MAX_PAIRS,
  ENV_NOTE_MAX,
  ENV_VALUE_MAX,
  isEnvKey,
  looksLikeEnvFile,
} from "@/lib/projects/env";
import {
  CredentialKeyError,
  credentialsConfigured,
  openSecret,
  sealSecret,
} from "@/lib/credentials/crypto";
import { ACCESS_LABEL, isCredentialAccess } from "@/lib/credentials/validation";
import { sendEmailQuietly } from "@/lib/notifications/send";

const ENV_FILE_MAX_BYTES = 1024 * 1024;

function refresh() {
  revalidatePath("/projects/[projectId]", "page");
}

function vaultClosed() {
  return formError(
    "No encryption key is configured, so values cannot be stored. Set CREDENTIAL_ENCRYPTION_KEYS first.",
  );
}

export async function createEnvGroup(
  _state: SimpleFormState,
  formData: FormData,
): Promise<SimpleFormState> {
  const viewer = await requireRole(["owner"]);
  const projectId = String(formData.get("projectId") ?? "");
  const name = String(formData.get("name") ?? "")
    .trim()
    .slice(0, ENV_GROUP_NAME_MAX);

  if (!isUuid(projectId)) return formError("That project could not be found.");
  if (!name) return formError("Give the group a name.");

  const supabase = await createClient();
  const { data: last } = await supabase
    .from("app_env_groups")
    .select("position")
    .eq("project_id", projectId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("app_env_groups").insert({
    project_id: projectId,
    name,
    position: last ? Number(last.position ?? 0) + 1 : 0,
    created_by: viewer.id,
  });

  if (error) {
    return formError(
      error.code === "23505"
        ? "This project already has a group with that name."
        : "The group could not be created.",
    );
  }

  refresh();
  return formSuccess(`${name} added.`);
}

export async function renameEnvGroup(
  _state: SimpleFormState,
  formData: FormData,
): Promise<SimpleFormState> {
  await requireRole(["owner"]);
  const projectId = String(formData.get("projectId") ?? "");
  const groupId = String(formData.get("groupId") ?? "");
  const name = String(formData.get("name") ?? "")
    .trim()
    .slice(0, ENV_GROUP_NAME_MAX);

  if (!isUuid(projectId) || !isUuid(groupId)) {
    return formError("That group could not be found.");
  }
  if (!name) return formError("A group needs a name.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("app_env_groups")
    .update({ name })
    .eq("id", groupId);

  if (error) {
    return formError(
      error.code === "23505"
        ? "This project already has a group with that name."
        : "The change could not be saved.",
    );
  }

  refresh();
  return formSuccess("Group renamed.");
}

export async function deleteEnvGroup(
  _state: SimpleFormState,
  formData: FormData,
): Promise<SimpleFormState> {
  await requireRole(["owner"]);
  const projectId = String(formData.get("projectId") ?? "");
  const groupId = String(formData.get("groupId") ?? "");
  if (!isUuid(projectId) || !isUuid(groupId)) {
    return formError("That group could not be found.");
  }

  const supabase = await createClient();

  // A variable must always have a group, so emptying it first is the only way
  // to remove one without stranding what it holds.
  const { count } = await supabase
    .from("app_project_credentials")
    .select("id", { count: "exact", head: true })
    .eq("env_group_id", groupId)
    .is("archived_at", null);

  if (count) {
    return formError(
      `This group still holds ${count} variable${count === 1 ? "" : "s"}. Delete them first.`,
    );
  }

  const { error } = await supabase
    .from("app_env_groups")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", groupId);

  if (error) return formError("The group could not be deleted.");

  refresh();
  return formSuccess("Group deleted.");
}

type IncomingRow = {
  key: string;
  value: string;
  note: string | null;
  replace: boolean;
};

function readRows(raw: string): IncomingRow[] | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!Array.isArray(parsed)) return null;

  const rows: IncomingRow[] = [];
  for (const entry of parsed) {
    const row = entry as Record<string, unknown>;
    const key = String(row.key ?? "").trim();
    const value = String(row.value ?? "");
    const note = String(row.note ?? "").trim();
    if (!key && !value) continue;
    rows.push({
      key,
      value,
      note: note ? note.slice(0, ENV_NOTE_MAX) : null,
      replace: row.replace === true,
    });
  }
  return rows;
}

export async function saveEnvVariables(
  _state: SimpleFormState,
  formData: FormData,
): Promise<SimpleFormState> {
  await requireRole(["owner"]);
  const projectId = String(formData.get("projectId") ?? "");
  const groupId = String(formData.get("groupId") ?? "");

  if (!isUuid(projectId) || !isUuid(groupId)) {
    return formError("That group could not be found.");
  }
  if (!credentialsConfigured()) return vaultClosed();

  const rows = readRows(String(formData.get("rows") ?? "[]"));
  if (!rows) return formError("Those variables could not be read.");

  const invalid: string[] = [];
  const clean: IncomingRow[] = [];

  for (const row of rows) {
    if (!isEnvKey(row.key)) {
      invalid.push(row.key || "(no key)");
      continue;
    }
    if (!row.value) {
      invalid.push(`${row.key} (no value)`);
      continue;
    }
    if (row.value.length > ENV_VALUE_MAX) {
      invalid.push(`${row.key} (value too long)`);
      continue;
    }
    clean.push(row);
  }

  if (invalid.length) {
    return formError(
      `Fix these first: ${invalid.slice(0, 4).join(", ")}${invalid.length > 4 ? "…" : ""}.`,
    );
  }
  if (!clean.length) return formError("Add at least one key and value.");
  if (clean.length > ENV_MAX_PAIRS) {
    return formError(`That is more than ${ENV_MAX_PAIRS} variables in one go.`);
  }

  const seen = new Set<string>();
  for (const row of clean) {
    if (seen.has(row.key)) {
      return formError(`${row.key} appears twice. Keys are unique per group.`);
    }
    seen.add(row.key);
  }

  const supabase = await createClient();

  const { data: existingRows } = await supabase
    .from("app_project_credentials")
    .select("id, name")
    .eq("env_group_id", groupId)
    .is("archived_at", null);

  const existing = new Map(
    (existingRows ?? []).map((row) => [String(row.name), String(row.id)]),
  );

  let created = 0;
  let replaced = 0;
  const failures: string[] = [];

  for (const row of clean) {
    const currentId = existing.get(row.key);

    if (currentId && !row.replace) {
      failures.push(`${row.key} (already here)`);
      continue;
    }

    const credentialId = currentId ?? randomUUID();

    let sealed;
    try {
      sealed = sealSecret(row.value, credentialId);
    } catch {
      failures.push(row.key);
      continue;
    }

    if (currentId) {
      const { data, error } = await supabase.rpc(
        "app_replace_credential_secret",
        {
          target_credential_id: currentId,
          new_ciphertext: sealed.ciphertext,
          new_nonce: sealed.nonce,
          new_auth_tag: sealed.authTag,
          new_key_version: sealed.keyVersion,
        },
      );
      if (error || data !== true) {
        failures.push(row.key);
        continue;
      }
      replaced += 1;
      continue;
    }

    const { error } = await supabase.rpc("app_create_credential", {
      new_id: credentialId,
      target_project_id: projectId,
      new_name: row.key,
      new_service: null,
      new_environment: "other",
      new_description: row.note,
      new_ciphertext: sealed.ciphertext,
      new_nonce: sealed.nonce,
      new_auth_tag: sealed.authTag,
      new_key_version: sealed.keyVersion,
      target_env_group_id: groupId,
    });

    if (error) {
      failures.push(
        error.code === "23505" ? `${row.key} (already here)` : row.key,
      );
      continue;
    }
    created += 1;
  }

  refresh();

  if (!created && !replaced) {
    return formError(
      failures.every((entry) => entry.includes("already here"))
        ? "Every key is already in this group."
        : "Nothing could be stored.",
    );
  }

  const parts: string[] = [];
  if (created) parts.push(`${created} added`);
  if (replaced) parts.push(`${replaced} replaced`);
  if (failures.length) parts.push(`${failures.length} skipped`);

  return formSuccess(`${parts.join(" · ")}.`);
}

export async function updateEnvVariable(
  _state: SimpleFormState,
  formData: FormData,
): Promise<SimpleFormState> {
  await requireRole(["owner", "member"]);
  const projectId = String(formData.get("projectId") ?? "");
  const credentialId = String(formData.get("credentialId") ?? "");
  const key = String(formData.get("key") ?? "").trim();
  const note = String(formData.get("note") ?? "")
    .trim()
    .slice(0, ENV_NOTE_MAX);
  const value = String(formData.get("value") ?? "");

  if (!isUuid(projectId) || !isUuid(credentialId)) {
    return formError("That variable could not be found.");
  }
  if (!isEnvKey(key)) {
    return formError("A key can hold letters, numbers and underscores.");
  }
  if (value.length > ENV_VALUE_MAX) {
    return formError("That value is too long to store.");
  }

  const supabase = await createClient();

  const { error } = await supabase.rpc("app_update_credential_metadata", {
    target_credential_id: credentialId,
    new_name: key,
    new_service: null,
    new_environment: "other",
    new_description: note || null,
  });

  if (error) {
    return formError(
      error.code === "23505"
        ? "This group already has a variable with that key."
        : error.code === "42501"
          ? "You cannot change this variable."
          : "The change could not be saved.",
    );
  }

  // An empty value box means "leave the value alone", so that renaming a key
  // never silently requires retyping the secret.
  if (value) {
    if (!credentialsConfigured()) return vaultClosed();

    let sealed;
    try {
      sealed = sealSecret(value, credentialId);
    } catch (error) {
      return formError(
        error instanceof CredentialKeyError
          ? error.message
          : "That value could not be encrypted.",
      );
    }

    const { data, error: replaceError } = await supabase.rpc(
      "app_replace_credential_secret",
      {
        target_credential_id: credentialId,
        new_ciphertext: sealed.ciphertext,
        new_nonce: sealed.nonce,
        new_auth_tag: sealed.authTag,
        new_key_version: sealed.keyVersion,
      },
    );

    if (replaceError || data !== true) {
      return formError("The key was saved but the value could not be.");
    }

    refresh();
    return formSuccess(`${key} updated.`);
  }

  refresh();
  return formSuccess(`${key} updated.`);
}

export async function deleteEnvVariable(
  _state: SimpleFormState,
  formData: FormData,
): Promise<SimpleFormState> {
  await requireRole(["owner", "member"]);
  const projectId = String(formData.get("projectId") ?? "");
  const credentialId = String(formData.get("credentialId") ?? "");
  if (!isUuid(projectId) || !isUuid(credentialId)) {
    return formError("That variable could not be found.");
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("app_set_credential_archived", {
    target_credential_id: credentialId,
    archived: true,
  });

  if (error) {
    return formError(
      error.code === "42501"
        ? "You cannot delete this variable."
        : "It could not be deleted.",
    );
  }

  refresh();
  return formSuccess("Variable deleted.");
}

export async function grantEnvAccess(
  _state: SimpleFormState,
  formData: FormData,
): Promise<SimpleFormState> {
  const viewer = await requireRole(["owner"]);
  const projectId = String(formData.get("projectId") ?? "");
  const credentialId = String(formData.get("credentialId") ?? "");
  const profileId = String(formData.get("profileId") ?? "");
  const access = String(formData.get("access") ?? "use");

  if (!isUuid(projectId) || !isUuid(credentialId)) {
    return formError("That variable could not be found.");
  }
  if (!isUuid(profileId)) return formError("Choose who to share it with.");
  if (!isCredentialAccess(access)) {
    return formError("Choose see, use or manage.");
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("app_grant_credential_access", {
    target_credential_id: credentialId,
    target_profile_id: profileId,
    access_level: access,
  });

  if (error) {
    return formError(
      error.code === "23514" || error.code === "42501" || error.code === "22023"
        ? error.message
        : "That access could not be granted.",
    );
  }

  await notifyGrant({
    credentialId,
    profileId,
    access,
    grantedBy: viewer.fullName,
  });

  refresh();
  return formSuccess("Access granted.");
}

export async function revokeEnvAccess(formData: FormData) {
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

  refresh();
}

export type CopyResult =
  { ok: true; value: string } | { ok: false; message: string };

export async function copyEnvValue(credentialId: string): Promise<CopyResult> {
  await requireRole(["owner", "member"]);

  if (!isUuid(credentialId)) {
    return { ok: false, message: "That variable could not be found." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("app_read_credential_secret", {
    target_credential_id: credentialId,
  });

  if (error) return { ok: false, message: "That value could not be read." };

  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.allowed) {
    return {
      ok: false,
      message: "You cannot copy this value. The attempt was logged.",
    };
  }
  if (!row.ciphertext) {
    return { ok: false, message: "This variable has no stored value." };
  }

  try {
    return {
      ok: true,
      value: openSecret(
        {
          ciphertext: String(row.ciphertext),
          nonce: String(row.nonce),
          authTag: String(row.auth_tag),
          keyVersion: Number(row.key_version),
        },
        credentialId,
      ),
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof CredentialKeyError
          ? error.message
          : "That value could not be decrypted.",
    };
  }
}

export async function uploadEnvFile(
  _state: SimpleFormState,
  formData: FormData,
): Promise<SimpleFormState> {
  const viewer = await requireRole(["owner"]);
  const projectId = String(formData.get("projectId") ?? "");
  const rawGroup = String(formData.get("groupId") ?? "");
  const groupId = isUuid(rawGroup) ? rawGroup : null;
  const file = formData.get("file");

  if (!isUuid(projectId)) return formError("That project could not be found.");
  if (!(file instanceof File) || !file.size) {
    return formError("Choose a file to upload.");
  }
  if (file.size > ENV_FILE_MAX_BYTES) {
    return formError("Files are limited to 1MB.");
  }
  if (!looksLikeEnvFile(file.name)) {
    return formError("That does not look like a .env file.");
  }

  const supabase = await createClient();
  const safeName = file.name.replace(/[^\w.\-]+/g, "_").slice(-120);
  const path = `${projectId}/${randomUUID()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from("app-env-files")
    .upload(path, file, { contentType: "text/plain", upsert: false });

  if (uploadError) return formError("The file could not be uploaded.");

  const { error } = await supabase.from("app_env_files").insert({
    project_id: projectId,
    env_group_id: groupId,
    file_name: file.name.slice(0, 200),
    storage_path: path,
    byte_size: file.size,
    uploaded_by: viewer.id,
  });

  if (error) {
    await supabase.storage.from("app-env-files").remove([path]);
    return formError("The file could not be recorded.");
  }

  refresh();
  return formSuccess(`${file.name} stored.`);
}

export async function deleteEnvFile(
  _state: SimpleFormState,
  formData: FormData,
): Promise<SimpleFormState> {
  await requireRole(["owner"]);
  const projectId = String(formData.get("projectId") ?? "");
  const fileId = String(formData.get("fileId") ?? "");
  if (!isUuid(projectId) || !isUuid(fileId)) {
    return formError("That file could not be found.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("app_env_files")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", fileId);

  if (error) return formError("The file could not be deleted.");

  refresh();
  return formSuccess("File deleted.");
}

export async function downloadEnvFile(
  _state: SimpleFormState,
  formData: FormData,
): Promise<SimpleFormState & { url?: string }> {
  await requireRole(["owner"]);
  const fileId = String(formData.get("fileId") ?? "");
  if (!isUuid(fileId)) return formError("That file could not be found.");

  const supabase = await createClient();
  const { data: row } = await supabase
    .from("app_env_files")
    .select("storage_path")
    .eq("id", fileId)
    .maybeSingle();

  if (!row?.storage_path) return formError("That file could not be found.");

  const { data, error } = await supabase.storage
    .from("app-env-files")
    .createSignedUrl(String(row.storage_path), 60);

  if (error || !data?.signedUrl) {
    return formError("That file could not be opened.");
  }

  return { ...formSuccess("Link ready."), url: data.signedUrl };
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
    .select("name, project_id")
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

  const level = isCredentialAccess(access)
    ? ACCESS_LABEL[access].toLowerCase()
    : access;

  await sendEmailQuietly({
    to: email,
    subject: `Access to ${credential.name}`,
    body: [
      `Hello ${recipient?.full_name ?? "there"},`,
      "",
      `${grantedBy} gave you "${level}" access to ${credential.name} on ${project?.name ?? "a project"}.`,
      "",
      "It is on the project's Technical tab. Every copy is recorded.",
      "",
      "If you were not expecting this, tell an owner.",
    ].join("\n"),
  });
}

async function recipientEmail(profileId: string) {
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
