// The respondent routes' limit in the proxy (stories/E11-1, acceptances 1 and 5): 100 requests a
// minute per address on /r and /brand, then 429 as a page for a page request and as JSON for the
// respondent app's calls; /app keeps its sign-in redirect.
import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "./proxy";
import { respondentLimit } from "@/lib/ratelimit";
import { RATE_LIMIT_COPY } from "@/lib/ratelimit-copy";

const BASE = "http://localhost:3000";
const req = (path: string, ip: string, init: { method?: string; accept?: string } = {}) =>
  new NextRequest(`${BASE}${path}`, { method: init.method ?? "GET", headers: { "x-forwarded-for": ip, accept: init.accept ?? "text/html" } });

describe("proxy", () => {
  it("lets 100 respondent requests a minute through per address, then answers 429", async () => {
    respondentLimit.clear();
    for (let i = 0; i < 100; i++) expect(proxy(req(i % 2 ? "/r/abc" : "/brand/w/logo", "10.9.0.1")).status).toBe(200);
    const page = proxy(req("/r/abc", "10.9.0.1"));
    expect(page.status).toBe(429);
    expect(page.headers.get("content-type")).toContain("text/html");
    expect(Number(page.headers.get("retry-after"))).toBeGreaterThan(0);
    expect(await page.text()).toContain(RATE_LIMIT_COPY.respondent);
    const call = proxy(req("/r/abc/answers", "10.9.0.1", { method: "PUT", accept: "application/json" }));
    expect(call.status).toBe(429);
    expect(await call.json()).toMatchObject({ error: RATE_LIMIT_COPY.respondent, code: "rateLimited", waitMinutes: 1 });
    // A server action keeps its own limit.
    expect(proxy(new NextRequest(`${BASE}/r/abc`, { method: "POST", headers: { "x-forwarded-for": "10.9.0.1", "next-action": "abc" } })).status).toBe(200);
    expect(proxy(req("/r/abc", "10.9.0.2")).status).toBe(200);
  });
  it("does not count a request without X-Forwarded-For", () => {
    respondentLimit.clear();
    for (let i = 0; i < 150; i++) expect(proxy(new NextRequest(`${BASE}/r/abc`)).status).toBe(200);
    expect(respondentLimit.size()).toBe(0);
  });
  it("still sends /app without a session to sign-in", () => {
    const res = proxy(req("/app/projects", "10.9.0.3"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe(`${BASE}/sign-in?next=%2Fapp%2Fprojects`);
  });
});
