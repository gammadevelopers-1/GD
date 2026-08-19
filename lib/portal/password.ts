import { randomInt } from "node:crypto";

const ALPHABET = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generatePassword(length = 20) {
  let out = "";
  for (let index = 0; index < length; index += 1) {
    out += ALPHABET[randomInt(ALPHABET.length)];
  }
  return out;
}
