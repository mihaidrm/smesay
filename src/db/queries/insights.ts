// Workspace-scoped helpers for the insight table (stories/E1-3). Every call takes the workspace id
// first; see scoped.ts for the rule. E9-1: what the actions run reads (inputFor), the actions
// with their citations resolved for the Actions tab (listWithCitations), and the store that
// replaces a project's open actions and keeps the done and dismissed ones (replaceOpen).
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { insight } from "@/db/schema";
import type { InsightKind, WorkspaceId } from "@/db/types";
import { textFor, type ReaderFields } from "@/lib/item-text";
import { isUuid, scoped } from "./scoped";

export type Insight = typeof insight.$inferSelect;
const base = scoped(insight);

// One answer the run reads: from a submitted response of the instrument (what Results counts
// with the include-unsubmitted switch off, decision 0030), with the respondent's fields.
export type InputAnswer = { id: string; itemId: string; responseId: string; kind: string; value: string | null; reason: string | null; comment: string | null; fields: Record<string, string> };
export type InputMissing = { id: string; responseId: string; text: string; area: string | null; value: string | null; fields: Record<string, string> };

// A citation as the tab shows it: the respondent's name as on Results (the name field, else a
// personal invite's name or email, else "Anonymous [N]" by the public link's start order).
export type CitedAnswer = { id: string; itemId: string; reference: string | null; title: string; who: string | null; anon: number | null };
export type CitedMissing = { id: string; who: string | null; anon: number | null };
export type InsightWithCitations = Insight & { answers: CitedAnswer[]; missing: CitedMissing[] };

const ids = (list: string[]) => sql.join(list.map((id) => sql`${id}`), sql`, `);

const people = (ws: WorkspaceId) => sql`
  people as (
    select r.id, r.instrument_id,
        coalesce(nullif(r.fields ->> 'name', ''), case when iv.kind = 'personal' then coalesce(nullif(iv.name, ''), iv.email) end) as who,
        case when coalesce(r.fields ->> 'name', '') = '' and iv.kind = 'public'
          then row_number() over (partition by r.instrument_id, iv.kind order by r.created_at, r.id) end as anon
      from response r join invite iv on iv.id = r.invite_id and iv.workspace_id = ${ws}
      where r.workspace_id = ${ws}
  )`;

export const insights = {
  ...base,
  inputFor: async (ws: WorkspaceId, instrumentId: string): Promise<{ answers: InputAnswer[]; missing: InputMissing[] }> => {
    if (!isUuid(instrumentId)) return { answers: [], missing: [] };
    const answers = await db.execute<{ id: string; item_id: string; response_id: string; kind: string; value: string | null; reason: string | null; comment: string | null; fields: Record<string, string> | null }>(sql`
      select a.id, a.item_id, a.response_id, a.kind, a.value, a.reason, a.comment, r.fields
        from answer a join response r on r.id = a.response_id and r.workspace_id = ${ws}
        where a.workspace_id = ${ws} and r.instrument_id = ${instrumentId} and r.submitted_at is not null
        order by r.created_at, r.id, a.item_id`);
    const missing = await db.execute<{ id: string; response_id: string; text: string; suggested_area: string | null; suggested_value: string | null; fields: Record<string, string> | null }>(sql`
      select m.id, m.response_id, m.text, m.suggested_area, m.suggested_value, r.fields
        from missing_item m join response r on r.id = m.response_id and r.workspace_id = ${ws}
        where m.workspace_id = ${ws} and r.instrument_id = ${instrumentId} and r.submitted_at is not null
        order by m.created_at, m.id`);
    return {
      answers: answers.map((a) => ({ id: a.id, itemId: a.item_id, responseId: a.response_id, kind: a.kind, value: a.value, reason: a.reason, comment: a.comment, fields: a.fields ?? {} })),
      missing: missing.map((m) => ({ id: m.id, responseId: m.response_id, text: m.text, area: m.suggested_area, value: m.suggested_value, fields: m.fields ?? {} })),
    };
  },

  listWithCitations: async (ws: WorkspaceId, projectId: string): Promise<InsightWithCitations[]> => {
    if (!isUuid(projectId)) return [];
    const rows = await db.select().from(insight).where(and(eq(insight.workspaceId, ws), eq(insight.projectId, projectId)));
    if (rows.length === 0) return [];
    const answerIds = rows.flatMap((r) => r.citedAnswerIds);
    const missingIds = rows.flatMap((r) => r.citedMissingItemIds);
    const answers = answerIds.length === 0 ? [] : await db.execute<{ id: string; item_id: string; source_ref: string | null; original_text: string; reader_text: string | null; reader_status: string | null; who: string | null; anon: string | number | null }>(sql`
      with ${people(ws)}
      select a.id, a.item_id, it.source_ref, it.original_text, it.reader_text, it.reader_status, p.who, p.anon
        from answer a join people p on p.id = a.response_id join item it on it.id = a.item_id and it.workspace_id = ${ws}
        where a.workspace_id = ${ws} and a.id in (${ids(answerIds)})`);
    const missing = missingIds.length === 0 ? [] : await db.execute<{ id: string; who: string | null; anon: string | number | null }>(sql`
      with ${people(ws)}
      select m.id, p.who, p.anon
        from missing_item m join people p on p.id = m.response_id
        where m.workspace_id = ${ws} and m.id in (${ids(missingIds)})`);
    const answerOf = new Map(answers.map((a) => [a.id, { id: a.id, itemId: a.item_id, reference: a.source_ref, title: textFor({ readerStatus: a.reader_status as ReaderFields["readerStatus"], readerText: a.reader_text, originalText: a.original_text }), who: a.who, anon: a.anon === null ? null : Number(a.anon) }]));
    const missingOf = new Map(missing.map((m) => [m.id, { id: m.id, who: m.who, anon: m.anon === null ? null : Number(m.anon) }]));
    const order = { open: 0, done: 1, dismissed: 2 } as const;
    return rows
      .sort((a, b) => order[a.state] - order[b.state] || a.createdAt.getTime() - b.createdAt.getTime())
      .map((r) => ({ ...r, answers: r.citedAnswerIds.flatMap((id) => answerOf.get(id) ?? []), missing: r.citedMissingItemIds.flatMap((id) => missingOf.get(id) ?? []) }));
  },

  // A new run (E9-1, acceptance 4): the project's open actions go, the done and dismissed ones
  // stay (E9-2), and the new ones are written, in one transaction, a millisecond apart in the
  // model's order so the tab lists them as written (one statement would stamp them alike).
  replaceOpen: async (ws: WorkspaceId, projectId: string, rows: { kind: InsightKind; title: string; why: string; citedAnswerIds: string[]; citedMissingItemIds: string[]; model: string; tokensIn: number; tokensOut: number; costEurCents: number }[]): Promise<Insight[]> =>
    db.transaction(async (tx) => {
      await tx.delete(insight).where(and(eq(insight.workspaceId, ws), eq(insight.projectId, projectId), eq(insight.state, "open")));
      if (rows.length === 0) return [];
      const at = Date.now();
      return tx.insert(insight).values(rows.map((r, i) => ({ ...r, workspaceId: ws, projectId, state: "open" as const, createdAt: new Date(at + i) }))).returning();
    }),
};
