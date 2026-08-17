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
  parseEnvBlob,
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

function refresh(projectId: string) {
  revalidatePath(`/projects/${projectId}`);
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

  refresh(projectId);
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

  refresh(projectId);
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

  refresh(projectId);
}

// One key at a time, or many at once from a pasted file. Both land in the
// vault the same way.
async function storePairs(
  projectId: string,
  groupId: string | null,
  environment: string,
  pairs: Array<{ key: string; value: string }>,
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
      new_description: null,
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

export async function addEnvVariable(
  _state: SimpleFormState,
  formData: FormData,
): Promise<SimpleFormState> {
  await requireRole(["owner"]);
  const projectId = String(formData.get("projectId") ?? "");
  const groupId = String(formData.get("groupId") ?? "");
  const key = String(formData.get("key") ?? "").trim();
  const value = String(formData.get("value") ?? "");
  const environment = String(formData.get("environment") ?? "other");

  if (!isUuid(projectId) || !isUuid(groupId)) {
    return formError("That container could not be found.");
  }
  if (!credentialsConfigured()) return vaultClosed();
  if (!isEnvKey(key)) {
    return formError("Use letters, digits and underscores, not starting with a digit.");
  }
  if (!value) return formError("Give the variable a value.");

  const { stored, failures } = await storePairs(projectId, groupId, environment, [
    { key, value },
  ]);

  if (!stored) {
    return formError(
      failures[0]?.includes("already here")
        ? "That key is already in this container."
        : "The variable could not be saved.",
    );
  }

  refresh(projectId);
  return formSuccess(`${key} stored.`);
}

// Vercel-style import: paste a file, get one encrypted credential per key.
export async function importEnvBlob(
  _state: SimpleFormState,
  formData: FormData,
): Promise<SimpleFormState> {
  await requireRole(["owner"]);
  const projectId = String(formData.get("projectId") ?? "");
  const groupId = String(formData.get("groupId") ?? "");
  const environment = String(formData.get("environment") ?? "other");
  const blob = String(formData.get("blob") ?? "");

  if (!isUuid(projectId) || !isUuid(groupId)) {
    return formError("That container could not be found.");
  }
  if (!credentialsConfigured()) return vaultClosed();
  if (!blob.trim()) return formError("Paste the contents of an ENV file.");

  const { pairs, skipped } = parseEnvBlob(blob);
  if (!pairs.length) {
    return formError(
      skipped.length
        ? `Nothing could be read. First problem: line ${skipped[0].line}, ${skipped[0].reason}.`
        : "No KEY=value pairs were found.",
    );
  }
  if (pairs.length > ENV_MAX_PAIRS) {
    return formError(`That is more than ${ENV_MAX_PAIRS} variables in one go.`);
  }

  const { stored, failures } = await storePairs(
    projectId,
    groupId,
    environment,
    pairs,
  );

  refresh(projectId);

  if (!stored) return formError("Nothing could be stored.");

  const notes: string[] = [`${stored} variable${stored === 1 ? "" : "s"} stored`];
  if (failures.length) notes.push(`${failures.length} skipped (${failures.slice(0, 3).join(", ")})`);
  if (skipped.length) notes.push(`${skipped.length} line${skipped.length === 1 ? "" : "s"} ignored`);
  return formSuccess(`${notes.join(" · ")}.`);
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

  refresh(projectId);
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

  refresh(projectId);
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

  refresh(projectId);
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
