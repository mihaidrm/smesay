// The passcode hash (stories/E6-1, acceptance 4): a different hash each time, the right
// passcode verifies, a wrong one and a malformed store do not.
import { describe, expect, it } from "vitest";
import { hashPasscode, verifyPasscode } from "./passcode";

describe("passcode", () => {
  it("hashes with a fresh salt and verifies only the right passcode", () => {
    const a = hashPasscode("letmein");
    const b = hashPasscode("letmein");
    expect(a).not.toBe(b);
    expect(a.startsWith("scrypt$")).toBe(true);
    expect(a).not.toContain("letmein");
    expect(verifyPasscode("letmein", a)).toBe(true);
    expect(verifyPasscode("letmein", b)).toBe(true);
    expect(verifyPasscode("LETMEIN", a)).toBe(false);
    expect(verifyPasscode("", a)).toBe(false);
    expect(verifyPasscode("letmein", "bcrypt$x$y")).toBe(false);
    expect(verifyPasscode("letmein", "")).toBe(false);
  });
});
