// The public link's passcode (stories/E6-1, acceptance 4): stored as a scrypt hash with a
// random salt and its parameters, never as typed; checked in constant time. Node's own
// scrypt, a memory-hard key derivation function, so no dependency is added; the async
// form, so a check on the public route does not block the event loop
// (nodejs.org/api/crypto.html, crypto.scrypt(password, salt, keylen, options, callback);
// timingSafeEqual). N = 2^16, r = 8, p = 2 is one of the OWASP Password Storage Cheat
// Sheet's scrypt settings (cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html,
// "scrypt": N=2^17 r=8 p=1, or N=2^16 r=8 p=2, ...), 64 MiB a check, with maxmem raised
// for it; the attempt limits in src/lib/link-access.ts bound how much of it a link can cause. The story named argon2 or bcrypt;
// the choice is recorded in docs/review-list.md. The format is
// "scrypt$N$r$p$<salt hex>$<key hex>", so the parameters can change without breaking old
// hashes.
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { PASSCODE_MAX, PASSCODE_MIN } from "@/lib/passcode-rules";

export { PASSCODE_MAX, PASSCODE_MIN };

const derive = promisify(scrypt) as (password: string, salt: Buffer, keylen: number, options: { N: number; r: number; p: number; maxmem: number }) => Promise<Buffer>;
const N = 2 ** 16;
const R = 8;
const P = 2;
const maxmem = (n: number, r: number) => 128 * n * r * 2;

export async function hashPasscode(passcode: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await derive(passcode.normalize("NFC"), salt, 32, { N, r: R, p: P, maxmem: maxmem(N, R) });
  return `scrypt$${N}$${R}$${P}$${salt.toString("hex")}$${key.toString("hex")}`;
}

export async function verifyPasscode(passcode: string, stored: string): Promise<boolean> {
  const [algorithm, nText, rText, pText, saltHex, keyHex] = stored.split("$");
  const [n, r, p] = [Number(nText), Number(rText), Number(pText)];
  if (algorithm !== "scrypt" || !saltHex || !keyHex || !Number.isInteger(n) || !Number.isInteger(r) || !Number.isInteger(p) || n < 2 || r < 1 || p < 1) return false;
  const expected = Buffer.from(keyHex, "hex");
  const key = await derive(passcode.normalize("NFC"), Buffer.from(saltHex, "hex"), expected.length, { N: n, r, p, maxmem: maxmem(n, r) });
  return key.length === expected.length && timingSafeEqual(key, expected);
}
