// The link rules (stories/E6-1, acceptance 3 and 4): the state by the dates, the input
// checks, the UTC wording.
import { describe, expect, it } from "vitest";
import { formatUtc, LINK_ERRORS, linkState, newToken, parseLinkInput } from "./sharing";

const now = new Date("2026-10-03T12:00:00Z");
const later = "2026-10-20T15:00:00Z";
const earlier = "2026-10-01T06:00:00Z";

describe("linkState", () => {
  it("reads draft, not open, open, closed and revoked", () => {
    expect(linkState(null, now)).toBe("draft");
    expect(linkState({ opensAt: new Date("2026-10-06T06:00:00Z"), closesAt: new Date(later), revokedAt: null }, now)).toBe("notOpen");
    expect(linkState({ opensAt: new Date(earlier), closesAt: new Date(later), revokedAt: null }, now)).toBe("open");
    expect(linkState({ opensAt: null, closesAt: new Date(later), revokedAt: null }, now)).toBe("open");
    expect(linkState({ opensAt: null, closesAt: now, revokedAt: null }, now)).toBe("closed");
    expect(linkState({ opensAt: null, closesAt: new Date(later), revokedAt: now }, now)).toBe("revoked");
  });
});

describe("parseLinkInput", () => {
  it("accepts an empty open date and a future close date, and a passcode of 6 or more", () => {
    expect(parseLinkInput("", later, "", now, false)).toEqual({ input: { opensAt: null, closesAt: new Date(later), passcode: null } });
    expect(parseLinkInput(earlier, later, " secret1 ", now, false)).toEqual({ input: { opensAt: new Date(earlier), closesAt: new Date(later), passcode: "secret1" } });
  });
  it("refuses a missing or early close date before publishing, and allows a past one after", () => {
    expect(parseLinkInput("", "", "", now, false)).toEqual({ error: LINK_ERRORS.noClose });
    expect(parseLinkInput(later, earlier, "", now, false)).toEqual({ error: LINK_ERRORS.closeBeforeOpen });
    expect(parseLinkInput("", earlier, "", now, false)).toEqual({ error: LINK_ERRORS.closeInPast });
    expect(parseLinkInput("", earlier, "", now, true)).toMatchObject({ input: { closesAt: new Date(earlier) } });
    expect(parseLinkInput(later, earlier, "", now, true)).toEqual({ error: LINK_ERRORS.closeBeforeOpen });
    expect(parseLinkInput("not a date", later, "", now, false)).toEqual({ error: LINK_ERRORS.badDate });
    expect(parseLinkInput(["x"], later, "", now, false)).toEqual({ error: LINK_ERRORS.badDate });
    expect(parseLinkInput("", later, "short", now, false)).toEqual({ error: LINK_ERRORS.shortPasscode });
    expect(parseLinkInput("", later, "x".repeat(65), now, false)).toEqual({ error: LINK_ERRORS.longPasscode });
  });
});

describe("tokens and wording", () => {
  it("makes 32 hex characters and names UTC", () => {
    expect(newToken()).toMatch(/^[0-9a-f]{32}$/);
    expect(newToken()).not.toBe(newToken());
    expect(formatUtc(new Date("2026-10-06T06:00:00Z"))).toBe("6 Oct 2026, 06:00 UTC");
  });
});
