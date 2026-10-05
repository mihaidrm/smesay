// The security headers (stories/E11-5, acceptance 2): the policy's parts, development's
// additions, HTTPS's upgrade, and the fixed headers every response carries.
import { describe, expect, it } from "vitest";
import { contentSecurityPolicy, FIXED_HEADERS } from "./security-headers";

describe("security headers", () => {
  it("allows scripts only with the nonce, frames only from the app, eval only in development", () => {
    const prod = contentSecurityPolicy({ nonce: "abc", dev: false, https: true });
    expect(prod.split("; ")).toEqual([
      "default-src 'self'", "script-src 'self' 'nonce-abc' 'strict-dynamic'", "style-src 'self' 'unsafe-inline'",
      "img-src 'self' blob: data:", "font-src 'self'", "connect-src 'self'", "frame-src 'self'", "object-src 'none'",
      "base-uri 'self'", "form-action 'self'", "frame-ancestors 'self'", "upgrade-insecure-requests",
    ]);
    const dev = contentSecurityPolicy({ nonce: "abc", dev: true, https: false });
    expect(dev).toContain("'strict-dynamic' 'unsafe-eval'");
    expect(dev).toContain("connect-src 'self' ws:");
    expect(dev).not.toContain("upgrade-insecure-requests");
  });
  it("names the five fixed headers", () => {
    expect(FIXED_HEADERS.map((h) => h.key)).toEqual(["Strict-Transport-Security", "X-Content-Type-Options", "Referrer-Policy", "Permissions-Policy", "X-Frame-Options"]);
  });
});
