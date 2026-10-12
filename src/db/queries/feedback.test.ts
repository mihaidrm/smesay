// The feedback rows (stories/E17-1, acceptance 3, 4 and 6): a member's report, the workspace's
// list, the hourly cap, the admin's inbox with its filter, solve, reopen and remove inside
// audited(), and the A/B isolation.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { ensureTestDatabase } from "@/db/test-db";
import { feedbackReports } from "@/db/queries";
import { audited, feedbackInbox, feedbackReport, removeFeedback, setFeedbackStatus } from "@/db/queries/admin";
import { internal } from "@/db/queries/internal";
import { workspaces } from "@/db/queries/workspaces";
import { unsafeWorkspaceId } from "@/db/queries/scoped";
import type { AdminProof } from "@/db/types";
import { FEEDBACK_HOURLY_CAP, sendReport } from "@/lib/feedback";
import { FEEDBACK_COPY as C } from "@/lib/feedback-copy";
import type { Mail } from "@/lib/mail";

const stamp = Date.now();
const adminId = `fb-admin-${stamp}`;
const anaId = `fb-ana-${stamp}`;
const bobId = `fb-bob-${stamp}`;
const proof = { checked: "admin", userId: adminId } as AdminProof;
let sql: ReturnType<typeof postgres>;
let wsA: ReturnType<typeof unsafeWorkspaceId>;
let wsB: ReturnType<typeof unsafeWorkspaceId>;
const made: string[] = [];

beforeAll(async () => {
  const url = await ensureTestDatabase();
  sql = postgres(url, { max: 1 });
  await migrate(drizzle(sql), { migrationsFolder: "drizzle" });
  for (const [id, email] of [[adminId, `${adminId}@example.com`], [anaId, `ana-${stamp}@marlow.example`], [bobId, `bob-${stamp}@other.example`]]) {
    await sql`insert into "user" (id, name, email, email_verified, created_at, updated_at) values (${id}, ${id}, ${email}, true, now(), now())`;
  }
  const a = await workspaces.create({ name: `Feedback A ${stamp}`, slug: `feedback-a-${stamp}` }, anaId);
  const b = await workspaces.create({ name: `Feedback B ${stamp}`, slug: `feedback-b-${stamp}` }, bobId);
  wsA = unsafeWorkspaceId(a.id); wsB = unsafeWorkspaceId(b.id);
  made.push(a.id, b.id);
}, 60_000);

afterAll(async () => {
  await sql`delete from admin_audit where admin_user_id = ${adminId}`;
  for (const id of made) await internal.hardDeleteWorkspace(id);
  await sql`delete from "user" where id in (${adminId}, ${anaId}, ${bobId})`;
  await sql.end();
});

const sent: Mail[] = [];
const send = async (mail: Mail) => { sent.push(mail); };
const ctxA = () => ({ ws: wsA, userId: anaId, senderEmail: `ana-${stamp}@marlow.example`, workspaceName: `Feedback A ${stamp}`, origin: "https://smesay.example" });

describe("a report", () => {
  it("is written with its page, listed newest first for its workspace only, and emails every admin address with Reply-To", async () => {
    const r1 = await sendReport(ctxA(), { kind: "wrong", text: "The CSV has no header.", page: "/app/projects/p/results" }, { send, admins: ["one@example.com", "two@example.com"], now: new Date(Date.now() - 1000) });
    expect(r1.ok).toBe(true);
    const r2 = await sendReport(ctxA(), { kind: "idea", text: "A dark mode for the PDF.", page: "nope" }, { send, admins: ["one@example.com"] });
    expect(r2.ok).toBe(true);
    expect(sent).toHaveLength(3);
    expect(sent[0]).toMatchObject({ to: "one@example.com", subject: `Feedback, something is wrong: Feedback A ${stamp}`, replyTo: `ana-${stamp}@marlow.example` });
    expect(sent[0].text).toContain("about /app/projects/p/results:\n\nThe CSV has no header.\n\nOpen the reports: https://smesay.example/admin/feedback");
    expect(sent[2].text).toContain("about no page:");
    const list = await feedbackReports.list(wsA);
    expect(list.map((r) => [r.kind, r.text, r.page, r.status, r.senderEmail])).toEqual([["idea", "A dark mode for the PDF.", null, "open", `ana-${stamp}@marlow.example`], ["wrong", "The CSV has no header.", "/app/projects/p/results", "open", `ana-${stamp}@marlow.example`]]);
    expect(await feedbackReports.list(wsB)).toEqual([]);
    await sendReport({ ...ctxA(), ws: wsB, userId: bobId, senderEmail: "bob@other.example", workspaceName: "B" }, { kind: "question", text: "Where is the export?", page: null }, { send, admins: [] });
    expect((await feedbackReports.list(wsA)).map((r) => r.text)).not.toContain("Where is the export?");
    expect((await feedbackReports.list(wsB)).map((r) => r.text)).toEqual(["Where is the export?"]);
  });

  it("keeps the row when the admin email fails, and refuses a bad field before writing anything", async () => {
    const before = (await feedbackReports.list(wsB)).length;
    const failing = async () => { throw new Error("smtp down"); };
    const r = await sendReport({ ...ctxA(), ws: wsB, userId: bobId, senderEmail: "bob@other.example", workspaceName: "B" }, { kind: "other", text: "Mail is down.", page: null }, { send: failing, admins: ["one@example.com"] });
    expect(r.ok).toBe(true);
    expect((await feedbackReports.list(wsB)).length).toBe(before + 1);
    expect(await sendReport(ctxA(), { kind: "idea", text: "", page: null }, { send, admins: [] })).toEqual({ ok: false, error: C.errors.empty });
  });

  it("is refused past 20 in an hour for the workspace, with its line", async () => {
    const have = await feedbackReports.countSince(wsA, new Date(Date.now() - 3_600_000));
    for (let i = have; i < FEEDBACK_HOURLY_CAP; i++) expect((await sendReport(ctxA(), { kind: "other", text: `Report ${i}`, page: null }, { send, admins: [] })).ok).toBe(true);
    expect(await sendReport(ctxA(), { kind: "other", text: "One more", page: null }, { send, admins: [] })).toEqual({ ok: false, error: C.errors.capped });
    // The other workspace is not capped by A's reports.
    expect((await sendReport({ ...ctxA(), ws: wsB, userId: bobId }, { kind: "other", text: "B is fine", page: null }, { send, admins: [] })).ok).toBe(true);
  });
});

