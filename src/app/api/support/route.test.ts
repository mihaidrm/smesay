// POST /api/support (stories/E12-5, acceptance 3 and 4) through the route itself, with the
// mail transport replaced (vi.mock: vitest.dev/api/vi.html#vi-mock): a filled hidden field
// mails nothing, the variable unset answers 404, a form post 415, a failed mail 503 with the
// counts given back, each limit names itself.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sent: unknown[] = [];
let fail = false;
vi.mock("@/lib/mail", () => ({ sendMail: async (mail: unknown) => { if (fail) throw new Error("smtp down"); sent.push(mail); } }));

const { POST } = await import("./route");
const { supportByAddress, supportByConnection, SUPPORT_PER_ADDRESS, SUPPORT_PER_CONNECTION } = await import("@/lib/support");

const post = (body: unknown, from = "10.1.0.1", type = "application/json") =>
  POST(new Request("http://localhost:3000/api/support", { method: "POST", headers: { "content-type": type, "x-forwarded-for": from }, body: typeof body === "string" ? body : JSON.stringify(body) }));
const ok = { email: "ana@marlow.example", question: "Can experts answer in Romanian?", page: "/landing-page" };

describe("POST /api/support", () => {
  beforeEach(() => { sent.length = 0; fail = false; supportByAddress.clear(); supportByConnection.clear(); vi.stubEnv("NEXT_PUBLIC_SUPPORT_EMAIL", "support@marlow.example"); vi.stubEnv("BETTER_AUTH_URL", "https://smesay.com/"); });
  afterEach(() => vi.unstubAllEnvs());

  it("mails one question with Reply-To the visitor", async () => {
    const res = await post(ok);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ sent: true });
    expect(sent).toEqual([expect.objectContaining({ to: "support@marlow.example", replyTo: "ana@marlow.example" })]);
    expect((sent[0] as { text: string }).text).toContain("https://smesay.com/landing-page");
  });

  it("answers Sent to a filled hidden field and mails nothing", async () => {
    const res = await post({ ...ok, email: "x", website: "spam.example" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ sent: true });
    expect(sent).toEqual([]);
  });

  it("is off when the support address is empty, and takes JSON only", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPPORT_EMAIL", "");
    expect((await post(ok)).status).toBe(404);
    vi.stubEnv("NEXT_PUBLIC_SUPPORT_EMAIL", "support@marlow.example");
    expect((await post("email=a", "10.1.0.2", "application/x-www-form-urlencoded")).status).toBe(415);
    expect(await (await post({ ...ok, email: "a@b.c,x" })).json()).toEqual({ problem: "email" });
    expect(sent).toEqual([]);
  });

  it("answers 503 when the mail fails and gives the count back", async () => {
    fail = true;
    for (let i = 0; i < SUPPORT_PER_ADDRESS + 1; i++) expect((await post(ok)).status).toBe(503);
    fail = false;
    expect((await post(ok)).status).toBe(200);
  });

  it("names which limit was reached", async () => {
    for (let i = 0; i < SUPPORT_PER_ADDRESS; i++) await post(ok, `10.2.0.${i}`);
    const byAddress = await post(ok, "10.2.0.99");
    expect(byAddress.status).toBe(429);
    expect(await byAddress.json()).toEqual({ tooMany: "address" });
    for (let i = 0; i < SUPPORT_PER_CONNECTION; i++) await post({ ...ok, email: `v${i}@x.io` }, "10.3.0.1");
    const byConnection = await post({ ...ok, email: "new@x.io" }, "10.3.0.1");
    expect(await byConnection.json()).toEqual({ tooMany: "connection" });
    expect(byConnection.headers.get("retry-after")).toBe("3600");
  });
});
