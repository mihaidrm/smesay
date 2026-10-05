// The main path of E11-5, acceptance 2: the home page answers with the security headers and a
// content security policy whose nonce is on every script the page runs, and the home, legal and
// sign-in pages render without a policy violation in the console. The builder's preview, which
// frames /r/ pages, is e2e/preview.spec.ts's.
import { expect, test } from "@playwright/test";

test("the security headers on the home page, and no policy violation", async ({ page }) => {
  const violations: string[] = [];
  page.on("console", (m) => { if (m.type() === "error" && /Content Security Policy/i.test(m.text())) violations.push(m.text()); });
  const response = await page.goto("/");
  const headers = response!.headers();
  for (const name of ["strict-transport-security", "x-content-type-options", "referrer-policy", "permissions-policy", "x-frame-options"]) expect(headers[name], name).toBeTruthy();
  const nonce = headers["content-security-policy"].match(/'nonce-([^']+)'/)?.[1];
  expect(nonce).toBeTruthy();
  expect(headers["content-security-policy"]).toContain("frame-ancestors 'self'");
  expect(headers["x-powered-by"]).toBeUndefined();
  // Every script tag in the HTML the server sent carries this response's nonce; scripts those
  // load later run through 'strict-dynamic' (src/lib/security-headers.ts).
  const raw = await page.request.get("/");
  const rawNonce = raw.headers()["content-security-policy"].match(/'nonce-([^']+)'/)?.[1];
  const tags = (await raw.text()).match(/<script\b[^>]*>/g) ?? [];
  expect(tags.length).toBeGreaterThan(0);
  expect(tags.filter((t) => !t.includes(`nonce="${rawNonce}"`))).toEqual([]);
  for (const path of ["/legal/privacy", "/sign-in"]) await page.goto(path);
  await page.waitForLoadState("networkidle");
  expect(violations).toEqual([]);
});
