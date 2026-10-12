// The checks and the email of a feedback report (stories/E17-1, acceptance 2 and 5): pure,
// no database; the row and the cap are in src/db/queries/feedback.test.ts.
import { describe, expect, it } from "vitest";
import { adminFeedbackMail, checkReport, pagePath } from "./feedback";
import { FEEDBACK_COPY as C } from "./feedback-copy";

describe("checkReport", () => {
  it("takes the four kinds, trims the text and keeps a path of this app", () => {
    expect(checkReport({ kind: "wrong", text: "  The export is empty.  ", page: "/app/projects/x/results" })).toEqual({ ok: true, report: { kind: "wrong", text: "The export is empty.", page: "/app/projects/x/results" } });
    for (const kind of ["idea", "question", "other"]) expect(checkReport({ kind, text: "x", page: null }).ok).toBe(true);
  });
  it("refuses a missing kind, an empty text and a text past 2,000 characters, each with its line", () => {
    expect(checkReport({ kind: "bug", text: "x", page: null })).toEqual({ ok: false, error: C.errors.kind });
    expect(checkReport({ kind: null, text: "x", page: null })).toEqual({ ok: false, error: C.errors.kind });
    expect(checkReport({ kind: "idea", text: "   ", page: null })).toEqual({ ok: false, error: C.errors.empty });
    expect(checkReport({ kind: "idea", text: "x".repeat(2001), page: null })).toEqual({ ok: false, error: C.errors.long });
    expect(checkReport({ kind: "idea", text: "x".repeat(2000), page: null }).ok).toBe(true);
  });
  it("keeps the page only as one line that starts with a slash, at most 300 characters", () => {
    expect(pagePath("/app/settings")).toBe("/app/settings");
    expect(pagePath(" /app ")).toBe("/app");
    expect(pagePath("https://evil.example/app")).toBeNull();
    expect(pagePath("//evil.example")).toBeNull();
    expect(pagePath("/app\nX")).toBeNull();
    expect(pagePath("/" + "a".repeat(300))).toBeNull();
    expect(pagePath("")).toBeNull();
    expect(pagePath(undefined)).toBeNull();
  });
});

describe("adminFeedbackMail", () => {
  it("is text only, names the kind and the workspace, carries the page, the text, the link and Reply-To", () => {
    const mail = adminFeedbackMail("mihai@example.com", { kind: "idea", workspaceName: "Marlow Group", senderEmail: "ana@marlow.example", page: "/app/projects/1/build", text: "Reordering items by drag would help.", url: "https://smesay.com/admin/feedback", at: new Date("2026-10-12T09:30:00Z") });
    expect(mail.to).toBe("mihai@example.com");
    expect(mail.subject).toBe("Feedback, an idea: Marlow Group");
    expect(mail.replyTo).toBe("ana@marlow.example");
    expect(mail.html).toBeUndefined();
    expect(mail.text).toBe("ana@marlow.example sent this from Marlow Group on 2026-10-12 09:30 UTC, about /app/projects/1/build:\n\nReordering items by drag would help.\n\nOpen the reports: https://smesay.com/admin/feedback\nReply to this email to answer ana@marlow.example.");
    expect(adminFeedbackMail("m@x.example", { kind: "wrong", workspaceName: "W", senderEmail: "a@x.example", page: null, text: "t", url: "/admin/feedback", at: new Date(0) }).text).toContain("about no page:");
  });
  it("says AI nowhere on the form", () => {
    expect(JSON.stringify(C)).not.toMatch(/\bAI\b/);
  });
});
