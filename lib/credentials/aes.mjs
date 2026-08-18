import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

export const ALGORITHM = "aes-256-gcm";
export const KEY_BYTES = 32;
export const NONCE_BYTES = 12;

export function parseKey(raw, label) {
  const key = Buffer.from(String(raw).trim(), "base64");
  if (key.length !== KEY_BYTES) {
    throw new Error(
      `${label} must be ${KEY_BYTES} bytes of base64. Generate one with: openssl rand -base64 32`,
    );
  }
  return key;
}

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
