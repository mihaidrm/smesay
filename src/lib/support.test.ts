// The question bubble's server checks (stories/E12-5, acceptance 3, 4 and 8): the fields, the
// hidden field, the two limits and email 5 with Reply-To.
import { beforeEach, describe, expect, it } from "vitest";
import { giveBack, QUESTION_MAX, readSupport, supportByAddress, supportByConnection, supportEmail, SUPPORT_PER_ADDRESS, SUPPORT_PER_CONNECTION, takeAddress, takeConnection } from "./support";
import { LOCAL } from "./ratelimit";
import { SUPPORT_COPY } from "./support-copy";

const ok = { email: " ana@marlow.example ", question: "Can experts answer in Romanian?", page: "/landing-page" };

describe("the question bubble", () => {
  beforeEach(() => { supportByAddress.clear(); supportByConnection.clear(); });

  it("takes an address and a question of 1 to 2000 characters, trimmed", () => {
    expect(readSupport(ok)).toEqual({ input: { email: "ana@marlow.example", question: "Can experts answer in Romanian?", page: "/landing-page", trap: false } });
    expect(readSupport({ ...ok, question: "x".repeat(QUESTION_MAX) })).toHaveProperty("input");
  });

  it("names the field that is wrong", () => {
    expect(readSupport({ ...ok, email: "" })).toEqual({ problem: "email" });
    expect(readSupport({ ...ok, email: "ana@marlow" })).toEqual({ problem: "email" });
    expect(readSupport({ ...ok, email: `${"a".repeat(250)}@x.io` })).toEqual({ problem: "email" });
    expect(readSupport({ ...ok, question: "   " })).toEqual({ problem: "questionEmpty" });
    expect(readSupport({ ...ok, question: "x".repeat(QUESTION_MAX + 1) })).toEqual({ problem: "questionLong" });
    expect(readSupport(null)).toEqual({ problem: "email" });
    expect(readSupport({ email: 5, question: ["a"] })).toEqual({ problem: "email" });
  });

  it("refuses an address with header syntax or control characters, so Reply-To is what was typed", () => {
    for (const email of ["a@b.c,x", "a@b.c;x@y.z", "a@b.c(comment)", "victim<attacker@evil.example>", "\"a\"@b.c", "a@b.c\u0000Bcc:z", "a@b.c\u0085", "a\\b@c.d"]) expect(readSupport({ ...ok, email })).toEqual({ problem: "email" });
    expect(readSupport({ ...ok, email: "a.b+c@x-y.io" })).toHaveProperty("input");
  });

  it("marks a filled hidden field before any other check, and keeps the page to the site's own path", () => {
    expect(readSupport({ ...ok, website: "spam.example" })).toMatchObject({ input: { trap: true } });
    expect(readSupport({ email: "not an address", question: "", website: "spam.example" })).toMatchObject({ input: { trap: true } });
    expect(readSupport({ ...ok, page: "https://evil.example/x" })).toMatchObject({ input: { page: "/landing-page" } });
    expect(readSupport({ ...ok, page: "/pricing" })).toMatchObject({ input: { page: "/pricing" } });
  });

  it("allows 5 questions per address an hour, whatever the case of the address", () => {
    const now = Date.UTC(2026, 9, 5, 12);
    for (let i = 0; i < SUPPORT_PER_ADDRESS; i++) expect(takeAddress(i % 2 ? "ANA@marlow.example" : "ana@marlow.example", now).allowed).toBe(true);
    expect(takeAddress("ana@marlow.example", now)).toEqual({ allowed: false, retryAfterMs: 60 * 60_000 });
    expect(takeAddress("ana@marlow.example", now + 60 * 60_000).allowed).toBe(true);
  });

  it("allows 20 posts per connection an hour, and does not count a request with no address", () => {
    const now = Date.UTC(2026, 9, 5, 12);
    for (let i = 0; i < SUPPORT_PER_CONNECTION; i++) expect(takeConnection("10.0.0.1", now).allowed).toBe(true);
    expect(takeConnection("10.0.0.1", now).allowed).toBe(false);
    for (let i = 0; i < SUPPORT_PER_CONNECTION + 5; i++) expect(takeConnection(LOCAL, now).allowed).toBe(true);
  });

  it("gives both counts back when the mail did not go", () => {
    const now = Date.UTC(2026, 9, 5, 12);
    for (let i = 0; i < SUPPORT_PER_ADDRESS; i++) { takeConnection("10.0.0.2", now); takeAddress("bo@x.io", now); giveBack("BO@x.io", "10.0.0.2"); }
    expect(takeAddress("bo@x.io", now).allowed).toBe(true);
    expect(takeConnection("10.0.0.2", now).allowed).toBe(true);
  });

  it("builds email 5: text only, the question as written, Reply-To the visitor", () => {
    const input = { email: "ana@marlow.example", question: "Line one\nLine two", page: "/landing-page", trap: false };
    const mail = supportEmail("mihai@example.com", input, "https://smesay.app", new Date(Date.UTC(2026, 9, 5, 14, 7)));
    expect(mail).toEqual({
      to: "mihai@example.com",
      subject: "Question from the landing page: ana@marlow.example",
      replyTo: "ana@marlow.example",
      text: "Line one\nLine two\n\nThe visitor sent this from https://smesay.app/landing-page on 2026-10-05 14:07 UTC. Reply to this email to answer.\n",
    });
    expect(mail).not.toHaveProperty("html");
  });

  it("has the words of docs/copy/landing.md, with no AI in them", () => {
    expect(SUPPORT_COPY.sent("ana@marlow.example")).toBe("Sent. We will reply to ana@marlow.example.");
    expect(SUPPORT_COPY.questionLong(QUESTION_MAX)).toBe("Keep your question to 2,000 characters.");
    expect(SUPPORT_COPY.tooMany(5, "hello@smesay.app")).toBe("You have sent 5 questions in the last hour. Email hello@smesay.app instead.");
    expect(SUPPORT_COPY.tooManyConnection("hello@smesay.app")).toBe("Too many questions came from your connection in the last hour. Email hello@smesay.app instead.");
    const all = Object.values(SUPPORT_COPY).map((v) => (typeof v === "function" ? (v as (...a: unknown[]) => string)(5, "x") : v)).join(" ");
    expect(all).not.toMatch(/\bAI\b/);
  });
});
