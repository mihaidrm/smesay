// A feedback report (stories/E17-1, decision 0069): the checks on what the form sends, the
// hourly cap per workspace, the row, and the email to every admin address. Called from the
// page's server action; the queries are scoped to the workspace the session carries.
import { feedbackReports } from "@/db/queries";
import { FEEDBACK_KINDS, FEEDBACK_PAGE_MAX, FEEDBACK_TEXT_MAX, type FeedbackKind, type WorkspaceId } from "@/db/types";
import { adminEmails } from "@/lib/admin";
import { FEEDBACK_COPY as C } from "@/lib/feedback-copy";
import { log } from "@/lib/log";
import { sendMail, type Mail } from "@/lib/mail";

export const FEEDBACK_HOURLY_CAP = 20;
const HOUR_MS = 60 * 60 * 1000;

export type Checked = { kind: FeedbackKind; text: string; page: string | null };

// The page is kept only as a path of this app (acceptance 2): starts with "/", one line, at
// most 300 characters; anything else is no page.
export function pagePath(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const v = value.trim();
  if (!v.startsWith("/") || v.startsWith("//") || v.length > FEEDBACK_PAGE_MAX || /[\r\n]/.test(v)) return null;
  return v;
}

export function checkReport(input: { kind: unknown; text: unknown; page: unknown }): { ok: true; report: Checked } | { ok: false; error: string } {
  const kind = typeof input.kind === "string" && (FEEDBACK_KINDS as readonly string[]).includes(input.kind) ? (input.kind as FeedbackKind) : null;
  if (!kind) return { ok: false, error: C.errors.kind };
  const text = typeof input.text === "string" ? input.text.trim() : "";
  if (text.length === 0) return { ok: false, error: C.errors.empty };
  if (text.length > FEEDBACK_TEXT_MAX) return { ok: false, error: C.errors.long };
  return { ok: true, report: { kind, text, page: pagePath(input.page) } };
}

// Email 12 (docs/copy/emails.md): text only, one per admin address.
export function adminFeedbackMail(to: string, r: { kind: FeedbackKind; workspaceName: string; senderEmail: string; page: string | null; text: string; url: string; at: Date }): Mail {
  const when = r.at.toISOString().replace("T", " ").slice(0, 16) + " UTC";
  return {
    to,
    subject: `Feedback, ${C.kinds[r.kind].toLowerCase()}: ${r.workspaceName}`,
    text: `${r.senderEmail} sent this from ${r.workspaceName} on ${when}, about ${r.page ?? C.noPage}:\n\n${r.text}\n\nOpen the reports: ${r.url}\nReply to this email to answer ${r.senderEmail}.`,
    replyTo: r.senderEmail,
  };
}

export type SendContext = { ws: WorkspaceId; userId: string; senderEmail: string; workspaceName: string; origin: string | null };
export type SendDeps = { now?: Date; send?: (mail: Mail) => Promise<void>; admins?: string[] };

export async function sendReport(ctx: SendContext, input: { kind: unknown; text: unknown; page: unknown }, deps: SendDeps = {}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const checked = checkReport(input);
  if (!checked.ok) return checked;
  const now = deps.now ?? new Date();
  if ((await feedbackReports.countSince(ctx.ws, new Date(now.getTime() - HOUR_MS))) >= FEEDBACK_HOURLY_CAP) return { ok: false, error: C.errors.capped };
  const row = await feedbackReports.create(ctx.ws, { userId: ctx.userId, ...checked.report });
  const send = deps.send ?? sendMail;
  const url = ctx.origin ? new URL("/admin/feedback", ctx.origin).toString() : "/admin/feedback";
  for (const to of deps.admins ?? adminEmails()) {
    try {
      await send(adminFeedbackMail(to, { ...checked.report, workspaceName: ctx.workspaceName, senderEmail: ctx.senderEmail, url, at: row.createdAt }));
    } catch (error) {
      log("error", "feedback: the admin email was not sent; the report is kept.", { detail: row.id, error: error instanceof Error ? error.message : String(error) });
    }
  }
  return { ok: true, id: row.id };
}
