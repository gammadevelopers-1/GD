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
  isEnvKey,
  looksLikeEnvFile,
} from "@/lib/projects/env";
import {
  CredentialKeyError,
  credentialsConfigured,
  sealSecret,
} from "@/lib/credentials/crypto";
import { isCredentialAccess } from "@/lib/credentials/validation";

// ENV variables are credentials, so every value here goes through the same
// sealSecret path and the same app_create_credential function. Nothing in this
// file returns or logs a value.

const ENV_FILE_MAX_BYTES = 1024 * 1024;

function refresh() {
  revalidatePath("/projects/[projectId]", "page");
}

function vaultClosed() {
  return formError(
    "No encryption key is configured, so the vault is closed. Set CREDENTIAL_ENCRYPTION_KEYS first.",
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
  const description = String(formData.get("description") ?? "")
    .trim()
    .slice(0, 300);

  if (!isUuid(projectId)) return formError("That project could not be found.");
  if (!name) return formError("Give the container a name, like “Frontend ENV”.");

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
    description: description || null,
    position: (Number(last?.position ?? -1) || 0) + (last ? 1 : 0),
    created_by: viewer.id,
  });

  if (error) {
    return formError(
      error.code === "23505"
        ? "This project already has a container with that name."
        : "The container could not be created.",
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
  const description = String(formData.get("description") ?? "")
    .trim()
    .slice(0, 300);

  if (!isUuid(projectId) || !isUuid(groupId)) {
    return formError("That container could not be found.");
  }
  if (!name) return formError("A container needs a name.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("app_env_groups")
    .update({ name, description: description || null })
    .eq("id", groupId);

  if (error) {
    return formError(
      error.code === "23505"
        ? "This project already has a container with that name."
        : "The change could not be saved.",
    );
  }

  refresh();
  return formSuccess("Container updated.");
}

// Archiving a container leaves its variables where they are: they keep their
// grants and their audit history, and stay reachable as loose credentials.
export async function setEnvGroupArchived(formData: FormData) {
  await requireRole(["owner"]);
  const projectId = String(formData.get("projectId") ?? "");
  const groupId = String(formData.get("groupId") ?? "");
  const archived = String(formData.get("archived") ?? "") === "1";
  if (!isUuid(projectId) || !isUuid(groupId)) return;

  const supabase = await createClient();
  await supabase
    .from("app_env_groups")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", groupId);

  refresh();
}

// Every variable, however it arrived — typed, pasted or read from a file —
// lands in the vault the same way.
async function storePairs(
  projectId: string,
  groupId: string | null,
  environment: string,
  pairs: Array<{ key: string; value: string; note?: string | null }>,
) {
  const supabase = await createClient();
  const failures: string[] = [];
  let stored = 0;

  for (const pair of pairs) {
    const credentialId = randomUUID();
    let sealed;
    try {
      sealed = sealSecret(pair.value, credentialId);
    } catch (error) {
      failures.push(
        error instanceof CredentialKeyError ? pair.key : `${pair.key}`,
      );
      continue;
    }

    const { error } = await supabase.rpc("app_create_credential", {
      new_id: credentialId,
      target_project_id: projectId,
      new_name: pair.key,
      new_service: null,
      new_environment: environment,
      new_description: pair.note ?? null,
      new_ciphertext: sealed.ciphertext,
      new_nonce: sealed.nonce,
      new_auth_tag: sealed.authTag,
      new_key_version: sealed.keyVersion,
      target_env_group_id: groupId,
    });

    if (error) {
      failures.push(error.code === "23505" ? `${pair.key} (already here)` : pair.key);
      continue;
    }
    stored += 1;
  }

  return { stored, failures };
}

// The composer edits rows in the browser — typed, pasted or read out of a
// file — and posts the finished set. One save for the whole batch.
export async function saveEnvVariables(
  _state: SimpleFormState,
  formData: FormData,
): Promise<SimpleFormState> {
  await requireRole(["owner"]);
  const projectId = String(formData.get("projectId") ?? "");
  const groupId = String(formData.get("groupId") ?? "");
  const environment = String(formData.get("environment") ?? "other");

  if (!isUuid(projectId) || !isUuid(groupId)) {
    return formError("That container could not be found.");
  }
  if (!credentialsConfigured()) return vaultClosed();

  let rows: Array<{ key?: unknown; value?: unknown; note?: unknown }>;
  try {
    rows = JSON.parse(String(formData.get("rows") ?? "[]"));
  } catch {
    return formError("Those variables could not be read.");
  }
  if (!Array.isArray(rows)) return formError("Those variables could not be read.");

  const pairs: Array<{ key: string; value: string; note: string | null }> = [];
  const invalid: string[] = [];

  for (const row of rows) {
    const key = String(row.key ?? "").trim();
    const value = String(row.value ?? "");
    const note = String(row.note ?? "").trim();

    // A row with neither a key nor a value is just an empty line in the form.
    if (!key && !value) continue;
    if (!isEnvKey(key)) {
      invalid.push(key || "(no key)");
      continue;
    }
    if (!value) {
      invalid.push(`${key} (no value)`);
      continue;
    }
    pairs.push({ key, value, note: note ? note.slice(0, 500) : null });
  }

  if (invalid.length) {
    return formError(
      `Fix these first: ${invalid.slice(0, 4).join(", ")}${invalid.length > 4 ? "…" : ""}.`,
    );
  }
  if (!pairs.length) return formError("Add at least one key and value.");
  if (pairs.length > ENV_MAX_PAIRS) {
    return formError(`That is more than ${ENV_MAX_PAIRS} variables in one go.`);
  }

  const seen = new Set<string>();
  for (const pair of pairs) {
    if (seen.has(pair.key)) {
      return formError(`${pair.key} appears twice. Keys are unique per container.`);
    }
    seen.add(pair.key);
  }

  const { stored, failures } = await storePairs(
    projectId,
    groupId,
    environment,
    pairs,
  );

  refresh();

  if (!stored) {
    return formError(
      failures.some((entry) => entry.includes("already here"))
        ? "Every key is already in this container."
        : "Nothing could be stored.",
    );
  }

  return formSuccess(
    failures.length
      ? `${stored} stored · ${failures.length} skipped (${failures.slice(0, 3).join(", ")}).`
      : `${stored} variable${stored === 1 ? "" : "s"} stored.`,
  );
}

// Grants the whole container to one person, one existing per-credential grant
// at a time, so each stays individually revocable.
export async function grantEnvGroupAccess(
  _state: SimpleFormState,
  formData: FormData,
): Promise<SimpleFormState> {
  await requireRole(["owner"]);
  const projectId = String(formData.get("projectId") ?? "");
  const groupId = String(formData.get("groupId") ?? "");
  const profileId = String(formData.get("profileId") ?? "");
  const access = String(formData.get("access") ?? "view");

  if (!isUuid(projectId) || !isUuid(groupId)) {
    return formError("That container could not be found.");
  }
  if (!isUuid(profileId)) return formError("Choose who to grant access to.");
  if (!isCredentialAccess(access)) return formError("Choose view or edit.");

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("app_grant_env_group_access", {
    target_env_group_id: groupId,
    target_profile_id: profileId,
    new_access: access,
  });

  if (error) return formError("Access could not be granted.");

  refresh();
  const count = Number(data ?? 0);
  return formSuccess(
    count
      ? `${count} variable${count === 1 ? "" : "s"} shared. They are notified per variable.`
      : "This container has no variables yet.",
  );
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
    return formError("Choose an ENV file to upload.");
  }
  if (file.size > ENV_FILE_MAX_BYTES) {
    return formError("ENV files are limited to 1MB.");
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
    // Do not leave an orphan object behind if the row could not be written.
    await supabase.storage.from("app-env-files").remove([path]);
    return formError("The file could not be recorded.");
  }

  refresh();
  return formSuccess(`${file.name} uploaded.`);
}

export async function archiveEnvFile(formData: FormData) {
  await requireRole(["owner"]);
  const projectId = String(formData.get("projectId") ?? "");
  const fileId = String(formData.get("fileId") ?? "");
  if (!isUuid(projectId) || !isUuid(fileId)) return;

  const supabase = await createClient();
  await supabase
    .from("app_env_files")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", fileId);

  refresh();
}

// Hands back a short-lived signed URL rather than the contents, so the file
// never passes through the page.
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
