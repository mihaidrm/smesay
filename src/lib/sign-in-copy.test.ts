import { describe, expect, it } from "vitest";
import { messageForStatus, SIGN_IN_COPY } from "@/lib/sign-in-copy";

describe("messageForStatus", () => {
  it("maps each refusal to a message from docs/copy", () => {
    expect(messageForStatus(400)).toBe(SIGN_IN_COPY.badAddress);
    expect(messageForStatus(422)).toBe(SIGN_IN_COPY.badAddress);
    expect(messageForStatus(429)).toBe(SIGN_IN_COPY.tooMany);
    expect(messageForStatus(500)).toBe(SIGN_IN_COPY.notSent);
    expect(messageForStatus(undefined)).toBe(SIGN_IN_COPY.notSent);
  });
  it("reads as a sentence", () => {
    expect(SIGN_IN_COPY.tooMany).toBe("Too many sign-in attempts. Wait 1 minute, then try again.");
    expect(SIGN_IN_COPY.sent).toBe("Check your email. The link works once and stops working in 15 minutes.");
  });
});
