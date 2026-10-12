// The emails a person gets and what the emails have done (stories/E16-1, E16-2): the switches
// in user.email_prefs (INTERFACES.md EmailPrefs), the stop link's token, the digest's and the
// series' marks in user.email_state (EmailState). Per person, every workspace, as the guide's
// state is (guide.ts). recipients() is the one read that crosses from a workspace to its
// members' switches. Every write is one statement on the jsonb, so two sends cannot lose a mark.
import { randomBytes } from "node:crypto";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { user, workspaceMember } from "@/db/schema";
import { DEFAULT_EMAIL_PREFS, EMAIL_KINDS, type EmailKind, type EmailPrefs, type EmailState, type WorkspaceId } from "@/db/types";

export type Recipient = { userId: string; name: string; email: string; token: string };

const readPrefs = (raw: unknown): EmailPrefs => {
  const r = (raw ?? {}) as Partial<Record<EmailKind, unknown>>;
  return Object.fromEntries(EMAIL_KINDS.map((k) => [k, typeof r[k] === "boolean" ? r[k] : DEFAULT_EMAIL_PREFS[k]])) as EmailPrefs;
};
const readState = (raw: unknown): EmailState => {
  const r = (raw ?? {}) as Partial<EmailState>;
  return {
    token: typeof r.token === "string" && r.token.length === 32 ? r.token : null,
    digestAt: typeof r.digestAt === "string" ? r.digestAt : null,
    steps: r.steps && typeof r.steps === "object" ? Object.fromEntries(Object.entries(r.steps).filter(([, v]) => typeof v === "string")) as Record<string, string> : {},
  };
};
export const isEmailKind = (k: unknown): k is EmailKind => typeof k === "string" && (EMAIL_KINDS as readonly string[]).includes(k);
export const TOKEN = /^[0-9a-f]{32}$/;

export const emails = {
  prefs: async (userId: string): Promise<EmailPrefs> => readPrefs((await db.select({ p: user.emailPrefs }).from(user).where(eq(user.id, userId)))[0]?.p),
  setPrefs: async (userId: string, prefs: EmailPrefs): Promise<void> => {
    await db.update(user).set({ emailPrefs: readPrefs(prefs) }).where(eq(user.id, userId));
  },
  state: async (userId: string): Promise<EmailState> => readState((await db.select({ s: user.emailState }).from(user).where(eq(user.id, userId)))[0]?.s),
  // The stop link's token for a person: made once, from randomBytes(16); the write sets it only
  // where none is set, so two emails at once get the same one.
  token: async (userId: string): Promise<string> => {
    const fresh = randomBytes(16).toString("hex");
    await db.update(user).set({ emailState: sql`jsonb_set(${user.emailState}, '{token}', to_jsonb(${fresh}::text))` })
      .where(and(eq(user.id, userId), sql`coalesce(${user.emailState}->>'token', '') = ''`));
    const state = await emails.state(userId);
    if (!state.token) throw new Error("The stop token could not be written.");
    return state.token;
  },
  // The stop page: the person behind a token, or null for a token not on file.
  byToken: async (token: string): Promise<{ userId: string; name: string; prefs: EmailPrefs } | null> => {
    if (!TOKEN.test(token)) return null;
    const row = (await db.select({ id: user.id, name: user.name, p: user.emailPrefs }).from(user).where(sql`${user.emailState}->>'token' = ${token}`).limit(1))[0];
    return row ? { userId: row.id, name: row.name, prefs: readPrefs(row.p) } : null;
  },
  stop: async (token: string, kind: EmailKind): Promise<boolean> => {
    if (!TOKEN.test(token)) return false;
    const rows = await db.update(user).set({ emailPrefs: sql`jsonb_set(${user.emailPrefs}, ${`{${kind}}`}::text[], 'false'::jsonb)` })
      .where(sql`${user.emailState}->>'token' = ${token}`).returning({ id: user.id });
    return rows.length > 0;
  },
  markDigest: async (userId: string, at: Date): Promise<void> => {
    await db.update(user).set({ emailState: sql`jsonb_set(${user.emailState}, '{digestAt}', to_jsonb(${at.toISOString()}::text))` }).where(eq(user.id, userId));
  },
  // Adds the steps to the series' record (sent: the instant; skipped: "skipped"), keeping the
  // ones there.
  markSteps: async (userId: string, steps: Record<string, string>): Promise<void> => {
    await db.update(user).set({ emailState: sql`jsonb_set(${user.emailState}, '{steps}', coalesce(${user.emailState}->'steps', '{}'::jsonb) || ${JSON.stringify(steps)}::jsonb)` }).where(eq(user.id, userId));
  },
  // The members of a workspace who get a kind of email, each with their stop token.
  recipients: async (workspaceId: WorkspaceId, kind: EmailKind): Promise<Recipient[]> => {
    const rows = await db.select({ id: user.id, name: user.name, email: user.email, p: user.emailPrefs, s: user.emailState })
      .from(workspaceMember).innerJoin(user, eq(user.id, workspaceMember.userId)).where(eq(workspaceMember.workspaceId, workspaceId)).orderBy(workspaceMember.createdAt);
    const out: Recipient[] = [];
    for (const r of rows) {
      if (!readPrefs(r.p)[kind]) continue;
      out.push({ userId: r.id, name: r.name, email: r.email, token: readState(r.s).token ?? (await emails.token(r.id)) });
    }
    return out;
  },
  // The people among the ids who have a kind on, with their names and tokens (the digest and
  // the series work from a list of people, not a workspace).
  people: async (userIds: string[], kind: EmailKind): Promise<(Recipient & { createdAt: Date; state: EmailState })[]> => {
    if (userIds.length === 0) return [];
    const rows = await db.select({ id: user.id, name: user.name, email: user.email, createdAt: user.createdAt, p: user.emailPrefs, s: user.emailState }).from(user).where(inArray(user.id, userIds));
    const out: (Recipient & { createdAt: Date; state: EmailState })[] = [];
    for (const r of rows) {
      if (!readPrefs(r.p)[kind]) continue;
      const state = readState(r.s);
      out.push({ userId: r.id, name: r.name, email: r.email, createdAt: r.createdAt, state, token: state.token ?? (await emails.token(r.id)) });
    }
    return out;
  },
};
