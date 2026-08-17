#!/usr/bin/env node
// Credential encryption key tooling for Chunk 9.
//
//   node scripts/credential-key.mjs generate      print a new key
//   node scripts/credential-key.mjs check         prove the configured ring works
//   node scripts/credential-key.mjs rotate        re-encrypt every stored value
//
// Uses lib/credentials/aes.mjs — the same code the application runs, so a
// rotation can never drift from the format the app expects.
//
// Reading and writing app_credential_secrets needs a direct postgres
// connection: no Supabase role, service key included, has any privilege on
// that table. Set DATABASE_URL, or leave it unset to use the local stack.

import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { openWithKey, parseKey, sealWithKey } from "../lib/credentials/aes.mjs";

const BASE64 = /^[A-Za-z0-9+/=]+$/;
const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function loadEnvFile() {
  // Mirrors what Next.js reads, so the script sees the same keys the app does.
  try {
    const raw = execFileSync("cat", [".env.local"], { encoding: "utf8" });
    for (const line of raw.split("\n")) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!match) continue;
      const [, name, value] = match;
      if (process.env[name] === undefined) {
        process.env[name] = value.replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    // No .env.local is fine — the environment may already carry the keys.
  }
}

function keyRing() {
  const ring = new Map();
  const multi = process.env.CREDENTIAL_ENCRYPTION_KEYS?.trim();

  if (multi) {
    const parsed = JSON.parse(multi);
    for (const [version, value] of Object.entries(parsed)) {
      ring.set(Number(version), parseKey(value, `Key version ${version}`));
    }
  }

  const single = process.env.CREDENTIAL_ENCRYPTION_KEY?.trim();
  if (single && !ring.size) {
    ring.set(1, parseKey(single, "CREDENTIAL_ENCRYPTION_KEY"));
  }

  if (!ring.size) {
    console.error(
      "No key configured. Set CREDENTIAL_ENCRYPTION_KEYS, for example:\n" +
        `  CREDENTIAL_ENCRYPTION_KEYS='{"1":"${randomBytes(32).toString("base64")}"}'`,
    );
    process.exit(1);
  }
  return ring;
}

function activeVersion(ring) {
  const requested = process.env.CREDENTIAL_ENCRYPTION_KEY_VERSION?.trim();
  if (requested) {
    const version = Number(requested);
    if (!ring.has(version)) {
      console.error(
        `CREDENTIAL_ENCRYPTION_KEY_VERSION is ${requested}, but no key of that version is configured.`,
      );
      process.exit(1);
    }
    return version;
  }
  return Math.max(...ring.keys());
}

function localContainer() {
  const name = execFileSync(
    "docker",
    ["ps", "--filter", "name=supabase_db_", "--format", "{{.Names}}"],
    { encoding: "utf8" },
  )
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)[0];

  if (!name) {
    console.error(
      "No DATABASE_URL, and no local Supabase database container is running.",
    );
    process.exit(1);
  }
  return name;
}

function sql(statement) {
  const url = process.env.DATABASE_URL?.trim();
  if (url) {
    return execFileSync(
      "psql",
      [url, "-v", "ON_ERROR_STOP=1", "-At", "-c", statement],
      { encoding: "utf8" },
    );
  }
  return execFileSync(
    "docker",
    [
      "exec",
      "-i",
      localContainer(),
      "psql",
      "-v",
      "ON_ERROR_STOP=1",
      "-At",
      "-U",
      "postgres",
      "-d",
      "postgres",
      "-c",
      statement,
    ],
    { encoding: "utf8" },
  );
}

function generate() {
  const key = randomBytes(32).toString("base64");
  console.log(`\nNew credential encryption key:\n\n  ${key}\n`);
  console.log("Add it as the next version, keeping the old one so existing");
  console.log("values still open. For a first key:\n");
  console.log(`  CREDENTIAL_ENCRYPTION_KEYS={"1":"${key}"}\n`);
  console.log("Store it in the deployment's environment and in the key");
  console.log("custodian's password manager. It is not in the database, and");
  console.log("losing every copy means losing every stored credential.\n");
}

