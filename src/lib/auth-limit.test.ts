// The sign-in limit (stories/E11-1, acceptances 2 and 5) through better-auth's own handler:
// 5 magic link requests per email, and per address, then 429 with the wait in minutes; a failed
// provider callback counts, and an address over the limit is sent to the Google page with the
// wait. Google is not configured in tests, so every callback here fails.
import { randomUUID } from "node:crypto";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { prepareTestDatabase } from "@/db/test-db";
import { auth } from "@/lib/auth";
import { signInLimit } from "@/lib/ratelimit";
import { SIGN_IN_COPY } from "@/lib/sign-in-copy";

const BASE = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
const ask = (email: string, ip: string) =>
  auth.handler(new Request(`${BASE}/api/auth/sign-in/magic-link`, { method: "POST", headers: { "content-type": "application/json", origin: BASE, "x-forwarded-for": ip }, body: JSON.stringify({ email, callbackURL: "/app" }) }));
const callback = (ip: string) => auth.handler(new Request(`${BASE}/api/auth/callback/google?code=x&state=y`, { headers: { "x-forwarded-for": ip }, redirect: "manual" }));

beforeAll(async () => { await prepareTestDatabase(); }, 60_000);
beforeEach(() => signInLimit.clear());

describe("sign-in limit", () => {
  it("refuses the sixth link for one email, whatever the address, with the wait", async () => {
    const email = `limit-${randomUUID()}@example.com`;
    for (let i = 0; i < 5; i++) expect((await ask(email, `10.8.0.${i}`)).status).toBe(200);
    const refused = await ask(email, "10.8.0.99");
    expect(refused.status).toBe(429);
    expect(Number(refused.headers.get("retry-after"))).toBe(60);
    expect(await refused.json()).toMatchObject({ code: "RATE_LIMITED", waitMinutes: 1, message: SIGN_IN_COPY.tooManyFor(1) });
  });
  it("refuses the sixth link from one address, whatever the email", async () => {
    for (let i = 0; i < 5; i++) expect((await ask(`limit-${randomUUID()}@example.com`, "10.8.1.1")).status).toBe(200);
    expect((await ask(`limit-${randomUUID()}@example.com`, "10.8.1.1")).status).toBe(429);
    expect((await ask(`limit-${randomUUID()}@example.com`, "10.8.1.2")).status).toBe(200);
  });
  it("does not count the app's own server calls (member invitations)", async () => {
    for (let i = 0; i < 7; i++) {
      const email = `invitee-${randomUUID()}@example.com`;
      await expect(auth.api.signInMagicLink({ body: { email, callbackURL: "/app" }, headers: new Headers({ "x-forwarded-for": "10.8.3.1" }) })).resolves.toBeTruthy();
    }
    expect((await ask(`limit-${randomUUID()}@example.com`, "10.8.3.1")).status).toBe(200);
  });
  it("counts failed callbacks and sends a blocked address to the Google page with the wait", async () => {
    for (let i = 0; i < 6; i++) await callback("10.8.2.1");
    const blocked = await callback("10.8.2.1");
    expect(blocked.status).toBe(302);
    expect(blocked.headers.get("location")).toBe("/sign-in/google-failed?wait=1");
    expect((await callback("10.8.2.2")).headers.get("location")).not.toContain("wait=");
  });
});