describe("the admin inbox", () => {
  it("lists every workspace's reports by status, solves, reopens and removes inside audited()", async () => {
    const mine = (rows: Awaited<ReturnType<typeof feedbackInbox>>) => rows.filter((r) => r.workspaceId === wsA || r.workspaceId === wsB);
    const open = mine(await feedbackInbox(proof, "open"));
    expect(open.length).toBeGreaterThanOrEqual(3);
    expect(open.every((r) => r.status === "open")).toBe(true);
    const target = open.find((r) => r.text === "The CSV has no header.")!;
    expect(target).toMatchObject({ workspaceName: `Feedback A ${stamp}`, senderEmail: `ana-${stamp}@marlow.example`, kind: "wrong", page: "/app/projects/p/results", solvedAt: null, solvedByEmail: null });
    expect(await feedbackReport(proof, target.id)).toEqual({ id: target.id, ws: wsA, status: "open" });
    expect(await feedbackReport(proof, "not-a-uuid")).toBeNull();

    const at = new Date("2026-10-12T10:00:00Z");
    expect(await audited(proof, { action: "feedback_solved", targetWorkspaceId: wsA, changes: { feedback: target.id } }, () => setFeedbackStatus(proof, target.id, "solved", adminId, at))).toBe(true);
    const solved = mine(await feedbackInbox(proof, "solved"));
    expect(solved.map((r) => r.id)).toEqual([target.id]);
    expect(solved[0]).toMatchObject({ status: "solved", solvedAt: at, solvedByEmail: `${adminId}@example.com` });
    expect(mine(await feedbackInbox(proof, "open")).map((r) => r.id)).not.toContain(target.id);
    expect((await feedbackReports.list(wsA)).find((r) => r.id === target.id)).toMatchObject({ status: "solved", solvedAt: at });

    expect(await audited(proof, { action: "feedback_reopened", targetWorkspaceId: wsA, changes: { feedback: target.id } }, () => setFeedbackStatus(proof, target.id, "open", adminId))).toBe(true);
    expect((await feedbackReports.list(wsA)).find((r) => r.id === target.id)).toMatchObject({ status: "open", solvedAt: null });

    expect(await audited(proof, { action: "feedback_removed", targetWorkspaceId: wsA, changes: { feedback: target.id } }, () => removeFeedback(proof, target.id))).toBe(true);
    expect(await feedbackReport(proof, target.id)).toBeNull();
    expect(await setFeedbackStatus(proof, target.id, "solved", adminId)).toBe(false);
    expect(await removeFeedback(proof, target.id)).toBe(false);
    expect(mine(await feedbackInbox(proof, "all")).map((r) => r.id)).not.toContain(target.id);

    const rows = await sql`select action, outcome, changes from admin_audit where admin_user_id = ${adminId} and target_workspace_id = ${wsA} order by created_at`;
    expect(rows).toEqual([
      { action: "feedback_solved", outcome: "done", changes: { feedback: target.id } },
      { action: "feedback_reopened", outcome: "done", changes: { feedback: target.id } },
      { action: "feedback_removed", outcome: "done", changes: { feedback: target.id } },
    ]);
  });

  it("goes with the workspace", async () => {
    const c = await workspaces.create({ name: `Feedback C ${stamp}`, slug: `feedback-c-${stamp}` }, anaId);
    const wsC = unsafeWorkspaceId(c.id);
    await feedbackReports.create(wsC, { userId: anaId, kind: "idea", text: "Short-lived", page: null });
    expect((await feedbackReports.list(wsC)).length).toBe(1);
    await internal.hardDeleteWorkspace(c.id);
    expect((await sql`select count(*)::int as n from feedback where workspace_id = ${c.id}`)[0].n).toBe(0);
  });
});