function check() {
  const ring = keyRing();
  const version = activeVersion(ring);
  const credentialId = "00000000-0000-4000-8000-000000000001";
  const sample = "gd-credential-self-check";

  const sealed = sealWithKey(sample, ring.get(version), credentialId);
  const opened = openWithKey(sealed, ring.get(version), credentialId);

  if (opened !== sample) {
    console.error("FAIL round trip did not return the original value");
    process.exit(1);
  }
  console.log(`  ok   round trip with key version ${version}`);

  // A row moved onto another credential must fail, not decrypt.
  let rejected = false;
  try {
    openWithKey(sealed, ring.get(version), "00000000-0000-4000-8000-000000000002");
  } catch {
    rejected = true;
  }
  if (!rejected) {
    console.error("FAIL a value decrypted under the wrong credential id");
    process.exit(1);
  }
  console.log("  ok   a value moved to another credential does not decrypt");

  for (const known of ring.keys()) {
    console.log(`  ok   key version ${known} loaded`);
  }
  console.log(`\nActive version for new writes: ${version}\n`);
}

function rotate() {
  const ring = keyRing();
  const target = activeVersion(ring);

  const raw = sql(
    `select coalesce(json_agg(row_to_json(t)), '[]')::text from (
       select credential_id, ciphertext, nonce, auth_tag, key_version
       from public.app_credential_secrets
       where key_version <> ${target}
     ) t`,
  ).trim();

  const rows = JSON.parse(raw || "[]");
  if (!rows.length) {
    console.log(`\nNothing to rotate. Every value is already on key version ${target}.\n`);
    return;
  }

  console.log(`\nRe-encrypting ${rows.length} value(s) onto key version ${target}.\n`);
  const statements = [];
  let failures = 0;

  for (const row of rows) {
    const id = String(row.credential_id);
    if (!UUID.test(id)) {
      console.error(`  FAIL ${id} — not a credential id`);
      failures += 1;
      continue;
    }

    const oldKey = ring.get(Number(row.key_version));
    if (!oldKey) {
      console.error(
        `  FAIL ${id} — encrypted with key version ${row.key_version}, which is not in the ring. Add that key before rotating.`,
      );
      failures += 1;
      continue;
    }

    let plaintext;
    try {
      plaintext = openWithKey(
        {
          ciphertext: row.ciphertext,
          nonce: row.nonce,
          authTag: row.auth_tag,
        },
        oldKey,
        id,
      );
    } catch {
      console.error(`  FAIL ${id} — could not be decrypted, left untouched`);
      failures += 1;
      continue;
    }

    const sealed = sealWithKey(plaintext, ring.get(target), id);
    const verified = openWithKey(sealed, ring.get(target), id);
    if (verified !== plaintext) {
      console.error(`  FAIL ${id} — re-encrypted value did not verify`);
      failures += 1;
      continue;
    }

    if (
      !BASE64.test(sealed.ciphertext) ||
      !BASE64.test(sealed.nonce) ||
      !BASE64.test(sealed.authTag)
    ) {
      console.error(`  FAIL ${id} — unexpected characters in the new ciphertext`);
      failures += 1;
      continue;
    }

    statements.push(
      `update public.app_credential_secrets set ciphertext = '${sealed.ciphertext}', nonce = '${sealed.nonce}', auth_tag = '${sealed.authTag}', key_version = ${target}, updated_at = now() where credential_id = '${id}';`,
    );
    console.log(`  ok   ${id}`);
  }

  if (failures) {
    console.error(
      `\n${failures} value(s) could not be rotated. Nothing has been written.\n`,
    );
    process.exit(1);
  }

  // One transaction: either every value moves to the new key or none does.
  sql(`begin;\n${statements.join("\n")}\ncommit;`);
  console.log(
    `\nDone. ${statements.length} value(s) now use key version ${target}.` +
      `\nKeep the previous key until a backup taken before today is no longer needed.\n`,
  );
}

loadEnvFile();

const command = process.argv[2] ?? "check";
if (command === "generate") generate();
else if (command === "check") check();
else if (command === "rotate") rotate();
else {
  console.error(`Unknown command "${command}". Use generate, check or rotate.`);
  process.exit(1);
}
