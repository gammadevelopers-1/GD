import "server-only";

import { timingSafeEqual } from "node:crypto";
import {
  KEY_BYTES,
  openWithKey,
  parseKey,
  sealWithKey,
} from "@/lib/credentials/aes.mjs";

// AES-256-GCM, with the key held in the environment and never in Supabase.
// A full dump of the database yields ciphertext and nothing else.
//
// The format itself lives in aes.mjs so the rotation script runs exactly the
// same code. This module is the key ring around it.

export type SealedSecret = {
  ciphertext: string;
  nonce: string;
  authTag: string;
  keyVersion: number;
};

export class CredentialKeyError extends Error {}

function readKey(raw: string, label: string): Buffer {
  try {
    return parseKey(raw, label) as Buffer;
  } catch (error) {
    throw new CredentialKeyError(
      error instanceof Error
        ? error.message
        : `${label} must be ${KEY_BYTES} bytes of base64.`,
    );
  }
}

// { version: key }. More than one entry means a rotation is in progress: new
// writes use the active version, older rows still open with their own.
function keyRing(): Map<number, Buffer> {
  const ring = new Map<number, Buffer>();

  const multi = process.env.CREDENTIAL_ENCRYPTION_KEYS?.trim();
  if (multi) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(multi);
    } catch {
      throw new CredentialKeyError(
        'CREDENTIAL_ENCRYPTION_KEYS must be JSON, for example {"1":"<base64 key>"}.',
      );
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new CredentialKeyError(
        'CREDENTIAL_ENCRYPTION_KEYS must be a JSON object of version to key, for example {"1":"<base64 key>"}.',
      );
    }
    for (const [version, value] of Object.entries(
      parsed as Record<string, unknown>,
    )) {
      const parsedVersion = Number(version);
      if (!Number.isInteger(parsedVersion) || parsedVersion < 1) {
        throw new CredentialKeyError(
          "CREDENTIAL_ENCRYPTION_KEYS versions must be whole numbers from 1 up.",
        );
      }
      if (typeof value !== "string") {
        throw new CredentialKeyError(
          `CREDENTIAL_ENCRYPTION_KEYS version ${version} must be a base64 string.`,
        );
      }
      ring.set(parsedVersion, readKey(value, `Key version ${version}`));
    }
  }

  const single = process.env.CREDENTIAL_ENCRYPTION_KEY?.trim();
  if (single && !ring.size) {
    ring.set(1, readKey(single, "CREDENTIAL_ENCRYPTION_KEY"));
  }

  return ring;
}

export function credentialsConfigured() {
  try {
    return keyRing().size > 0;
  } catch {
    return false;
  }
}

function activeVersion(ring: Map<number, Buffer>) {
  const requested = process.env.CREDENTIAL_ENCRYPTION_KEY_VERSION?.trim();
  if (requested) {
    const version = Number(requested);
    if (!ring.has(version)) {
      throw new CredentialKeyError(
        `CREDENTIAL_ENCRYPTION_KEY_VERSION is ${requested}, but no key of that version is configured.`,
      );
    }
    return version;
  }
  return Math.max(...ring.keys());
}

function requireRing() {
  const ring = keyRing();
  if (!ring.size) {
    throw new CredentialKeyError(
      "No credential encryption key is configured. Set CREDENTIAL_ENCRYPTION_KEYS before using the vault.",
    );
  }
  return ring;
}

export function sealSecret(
  plaintext: string,
  credentialId: string,
): SealedSecret {
  const ring = requireRing();
  const keyVersion = activeVersion(ring);
  const sealed = sealWithKey(
    plaintext,
    ring.get(keyVersion) as Buffer,
    credentialId,
  ) as Omit<SealedSecret, "keyVersion">;

  return { ...sealed, keyVersion };
}

export function openSecret(sealed: SealedSecret, credentialId: string): string {
  const ring = requireRing();
  const key = ring.get(sealed.keyVersion);
  if (!key) {
    throw new CredentialKeyError(
      `This value was encrypted with key version ${sealed.keyVersion}, which is not configured. Restore that key before reading it.`,
    );
  }

  try {
    return openWithKey(sealed, key, credentialId) as string;
  } catch {
    // A tampered or relocated row lands here. Never echo any of it back.
    throw new CredentialKeyError(
      "That credential could not be decrypted. The stored value may have been altered.",
    );
  }
}

export function secretsMatch(a: string, b: string) {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
