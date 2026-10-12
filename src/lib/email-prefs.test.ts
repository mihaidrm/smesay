// E16-1, acceptance 5: the switches default to validations and getting started on, the digest
// off; a save changes one; the stop token is made once; the stop link stops one kind and an
// unknown token stops nothing.
import { beforeAll, describe, expect, it } from "vitest";
import { emails } from "@/db/queries";
import { prepareTestDatabase } from "@/db/test-db";
import { auth } from "@/lib/auth";
import { readEmailPrefs, setEmailPref, stopEmails, stopTarget } from "@/lib/email-prefs";
import { memoryOutbox } from "@/lib/mail";

const BASE = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
let userId: string;

async function signIn(email: string) {
  const before = memoryOutbox.length;
  await auth.handler(new Request(`${BASE}/api/auth/sign-in/magic-link`, { method: "POST", headers: { "content-type": "application/json", origin: BASE }, body: JSON.stringify({ email, callbackURL: "/app" }) }));
  const link = memoryOutbox[before].text.split("\n").find((l) => l.startsWith(BASE + "/api/auth/magic-link/verify"))!;
  const verified = await auth.handler(new Request(link, { redirect: "manual" }));
  const headers = new Headers({ cookie: verified.headers.getSetCookie().find((c) => c.includes("session_token="))!.split(";")[0] });
  return (await auth.api.getSession({ headers }))!.user.id;
}

beforeAll(async () => {
  await prepareTestDatabase();
  userId = await signIn(`email-prefs-${Date.now()}@example.com`);
}, 60_000);

describe("the email switches", () => {
  it("start on, off and on, and save one at a time; anything else is refused", async () => {
    expect(await readEmailPrefs(userId)).toEqual({ validations: true, digest: false, guide: true });
    expect(await setEmailPref(userId, "digest", true)).toEqual({ validations: true, digest: true, guide: true });
    expect(await setEmailPref(userId, "offers", true)).toBeNull();
    expect(await setEmailPref(userId, "digest", "yes")).toBeNull();
    expect(await readEmailPrefs(userId)).toEqual({ validations: true, digest: true, guide: true });
    // Two switches pressed at once both land (the card's switches, one statement each).
    await Promise.all([setEmailPref(userId, "validations", false), setEmailPref(userId, "guide", false)]);
    expect(await readEmailPrefs(userId)).toEqual({ validations: false, digest: true, guide: false });
    await setEmailPref(userId, "validations", true);
    await setEmailPref(userId, "guide", true);
  });
  it("makes the stop token once and stops one kind by it; an unknown token does nothing", async () => {
    const token = await emails.token(userId);
    expect(token).toMatch(/^[0-9a-f]{32}$/);
    expect(await emails.token(userId)).toBe(token);
    expect(await stopTarget(token, "digest")).toEqual({ kind: "digest", name: expect.any(String), already: false });
    expect(await stopTarget(token, "offers")).toBeNull();
    expect(await stopTarget("0".repeat(32), "digest")).toBeNull();
    expect(await stopEmails("0".repeat(32), "digest")).toBe(false);
    expect(await stopEmails(token, "digest")).toBe(true);
    expect(await readEmailPrefs(userId)).toEqual({ validations: true, digest: false, guide: true });
    expect(await stopTarget(token, "digest")).toMatchObject({ already: true });
  });
});
