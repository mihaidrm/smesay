// Sign-in with a magic link (stories/E2-1, acceptance 2 to 4) through better-auth's own handler on
// the test database: the email goes to the memory outbox, the link signs in once, a second or a
// late use is sent to the link-used page, the session cookie carries the flags SECURITY.md asks
// for, and an off-site callback is refused. auth.handler(request): better-auth.com/docs/
// installation (the framework-agnostic handler). Fake Date only, so the database driver keeps its
// timers: vitest.dev/api/vi#vi-usefaketimers (toFake) and #vi-setsystemtime.
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prepareTestDatabase } from "@/db/test-db";
import { auth, createAuth, GOOGLE_ERROR_PATH, readAuthEnv, readGoogleEnv, SESSION_DAYS } from "@/lib/auth";
import { memoryOutbox } from "@/lib/mail";
import { SIGN_IN_LINK_MINUTES } from "@/lib/mail/sign-in-email";
import { signInLimit } from "@/lib/ratelimit";

type Auth = ReturnType<typeof createAuth>;
const BASE = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
const email = `signin-${Date.now()}@example.com`;

beforeAll(async () => { await prepareTestDatabase(); }, 60_000);
// These tests ask for many links for one address; the sign-in limit (E11-1, its own test in
// auth-limit.test.ts) starts empty for each.
beforeEach(() => signInLimit.clear());
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
    const https = createAuth({ baseURL: base, secret: readAuthEnv().secret, google: null });
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

  // stories/E2-2: the Google provider from the two variables, the start of the flow, nothing
  // without the variables.
  it("names a missing Google variable and hides the provider; with both, the flow starts with state and PKCE", async () => {
    const lines: string[] = [];
    expect(readGoogleEnv({}, (l) => lines.push(l))).toBeNull();
    expect(readGoogleEnv({ GOOGLE_CLIENT_ID: "id" }, (l) => lines.push(l))).toBeNull();
    expect(lines).toEqual([
      "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET not set: the Google sign-in button is hidden (docs/accounts.md step 6).",
      "GOOGLE_CLIENT_SECRET not set: the Google sign-in button is hidden (docs/accounts.md step 6).",
    ]);
    expect(readGoogleEnv({ GOOGLE_CLIENT_ID: "id", GOOGLE_CLIENT_SECRET: "s" }, (l) => lines.push(l))).toEqual({ clientId: "id", clientSecret: "s" });
    expect(lines).toHaveLength(2);

    const without = createAuth({ baseURL: BASE, secret: "x".repeat(32), google: null }, { disableOriginCheck: true });
    const refused = await without.handler(new Request(`${BASE}/api/auth/sign-in/social`, { method: "POST", headers: { "content-type": "application/json", origin: BASE }, body: JSON.stringify({ provider: "google", callbackURL: "/app", disableRedirect: true }) }));
    expect(refused.status).toBeGreaterThanOrEqual(400);

    const withGoogle = createAuth({ baseURL: BASE, secret: "x".repeat(32), google: { clientId: "test-client-id.apps.googleusercontent.com", clientSecret: "test-secret" } }, { disableOriginCheck: true });
    const started = await withGoogle.handler(new Request(`${BASE}/api/auth/sign-in/social`, { method: "POST", headers: { "content-type": "application/json", origin: BASE }, body: JSON.stringify({ provider: "google", callbackURL: "/app", errorCallbackURL: GOOGLE_ERROR_PATH, disableRedirect: true }) }));
    expect(started.status).toBe(200);
    const { url } = (await started.json()) as { url: string };
    const target = new URL(url);
    expect(target.origin + target.pathname).toBe("https://accounts.google.com/o/oauth2/v2/auth");
    expect(target.searchParams.get("client_id")).toBe("test-client-id.apps.googleusercontent.com");
    expect(target.searchParams.get("redirect_uri")).toBe(`${BASE}/api/auth/callback/google`);
    expect(target.searchParams.get("state")).toMatch(/.{16,}/);
    expect(target.searchParams.get("code_challenge")).toMatch(/.{32,}/);
    expect(target.searchParams.get("code_challenge_method")).toBe("S256");
    expect(target.searchParams.get("scope")).toContain("email");
    // Nothing printed the secret.
    expect(url).not.toContain("test-secret");
  });

  // The Google callback end to end (stories/E2-2, acceptance 2 and 3), with only Google's token
  // endpoint answered here: the provider reads the id_token by decoding it (node_modules/
  // @better-auth/core/src/social-providers/google.ts, getUserInfo), so an unsigned token with
  // the claims is enough. The authorisation step gives the state and its cookie; the callback
  // gets both back.
  describe("the Google callback", () => {
    const base = "http://localhost:3000";
    const withGoogle = createAuth({ baseURL: base, secret: "x".repeat(32), google: { clientId: "test-client-id.apps.googleusercontent.com", clientSecret: "test-secret" } }, { disableOriginCheck: true });
    const jwt = (claims: Record<string, unknown>) => {
      const part = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");
      return `${part({ alg: "none", typ: "JWT" })}.${part(claims)}.`;
    };
    // The sub (Google's account id) is unique per run: better-auth finds an existing account
    // by provider and account id first, so a reused sub would sign in an earlier run's user.
    async function googleSignIn(profile: { email: string; email_verified: boolean; sub: string }, callbackURL = "/app") {
      const started = await withGoogle.handler(new Request(`${base}/api/auth/sign-in/social`, { method: "POST", headers: { "content-type": "application/json", origin: base }, body: JSON.stringify({ provider: "google", callbackURL, errorCallbackURL: GOOGLE_ERROR_PATH, disableRedirect: true }) }));
      const { url } = (await started.json()) as { url: string };
      const state = new URL(url).searchParams.get("state")!;
      const cookies = started.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
      const realFetch = globalThis.fetch;
      globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
        const target = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
        if (target.startsWith("https://oauth2.googleapis.com/token")) {
          const token = jwt({ iss: "https://accounts.google.com", aud: "test-client-id.apps.googleusercontent.com", exp: Math.floor(Date.now() / 1000) + 3600, iat: Math.floor(Date.now() / 1000), name: "Test Person", ...profile });
          return new Response(JSON.stringify({ access_token: "access", id_token: token, token_type: "Bearer", expires_in: 3600, scope: "openid email profile" }), { status: 200, headers: { "content-type": "application/json" } });
        }
        return realFetch(input, init);
      }) as typeof fetch;
      try {
        return await withGoogle.handler(new Request(`${base}/api/auth/callback/google?code=test-code&state=${encodeURIComponent(state)}`, { headers: { cookie: cookies }, redirect: "manual" }));
      } finally {
        globalThis.fetch = realFetch;
      }
    }
    async function magicLinkSignIn(address: string) {
      const before = memoryOutbox.length;
      await withGoogle.handler(new Request(`${base}/api/auth/sign-in/magic-link`, { method: "POST", headers: { "content-type": "application/json", origin: base }, body: JSON.stringify({ email: address, callbackURL: "/app" }) }));
      const link = memoryOutbox[before].text.split("\n").find((l) => l.startsWith(base + "/api/auth/magic-link/verify"))!;
      await withGoogle.handler(new Request(link, { redirect: "manual" }));
    }
    const userFor = async (address: string) => (await withGoogle.$context).internalAdapter.findUserByEmail(address);

    it("joins the magic-link user when Google's email is verified: one user row, a session (acceptance 2)", async () => {
      const email = `google-link-${Date.now()}@example.com`;
      await magicLinkSignIn(email);
      const before = await userFor(email);
      expect(before?.user.emailVerified).toBe(true);
      const res = await googleSignIn({ email, email_verified: true, sub: `g-1-${Date.now()}` });
      expect(res.status).toBe(302);
      expect(res.headers.get("location")).toMatch(/^(http:\/\/localhost:3000)?\/app$/);
      const cookie = sessionCookie(res);
      const me = await withGoogle.api.getSession({ headers: new Headers({ cookie: cookie.split(";")[0] }) });
      expect(me?.user.email).toBe(email);
      // The same row as the magic link's, with the Google account attached.
      expect(me?.user.id).toBe(before!.user.id);
      const accounts = await (await withGoogle.$context).internalAdapter.findAccounts(me!.user.id);
      expect(accounts.map((a) => a.providerId)).toContain("google");
    });

    it("refuses an unverified Google email for a new address: no user, no session, the refusal page (acceptance 3)", async () => {
      const email = `google-unverified-${Date.now()}@example.com`;
      const res = await googleSignIn({ email, email_verified: false, sub: `g-2-${Date.now()}` });
      expect(res.status).toBe(302);
      expect(res.headers.get("location")).toContain(GOOGLE_ERROR_PATH);
      expect(res.headers.getSetCookie().some((c) => c.includes("session_token=") && !c.includes("session_token=;"))).toBe(false);
      expect(await userFor(email)).toBeNull();
    });

    it("refuses an unverified Google email for an existing user, and sends a state error to the same page", async () => {
      const email = `google-existing-${Date.now()}@example.com`;
      await magicLinkSignIn(email);
      const res = await googleSignIn({ email, email_verified: false, sub: `g-3-${Date.now()}` });
      expect(res.status).toBe(302);
      expect(res.headers.get("location")).toContain(GOOGLE_ERROR_PATH);
      expect((await userFor(email))?.user.emailVerified).toBe(true);
      const stale = await withGoogle.handler(new Request(`${base}/api/auth/callback/google?code=x&state=unknown-state`, { redirect: "manual" }));
      expect(stale.status).toBe(302);
      expect(stale.headers.get("location")).toContain(GOOGLE_ERROR_PATH);
    });
  });
});

