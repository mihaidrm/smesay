// Visitor analytics (stories/E13-3): off unless both variables are set and the script is
// Plausible's; a server goal goes to the Events API with the visitor's user agent and address,
// and never stops the action; the source a visitor came with is kept only as a short token.
import { afterEach, describe, expect, it, vi } from "vitest";
import { goalBody, isFreshSignUp, plausibleConfig, sendGoal } from "@/lib/plausible";
import { contentSecurityPolicy } from "@/lib/security-headers";
import { cleanSource, nextWithSource, signInHref } from "@/lib/utm";

const ON = { PLAUSIBLE_DOMAIN: "smesay.example", PLAUSIBLE_SCRIPT_SRC: "https://plausible.io/js/pa-abc123.js" };
const saved = { domain: process.env.PLAUSIBLE_DOMAIN, src: process.env.PLAUSIBLE_SCRIPT_SRC };
afterEach(() => {
  for (const [k, v] of [["PLAUSIBLE_DOMAIN", saved.domain], ["PLAUSIBLE_SCRIPT_SRC", saved.src]] as const) { if (v === undefined) delete process.env[k]; else process.env[k] = v; }
});

describe("plausibleConfig", () => {
  it("is on only with both variables and a script from plausible.io", () => {
    expect(plausibleConfig(ON)).toEqual({ domain: "smesay.example", scriptSrc: ON.PLAUSIBLE_SCRIPT_SRC });
    expect(plausibleConfig({})).toBeNull();
    expect(plausibleConfig({ PLAUSIBLE_DOMAIN: "smesay.example" })).toBeNull();
    expect(plausibleConfig({ ...ON, PLAUSIBLE_SCRIPT_SRC: "https://evil.example/js/x.js" })).toBeNull();
    expect(plausibleConfig({ ...ON, PLAUSIBLE_SCRIPT_SRC: "https://plausible.io.evil.example/js/x.js" })).toBeNull();
  });

  it("lets the policy send to plausible.io only when on", () => {
    expect(contentSecurityPolicy({ nonce: "n", dev: false, https: true, analytics: "https://plausible.io" })).toContain("connect-src 'self' https://plausible.io");
    expect(contentSecurityPolicy({ nonce: "n", dev: false, https: true })).toContain("connect-src 'self';");
  });
});

describe("sendGoal", () => {
  it("posts the domain, the name and the page to the Events API with the visitor's headers", async () => {
    Object.assign(process.env, ON);
    const send = vi.fn(async () => new Response(null, { status: 202 }));
    sendGoal("First project", { url: "https://smesay.example/app/projects/new", userAgent: "Mozilla/5.0", forwardedFor: "203.0.113.7" }, send as unknown as typeof fetch);
    await vi.waitFor(() => expect(send).toHaveBeenCalledTimes(1));
    const [url, init] = send.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://plausible.io/api/event");
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({ "content-type": "application/json", "user-agent": "Mozilla/5.0", "x-forwarded-for": "203.0.113.7" });
    expect(JSON.parse(String(init.body))).toEqual({ domain: "smesay.example", name: "First project", url: "https://smesay.example/app/projects/new" });
  });

  it("sends nothing when off or without the visitor's user agent or address, and never throws", async () => {
    const send = vi.fn(async () => { throw new Error("down"); });
    sendGoal("First project", { url: "https://x.example/", userAgent: "UA", forwardedFor: "203.0.113.7" }, send as unknown as typeof fetch);
    Object.assign(process.env, ON);
    sendGoal("First project", { url: "https://x.example/", userAgent: null, forwardedFor: "203.0.113.7" }, send as unknown as typeof fetch);
    sendGoal("First project", { url: "https://x.example/", userAgent: "UA", forwardedFor: null }, send as unknown as typeof fetch);
    expect(send).not.toHaveBeenCalled();
    expect(() => sendGoal("First project", { url: "https://x.example/", userAgent: "UA", forwardedFor: "203.0.113.7" }, send as unknown as typeof fetch)).not.toThrow();
    await vi.waitFor(() => expect(send).toHaveBeenCalledTimes(1));
    expect(goalBody({ domain: "d", scriptSrc: "s" }, "Sign up", "u")).toBe('{"domain":"d","name":"Sign up","url":"u"}');
  });
});

describe("isFreshSignUp", () => {
  it("counts the sign-up within 30 minutes of the account's creation only", () => {
    const now = Date.parse("2026-10-05T10:00:00Z");
    expect(isFreshSignUp("2026-10-05T09:31:00Z", now)).toBe(true);
    expect(isFreshSignUp(new Date("2026-10-05T09:29:00Z"), now)).toBe(false);
  });
});

describe("the source", () => {
  it("keeps a short lowercase token and nothing else", () => {
    expect(cleanSource(" LinkedIn ")).toBe("linkedin");
    expect(cleanSource("newsletter_2026-10")).toBe("newsletter_2026-10");
    for (const bad of ["ana@marlow.example", "a b", "x".repeat(41), "", ["linkedin"], null]) expect(cleanSource(bad)).toBeNull();
  });

  it("rides from the landing page through sign-in to the workspace step", () => {
    expect(signInHref("linkedin")).toBe("/sign-in?utm_source=linkedin");
    expect(signInHref(null)).toBe("/sign-in");
    expect(nextWithSource("/app", "linkedin")).toBe("/app/new?source=linkedin");
    expect(nextWithSource("/app/projects/x", "linkedin")).toBe("/app/projects/x");
    expect(nextWithSource("/app", null)).toBe("/app");
  });
});
