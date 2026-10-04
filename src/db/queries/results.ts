// The numbers of Results (stories/E8-1, acceptance 2, 3, 6 and 7): one SQL query per
// instrument, computed in the database (CLAUDE.md, dashboard rules), taking the page's one
// filter (src/lib/results-filter.ts) and the include-unsubmitted switch. rows() returns the
// answers the same filter keeps, one row per answer, which E10-1's CSV writes and which the
// reconciliation test (src/db/queries/results.test.ts) adds up against numbers().
//
// Every table is read with the workspace id from the session (CLAUDE.md, data and security):
// an instrument of another workspace finds nothing. Raw SQL through db.execute
// (node_modules/drizzle-orm/pg-core/db.d.ts: execute), every value bound as a parameter by
// drizzle's sql template, every column name written here, never taken from the URL.
//
// The people the filter can keep are the instrument's started responses and its personal
// invites not opened yet, sent and not revoked (an invite whose email never went out reached
// nobody): an invite carries the name and role its About you would start with
// (carriedFields, src/lib/respondent-rules.ts), and nothing else. The
// answers counted are those of the started responses kept, submitted ones only when the
// switch is off (decision 0030). Items and their visibility to a person follow
// src/lib/perspectives.ts isVisible (an item with no perspective is for everyone).
import { eq, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema";
import type { WorkspaceId } from "@/db/types";
import type { ResultsFilter } from "@/lib/results-filter";
import type { ResultsNumbers } from "@/lib/results-tiles";
import { isUuid } from "./scoped";

const list = (values: string[]) => sql.join(values.map((v) => sql`${v}`), sql`, `);

// The conditions on one person (the alias p of the people below).
function personConditions(ws: WorkspaceId, f: ResultsFilter): SQL[] {
  const conds: SQL[] = [];
  for (const [key, v] of Object.entries(f.fields)) {
    conds.push(Array.isArray(v) ? sql`(p.fields ->> ${key}) in (${list(v)})` : sql`strpos(lower(coalesce(p.fields ->> ${key}, '')), lower(${v})) > 0`);
  }
  if (f.perspective !== null) conds.push(sql`${f.perspective} = any(p.perspectives)`);
  if (f.status.length === 1) conds.push(f.status[0] === "submitted" ? sql`p.src = 'r' and p.submitted_at is not null` : sql`p.src = 'r' and p.submitted_at is null`);
  if (f.status.length === 2) conds.push(sql`p.src = 'r'`);
  const answered = (kinds: string[] | null) => sql`exists (select 1 from answer a where a.workspace_id = ${ws} and a.response_id = p.id${kinds ? sql` and a.kind in (${list(kinds)})` : sql``}${f.withComment ? sql` and (a.reason is not null or a.comment is not null)` : sql``})`;
  const real = f.kinds.filter((k) => k !== "none");
  if (f.kinds.length === 0 && f.withComment) conds.push(answered(null));
  if (f.kinds.length > 0) {
    const either: SQL[] = [];
    if (real.length > 0) either.push(answered(real));
    if (f.kinds.includes("none")) {
      const unanswered = sql`exists (select 1 from its where (cardinality(its.perspectives) = 0 or its.perspectives && p.perspectives) and not exists (select 1 from answer a where a.workspace_id = ${ws} and a.response_id = p.id and a.item_id = its.id))`;
      either.push(f.withComment ? sql`(${unanswered} and ${answered(null)})` : unanswered);
    }
    conds.push(sql`(${sql.join(either, sql` or `)})`);
  }
  return conds;
}

// The shared head of both queries: the instrument, its items, the people, the people kept,
// and the started responses whose answers count.
function head(ws: WorkspaceId, instrumentId: string, f: ResultsFilter): SQL {
  const conds = personConditions(ws, f);
  const where = conds.length > 0 ? sql`where ${sql.join(conds, sql` and `)}` : sql``;
  return sql`with inst as (
      select id, item_set_id, project_id from instrument where workspace_id = ${ws} and id = ${instrumentId}
    ),
    its as (
      select it.id, it.perspectives from item it join inst on it.item_set_id = inst.item_set_id where it.workspace_id = ${ws}
    ),
    people as (
      select 'r'::text as src, r.id, r.fields, r.perspectives, r.submitted_at, r.first_submitted_at, r.created_at
        from response r join inst on r.instrument_id = inst.id where r.workspace_id = ${ws}
      union all
      select 'i'::text, i.id, jsonb_strip_nulls(jsonb_build_object('name', i.name, 'role', i.role_hint)), '{}'::text[], null::timestamptz, null::timestamptz, i.created_at
        from invite i join inst on i.instrument_id = inst.id
        where i.workspace_id = ${ws} and i.kind = 'personal' and i.revoked_at is null and i.sent_at is not null
          and not exists (select 1 from response r2 where r2.workspace_id = ${ws} and r2.invite_id = i.id)
    ),
    sel as (select * from people p ${where}),
    counted as (select * from sel where src = 'r' and (${f.includeUnsubmitted} or submitted_at is not null)),
    ans as (select a.id, a.response_id, a.item_id, a.kind, a.value, a.reason, a.comment from answer a join counted c on c.id = a.response_id where a.workspace_id = ${ws}),
    -- Per item, in one pass over the answers (not a scan of them per item).
    per_item as (
      select its.id, count(ans.id) as n, count(ans.id) filter (where ans.kind <> 'agree') as other, count(ans.id) filter (where ans.kind in ('change', 'disagree')) as pushed
        from its left join ans on ans.item_id = its.id group by its.id
    )`;
}

type NumbersRow = {
  invited: number; submitted: number; in_progress: number; shown: number; total: number;
  agree: number; change: number; disagree: number; unclear: number; pick: number; answered: number;
  with_comment: number; missing: number; unanswered_items: number; fully_agreed: number; pushed_back_items: number;
  median_minutes: number | null; any_answer: boolean; actions: number;
};

// One person and one missing item as the filter keeps them, for the tiles that count people
// and missing items (the reconciliation test adds them up; docs/review-list.md: E10-1's files).
export type PersonOfRows = { id: string; invited: boolean; submitted: boolean; counted: boolean; minutesToSubmit: number | null };
export type MissingRow = { id: string; responseId: string; text: string };

// One answer as the filter keeps it (E10-1 writes these; the test adds them up).
export type ResultRow = { id: string; responseId: string; itemId: string; kind: string; value: string | null; reason: string | null; comment: string | null; submitted: boolean };

export const results = {
  numbers: async (ws: WorkspaceId, instrumentId: string, f: ResultsFilter): Promise<ResultsNumbers | null> => {
    if (!isUuid(instrumentId)) return null;
    const [row] = await db.execute<NumbersRow>(sql`${head(ws, instrumentId, f)}
      select
        (select count(*) from sel)::int as invited,
        (select count(*) from sel where src = 'r' and submitted_at is not null)::int as submitted,
        (select count(*) from sel where src = 'r' and submitted_at is null)::int as in_progress,
        (select count(*) from counted)::int as shown,
        (select count(*) from people where src = 'r' and (${f.includeUnsubmitted} or submitted_at is not null))::int as total,
        (select count(*) from ans where kind = 'agree')::int as agree,
        (select count(*) from ans where kind = 'change')::int as change,
        (select count(*) from ans where kind = 'disagree')::int as disagree,
        (select count(*) from ans where kind = 'unclear')::int as unclear,
        (select count(*) from ans where kind = 'pick')::int as pick,
        (select count(*) from ans where kind <> 'pick')::int as answered,
        (select count(*) from ans where reason is not null or comment is not null)::int as with_comment,
        (select count(*) from missing_item m join counted c on c.id = m.response_id where m.workspace_id = ${ws})::int as missing,
        (select count(*) from per_item where n = 0)::int as unanswered_items,
        (select count(*) from per_item where n > 0 and other = 0)::int as fully_agreed,
        (select count(*) from per_item where pushed > 0)::int as pushed_back_items,
        (select round((percentile_cont(0.5) within group (order by greatest(0, extract(epoch from (first_submitted_at - created_at)) / 60)))::numeric)::int
          from sel where src = 'r' and first_submitted_at is not null) as median_minutes,
        exists (select 1 from answer a join response r on r.id = a.response_id join inst on r.instrument_id = inst.id where a.workspace_id = ${ws} and r.workspace_id = ${ws}) as any_answer,
        (select count(*) from insight s join inst on s.project_id = inst.project_id where s.workspace_id = ${ws} and s.state = 'open')::int as actions,
        (select count(*) from inst)::int as found`);
    if (!row || (row as NumbersRow & { found: number }).found === 0) return null;
    return {
      invited: row.invited, submitted: row.submitted, inProgress: row.in_progress, shown: row.shown, total: row.total,
      agree: row.agree, change: row.change, disagree: row.disagree, unclear: row.unclear, pick: row.pick, answered: row.answered,
      withComment: row.with_comment, missing: row.missing, unansweredItems: row.unanswered_items, fullyAgreed: row.fully_agreed,
      pushedBackItems: row.pushed_back_items, medianMinutes: row.median_minutes, anyAnswer: row.any_answer, actions: row.actions,
    };
  },
  rows: async (ws: WorkspaceId, instrumentId: string, f: ResultsFilter): Promise<ResultRow[]> => {
    if (!isUuid(instrumentId)) return [];
    const rows = await db.execute<{ id: string; response_id: string; item_id: string; kind: string; value: string | null; reason: string | null; comment: string | null; submitted: boolean }>(sql`${head(ws, instrumentId, f)}
      select ans.id, ans.response_id, ans.item_id, ans.kind, ans.value, ans.reason, ans.comment, (c.submitted_at is not null) as submitted
        from ans join counted c on c.id = ans.response_id order by ans.response_id, ans.item_id`);
    return rows.map((r) => ({ id: r.id, responseId: r.response_id, itemId: r.item_id, kind: r.kind, value: r.value, reason: r.reason, comment: r.comment, submitted: r.submitted }));
  },
  people: async (ws: WorkspaceId, instrumentId: string, f: ResultsFilter): Promise<PersonOfRows[]> => {
    if (!isUuid(instrumentId)) return [];
    const rows = await db.execute<{ id: string; src: string; submitted: boolean; counted: boolean; minutes: number | null }>(sql`${head(ws, instrumentId, f)}
      select sel.id, sel.src, (sel.submitted_at is not null) as submitted, exists (select 1 from counted c where c.id = sel.id) as counted,
          case when sel.first_submitted_at is not null then greatest(0, extract(epoch from (sel.first_submitted_at - sel.created_at)) / 60)::float end as minutes
        from sel order by sel.id`);
    return rows.map((r) => ({ id: r.id, invited: r.src === "i", submitted: r.submitted, counted: r.counted, minutesToSubmit: r.minutes }));
  },
  missing: async (ws: WorkspaceId, instrumentId: string, f: ResultsFilter): Promise<MissingRow[]> => {
    if (!isUuid(instrumentId)) return [];
    const rows = await db.execute<{ id: string; response_id: string; text: string }>(sql`${head(ws, instrumentId, f)}
      select m.id, m.response_id, m.text from missing_item m join counted c on c.id = m.response_id where m.workspace_id = ${ws} order by m.created_at, m.id`);
    return rows.map((r) => ({ id: r.id, responseId: r.response_id, text: r.text }));
  },
};

// The PM's choices on Results, per instrument (user.results_prefs, INTERFACES.md
// ResultsPrefs): the tiles and the include-unsubmitted switch. Keyed by the signed-in person's
// id; the caller checks first that the instrument is in the current workspace.
export type ResultsPref = { tiles?: unknown; includeUnsubmitted?: unknown; view?: unknown };
export const resultsPrefs = {
  get: async (userId: string, instrumentId: string): Promise<ResultsPref> => {
    const [row] = await db.select({ prefs: user.resultsPrefs }).from(user).where(eq(user.id, userId));
    const one = row?.prefs?.[instrumentId];
    return one && typeof one === "object" ? one : {};
  },
  // Merges `patch` into the instrument's entry in one statement (jsonb ||, jsonb_set:
  // postgresql.org/docs/current/functions-json.html).
  set: async (userId: string, instrumentId: string, patch: { tiles?: string[]; includeUnsubmitted?: boolean }): Promise<void> => {
    if (!isUuid(instrumentId)) return;
    await db.update(user).set({
      resultsPrefs: sql`jsonb_set(${user.resultsPrefs}, array[${instrumentId}]::text[], coalesce(${user.resultsPrefs} -> ${instrumentId}, '{}'::jsonb) || ${JSON.stringify(patch)}::jsonb)`,
    }).where(eq(user.id, userId));
  },
};
