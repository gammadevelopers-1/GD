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
  ENV_VALUE_MAX,
  isEnvKey,
  parseEnvBlob,
} from "@/lib/projects/env";
import {
  CredentialKeyError,
  credentialsConfigured,
  digestSecret,
  openSecret,
  sealSecret,
} from "@/lib/credentials/crypto";

function refresh() {
  revalidatePath("/projects/[projectId]", "layout");
}

function vaultClosed() {
  return formError(
    "No encryption key is configured, so values cannot be stored. Set CREDENTIAL_ENCRYPTION_KEYS first.",
  );
}

export async function createMyCopy(
  _state: SimpleFormState,
  formData: FormData,
): Promise<SimpleFormState> {
  await requireRole(["owner", "member"]);

  const projectId = String(formData.get("projectId") ?? "");
  const name = String(formData.get("name") ?? "").trim();

  if (!isUuid(projectId)) return formError("That project could not be found.");
  if (!name || name.length > ENV_GROUP_NAME_MAX) {
    return formError(
      `Give the copy a name of up to ${ENV_GROUP_NAME_MAX} characters.`,
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("app_create_personal_env_group", {
    target_project_id: projectId,
    new_name: name,
  });

  if (error) {
    return formError(
      error.code === "23505"
        ? "You already have a copy with that name."
        : "That copy could not be created.",
    );
  }

  refresh();
  return formSuccess(`${name} created.`);
}

export async function saveMyVariables(
  _state: SimpleFormState,
  formData: FormData,
): Promise<SimpleFormState> {
  await requireRole(["owner", "member"]);
  if (!credentialsConfigured()) return vaultClosed();

  const groupId = String(formData.get("groupId") ?? "");
  if (!isUuid(groupId)) return formError("That copy could not be found.");

  const single = String(formData.get("key") ?? "").trim();
  const pairs = single
    ? [{ key: single, value: String(formData.get("value") ?? "") }]
    : parseEnvBlob(String(formData.get("blob") ?? "")).pairs;

  if (!pairs.length) return formError("Nothing to save.");

  const supabase = await createClient();
  let saved = 0;

  for (const pair of pairs) {
    if (!isEnvKey(pair.key) || pair.value.length > ENV_VALUE_MAX) continue;

    const id = randomUUID();
    try {
      const sealed = sealSecret(pair.value, id);
      const digest = digestSecret(pair.value);
      const { error } = await supabase.rpc("app_save_personal_env_variable", {
        new_id: id,
        target_env_group_id: groupId,
        new_name: pair.key,
        new_ciphertext: sealed.ciphertext,
        new_nonce: sealed.nonce,
        new_auth_tag: sealed.authTag,
        new_key_version: sealed.keyVersion,
        new_digest: digest,
      });
      if (!error) saved += 1;
    } catch (error) {
      if (error instanceof CredentialKeyError) return formError(error.message);
      return formError("That value could not be stored.");
    }
  }

  if (!saved) return formError("Nothing was saved.");

  refresh();
  return formSuccess(saved === 1 ? "Saved." : `${saved} variables saved.`);
}

export async function removeMyVariable(formData: FormData) {
  await requireRole(["owner", "member"]);

  const credentialId = String(formData.get("credentialId") ?? "");
  if (!isUuid(credentialId)) return;

  const supabase = await createClient();
  await supabase.rpc("app_archive_personal_env_variable", {
    target_credential_id: credentialId,
  });

  refresh();
}

export async function adoptIntoMain(
  _state: SimpleFormState,
  formData: FormData,
): Promise<SimpleFormState> {
  await requireRole(["owner"]);
  if (!credentialsConfigured()) return vaultClosed();

  const mainGroupId = String(formData.get("mainGroupId") ?? "");
  const sourceId = String(formData.get("sourceCredentialId") ?? "");

  if (!isUuid(mainGroupId) || !isUuid(sourceId)) {
    return formError("That value could not be found.");
  }

  const supabase = await createClient();

  const { data: targetId, error: targetError } = await supabase.rpc(
    "app_env_main_target",
    {
      target_main_group_id: mainGroupId,
      from_credential_id: sourceId,
      fallback_id: randomUUID(),
    },
  );

  if (targetError || !targetId) {
    return formError("That value could not be placed in main.");
  }

  const { data: readRows, error: readError } = await supabase.rpc(
    "app_read_credential_secret",
    { target_credential_id: sourceId },
  );

  const row = Array.isArray(readRows) ? readRows[0] : readRows;
  if (readError || !row?.allowed || !row.ciphertext) {
    return formError("That value could not be read.");
  }

  try {
    const plaintext = openSecret(
      {
        ciphertext: String(row.ciphertext),
        nonce: String(row.nonce),
        authTag: String(row.auth_tag),
        keyVersion: Number(row.key_version),
      },
      sourceId,
    );

    const resealed = sealSecret(plaintext, String(targetId));
    const digest = digestSecret(plaintext);

    const { error } = await supabase.rpc("app_env_adopt_value", {
      target_credential_id: String(targetId),
      from_credential_id: sourceId,
      new_ciphertext: resealed.ciphertext,
      new_nonce: resealed.nonce,
      new_auth_tag: resealed.authTag,
      new_key_version: resealed.keyVersion,
      new_digest: digest,
    });

    if (error) return formError("Main could not be updated.");
  } catch (error) {
    if (error instanceof CredentialKeyError) return formError(error.message);
    return formError("That value could not be adopted.");
  }

  refresh();
  return formSuccess("Main updated.");
}
