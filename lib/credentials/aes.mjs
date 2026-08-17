// The credential encryption format, in one place.
//
// Plain JavaScript on purpose: the application imports it through
// lib/credentials/crypto.ts, and scripts/credential-key.mjs imports it
// directly. Key rotation must never be running a second, drifting copy of
// this logic.
//
// AES-256-GCM. The credential id is additional authenticated data, so a row
// copied over another credential's row fails to decrypt rather than quietly
// handing back the wrong secret.

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

export const ALGORITHM = "aes-256-gcm";
export const KEY_BYTES = 32;
export const NONCE_BYTES = 12;

/**
 * @param {string} raw base64 encoded key
 * @param {string} label used in the error message
 * @returns {Buffer}
 */
export function parseKey(raw, label) {
  const key = Buffer.from(String(raw).trim(), "base64");
  if (key.length !== KEY_BYTES) {
    throw new Error(
      `${label} must be ${KEY_BYTES} bytes of base64. Generate one with: openssl rand -base64 32`,
    );
  }
  return key;
}

/**
 * @param {string} plaintext
 * @param {Buffer} key
 * @param {string} credentialId
 * @returns {{ ciphertext: string, nonce: string, authTag: string }}
 */
export function sealWithKey(plaintext, key, credentialId) {
  const nonce = randomBytes(NONCE_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, nonce);
  cipher.setAAD(Buffer.from(credentialId, "utf8"));

  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  return {
    ciphertext: ciphertext.toString("base64"),
    nonce: nonce.toString("base64"),
    authTag: cipher.getAuthTag().toString("base64"),
  };
}

/**
 * @param {{ ciphertext: string, nonce: string, authTag: string }} sealed
 * @param {Buffer} key
 * @param {string} credentialId
 * @returns {string}
 */
export function openWithKey(sealed, key, credentialId) {
  const decipher = createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(sealed.nonce, "base64"),
  );
  decipher.setAAD(Buffer.from(credentialId, "utf8"));
  decipher.setAuthTag(Buffer.from(sealed.authTag, "base64"));

  return Buffer.concat([
    decipher.update(Buffer.from(sealed.ciphertext, "base64")),
    decipher.final(),
  ]).toString("utf8");
}
