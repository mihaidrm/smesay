// The public link's passcode (stories/E6-1, acceptance 4): stored as a scrypt hash with a
// random salt, never as typed; checked in constant time. Node's own scrypt, a memory-hard
// key derivation function, so no dependency is added (nodejs.org/api/crypto.html,
// crypto.scryptSync(password, salt, keylen); timingSafeEqual). The story named argon2 or
// bcrypt; the choice of scrypt is recorded in docs/review-list.md. The format is
// "scrypt$<salt hex>$<key hex>", so a later algorithm can sit beside it.
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { PASSCODE_MAX, PASSCODE_MIN } from "@/lib/passcode-rules";

export { PASSCODE_MAX, PASSCODE_MIN };

export function hashPasscode(passcode: string): string {
  const salt = randomBytes(16);
  const key = scryptSync(passcode.normalize("NFC"), salt, 32);
  return `scrypt$${salt.toString("hex")}$${key.toString("hex")}`;
}

export function verifyPasscode(passcode: string, stored: string): boolean {
  const [algorithm, saltHex, keyHex] = stored.split("$");
  if (algorithm !== "scrypt" || !saltHex || !keyHex) return false;
  const key = scryptSync(passcode.normalize("NFC"), Buffer.from(saltHex, "hex"), 32);
  const expected = Buffer.from(keyHex, "hex");
  return key.length === expected.length && timingSafeEqual(key, expected);
}
