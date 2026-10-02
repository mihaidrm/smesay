// Sign-in with a magic link (stories/E2-1, acceptance 2 to 4) through better-auth's own handler on
// the test database: the email goes to the memory outbox, the link signs in once, a second or a
// late use is sent to the link-used page, the session cookie carries the flags SECURITY.md asks
// for, and an off-site callback is refused. auth.handler(request): better-auth.com/docs/
// installation (the framework-agnostic handler). Fake Date only, so the database driver keeps its
// timers: vitest.dev/api/vi#vi-usefaketimers (toFake) and #vi-setsystemtime.
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { prepareTestDatabase } from "@/db/test-db";
import { auth, createAuth, readAuthEnv, SESSION_DAYS } from "@/lib/auth";
import { memoryOutbox } from "@/lib/mail";
import { SIGN_IN_LINK_MINUTES } from "@/lib/mail/sign-in-email";

type Auth = ReturnType<typeof createAuth>;
const BASE = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
const email = `signin-${Date.now()}@example.com`;

beforeAll(async () => { await prepareTestDatabase(); }, 60_000);
afterEach(() => { vi.useRealTimers(); });

async function requestLink(instance: Auth = auth, base = BASE, body: Record<string, string> = {}): Promise<Response> {
  return instance.handler(new Request(`${base}/api/auth/sign-in/magic-link`, {
    method: "POST", headers: { "content-type": "application/json", origin: base },
    body: JSON.stringify({ email, callbackURL: "/app", errorCallbackURL: "/sign-in/link-used", ...body }),
  }));
}

async function sentLink(instance: Auth = auth, base = BASE): Promise<string> {
  const before = memoryOutbox.length;
  const res = await requestLink(instance, base);
  expect(res.status).toBe(200);
  expect(memoryOutbox.length).toBe(before + 1);
  const mail = memoryOutbox[memoryOutbox.length - 1];
  expect(mail.to).toBe(email);
  expect(mail.subject).toBe("Your sign-in link for SMEsay");
  expect(mail.text).toContain(`stops working in ${SIGN_IN_LINK_MINUTES} minutes`);
  expect(mail.text).toContain(`${base}/legal/privacy`);
  const link = mail.text.split("\n").find((l) => l.startsWith(base + "/api/auth/magic-link/verify"));
  expect(link).toBeDefined();
  return link!;
}

function sessionCookie(res: Response): string {
  const cookie = res.headers.getSetCookie().find((c) => c.includes("session_token="));
  expect(cookie).toBeDefined();
  return cookie!;
}

describe("magic link", () => {
  it("signs in once, with a session cookie that is httpOnly and SameSite=Lax, and refuses a second use", async () => {
    const link = await sentLink();
    const first = await auth.handler(new Request(link, { redirect: "manual" }));
    expect(first.status).toBe(302);
    expect(first.headers.get("location")).toBe(`${BASE}/app`);
    const raw = sessionCookie(first);
    const cookie = raw.toLowerCase();
    expect(cookie).toContain("httponly");
    expect(cookie).toContain("samesite=lax");
    // Secure follows the scheme of BETTER_AUTH_URL (src/lib/auth.ts); the next test sees it on.
    expect(cookie.includes("secure")).toBe(BASE.startsWith("https://"));

    const me = await auth.api.getSession({ headers: new Headers({ cookie: raw.split(";")[0] }) });
    expect(me?.user.email).toBe(email);

    const second = await auth.handler(new Request(link, { redirect: "manual" }));
    expect(second.status).toBe(302);
    expect(second.headers.get("location")).toContain("/sign-in/link-used");
  });

  it("sets Secure and the __Secure- prefix on an https base URL", async () => {
    const base = "https://smesay.test";
    const https = createAuth({ baseURL: base, secret: readAuthEnv().secret });
    const link = await sentLink(https, base);
    const res = await https.handler(new Request(link, { redirect: "manual" }));
    expect(res.status).toBe(302);
    const cookie = sessionCookie(res);
    expect(cookie.startsWith("__Secure-")).toBe(true);
    expect(cookie.toLowerCase()).toContain("; secure");
    expect(cookie.toLowerCase()).toContain("httponly");
    expect(cookie.toLowerCase()).toContain("samesite=lax");
  });

  it("refuses a link opened after 15 minutes", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    const link = await sentLink();
    vi.setSystemTime(Date.now() + (SIGN_IN_LINK_MINUTES + 1) * 60 * 1000);
    const late = await auth.handler(new Request(link, { redirect: "manual" }));
    expect(late.status).toBe(302);
    expect(late.headers.get("location")).toContain("/sign-in/link-used");
  });

  it("issues a new session token on every sign-in", async () => {
    const tokens: string[] = [];
    for (let i = 0; i < 2; i++) {
      const res = await auth.handler(new Request(await sentLink(), { redirect: "manual" }));
      tokens.push(sessionCookie(res).split(";")[0].split("=")[1]);
    }
    expect(tokens[0]).not.toBe(tokens[1]);
  });

  it("refuses an off-site callback or error callback", async () => {
    // Vitest runs with better-auth's origin check off (isTest in node_modules/better-auth/dist/
    // context/create-context.mjs); this instance turns it on, as in production.
    const checked = createAuth(readAuthEnv(), { disableOriginCheck: false });
    const offSite: Record<string, string>[] = [{ callbackURL: "https://evil.example/app" }, { errorCallbackURL: "https://evil.example/x" }, { callbackURL: "/\t/evil.example" }];
    for (const body of offSite) {
      const before = memoryOutbox.length;
      const res = await requestLink(checked, BASE, body);
      expect(res.status).toBe(403);
      expect(memoryOutbox.length).toBe(before);
    }
    const ok = await requestLink(checked);
    expect(ok.status).toBe(200);
  });

  it("is configured for 15 minute links and 30 day sessions, and names a missing variable", () => {
    expect(SIGN_IN_LINK_MINUTES).toBe(15);
    expect(SESSION_DAYS).toBe(30);
    expect(auth.options.session?.expiresIn).toBe(30 * 24 * 60 * 60);
    expect(() => readAuthEnv({ BETTER_AUTH_SECRET: "x" })).toThrow("BETTER_AUTH_URL is not set");
    expect(() => readAuthEnv({ BETTER_AUTH_URL: BASE })).toThrow("BETTER_AUTH_SECRET is not set");
    expect(() => readAuthEnv({ BETTER_AUTH_URL: "http://smesay.test", BETTER_AUTH_SECRET: "x", NODE_ENV: "production" })).toThrow("https://");
    expect(readAuthEnv({ BETTER_AUTH_URL: "https://smesay.test", BETTER_AUTH_SECRET: "x", NODE_ENV: "production" }).baseURL).toBe("https://smesay.test");
    expect(readAuthEnv({ BETTER_AUTH_URL: "http://localhost:3000", BETTER_AUTH_SECRET: "x", NODE_ENV: "production" }).baseURL).toBe("http://localhost:3000");
  });
});
