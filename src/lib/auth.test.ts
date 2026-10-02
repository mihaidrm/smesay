// Sign-in with a magic link (stories/E2-1, acceptance 2 to 4) through better-auth's own handler on
// the test database: the email goes to the memory outbox, the link signs in once, a second use is
// sent to the link-used page, and the session cookie carries the flags SECURITY.md asks for.
// auth.handler(request): better-auth.com/docs/installation (the framework-agnostic handler).
import { beforeAll, describe, expect, it } from "vitest";
import { prepareTestDatabase } from "@/db/test-db";
import { auth, SESSION_DAYS } from "@/lib/auth";
import { memoryOutbox } from "@/lib/mail";
import { SIGN_IN_LINK_MINUTES } from "@/lib/mail/sign-in-email";

const BASE = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
const email = `signin-${Date.now()}@example.com`;

beforeAll(async () => { await prepareTestDatabase(); }, 60_000);

async function requestLink(): Promise<string> {
  const before = memoryOutbox.length;
  const res = await auth.handler(new Request(`${BASE}/api/auth/sign-in/magic-link`, {
    method: "POST", headers: { "content-type": "application/json", origin: BASE },
    body: JSON.stringify({ email, callbackURL: "/app", errorCallbackURL: "/sign-in/link-used" }),
  }));
  expect(res.status).toBe(200);
  expect(memoryOutbox.length).toBe(before + 1);
  const mail = memoryOutbox[memoryOutbox.length - 1];
  expect(mail.to).toBe(email);
  expect(mail.subject).toBe("Your sign-in link for SMEsay");
  expect(mail.text).toContain(`stops working in ${SIGN_IN_LINK_MINUTES} minutes`);
  const link = mail.text.split("\n").find((l) => l.startsWith(BASE + "/api/auth/magic-link/verify"));
  expect(link).toBeDefined();
  return link!;
}

describe("magic link", () => {
  it("signs in once, with a session cookie that is httpOnly and SameSite=Lax, and refuses a second use", async () => {
    const link = await requestLink();
    const first = await auth.handler(new Request(link, { redirect: "manual" }));
    expect(first.status).toBe(302);
    expect(first.headers.get("location")).toBe(`${BASE}/app`);
    const cookies = first.headers.getSetCookie();
    const session = cookies.find((c) => c.includes("session_token="));
    expect(session).toBeDefined();
    expect(session!.toLowerCase()).toContain("httponly");
    expect(session!.toLowerCase()).toContain("samesite=lax");
    // Secure is on in production only (better-auth.com/docs/concepts/cookies); tests run as test.
    expect(session!.toLowerCase().includes("secure")).toBe(process.env.NODE_ENV === "production");

    const me = await auth.api.getSession({ headers: new Headers({ cookie: session!.split(";")[0] }) });
    expect(me?.user.email).toBe(email);

    const second = await auth.handler(new Request(link, { redirect: "manual" }));
    expect(second.status).toBe(302);
    expect(second.headers.get("location")).toContain("/sign-in/link-used");
  });

  it("is configured for 15 minute links and 30 day sessions", () => {
    expect(SIGN_IN_LINK_MINUTES).toBe(15);
    expect(SESSION_DAYS).toBe(30);
    expect(auth.options.session?.expiresIn).toBe(30 * 24 * 60 * 60);
  });
});
