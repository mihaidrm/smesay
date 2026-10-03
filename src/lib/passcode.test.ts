// The passcode hash (stories/E6-1, acceptance 4): a different hash each time, the
// parameters in the stored text, the right passcode verifies, a wrong one and a malformed
// store do not.
import { describe, expect, it } from "vitest";
import { hashPasscode, verifyPasscode } from "./passcode";

describe("passcode", () => {
  it("hashes with a fresh salt and verifies only the right passcode", async () => {
    const a = await hashPasscode("letmein");
    const b = await hashPasscode("letmein");
    expect(a).not.toBe(b);
    expect(a.startsWith("scrypt$131072$8$1$")).toBe(true);
    expect(a).not.toContain("letmein");
    expect(await verifyPasscode("letmein", a)).toBe(true);
    expect(await verifyPasscode("letmein", b)).toBe(true);
    expect(await verifyPasscode("LETMEIN", a)).toBe(false);
    expect(await verifyPasscode("", a)).toBe(false);
    expect(await verifyPasscode("letmein", "bcrypt$x$y")).toBe(false);
    expect(await verifyPasscode("letmein", "scrypt$abc$8$1$00$00")).toBe(false);
    expect(await verifyPasscode("letmein", "")).toBe(false);
  });
});
