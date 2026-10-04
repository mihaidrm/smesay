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
import type { ScoringMethod, WorkspaceId } from "@/db/types";
import { MIN_GROUP } from "@/lib/results-agreement";
import type { ResultsFilter } from "@/lib/results-filter";
import { proposedCode, SCALES } from "@/lib/scoring";
import type { ResultsNumbers } from "@/lib/results-tiles";
import type { DetailCounts } from "@/lib/results-detail";
import { isUuid } from "./scoped";

const list = (values: string[]) => sql.join(values.map((v) => sql`${v}`), sql`, `);

// The conditions on one person (the alias p of the people below).
function personConditions(ws: WorkspaceId, f: ResultsFilter): SQL[] {
  const conds: SQL[] = [];
  for (const [key, v] of Object.entries(f.fields)) {
    // A text filter on the name reads the name shown (E8-2: a personal invite's name or email
    // when the field is empty), so what the filter finds is what the tab shows.
    const text = key === "name" ? sql`p.who` : sql`(p.fields ->> ${key})`;
    conds.push(Array.isArray(v) ? sql`(p.fields ->> ${key}) in (${list(v)})` : sql`strpos(lower(coalesce(${text}, '')), lower(${v})) > 0`);
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
// `once`: for a query that reads counted only once, which Postgres would inline; the planner,
// misjudging fresh rows, then re-ran the people per answer (minutes on 600 responses), so
// counted is materialized there (postgresql.org/docs/current/queries-with.html, MATERIALIZED).
function head(ws: WorkspaceId, instrumentId: string, f: ResultsFilter, once = false): SQL {
  const conds = personConditions(ws, f);
  const where = conds.length > 0 ? sql`where ${sql.join(conds, sql` and `)}` : sql``;
  return sql`with inst as (
      select id, item_set_id, project_id from instrument where workspace_id = ${ws} and id = ${instrumentId}
    ),
    its as (
      select it.id, it.perspectives from item it join inst on it.item_set_id = inst.item_set_id where it.workspace_id = ${ws}
    ),
    -- E8-2: "Anonymous [N]" numbers the instrument's public-link responses by when they
    -- started, before any filter and whatever the names, so a number never moves when a
    -- filter changes or another respondent adds a name (a named response keeps its number
    -- unseen). Kept out of people so the filters still reach the response scan.
    anon_n as (
      select r.id, row_number() over (order by r.created_at, r.id) as n
        from response r join inst on r.instrument_id = inst.id
          join invite iv on iv.id = r.invite_id and iv.workspace_id = ${ws}
        where r.workspace_id = ${ws} and iv.kind = 'public'
    ),
    people as (
      select 'r'::text as src, r.id, r.fields, r.perspectives, r.submitted_at, r.first_submitted_at, r.created_at,
          r.signed_off, r.updated_at, iv.kind as source, case when iv.kind = 'personal' then iv.reminders_sent end as reminders,
          -- The name shown: the name field, else a personal invite's name or email (the PM
          -- typed them, E6-2); a public-link response with no name has its number instead.
          coalesce(nullif(r.fields ->> 'name', ''), case when iv.kind = 'personal' then coalesce(nullif(iv.name, ''), iv.email) end) as who,
          case when coalesce(r.fields ->> 'name', '') = '' then anon_n.n end as anon
        from response r join inst on r.instrument_id = inst.id
          join invite iv on iv.id = r.invite_id and iv.workspace_id = ${ws}
          left join anon_n on anon_n.id = r.id
        where r.workspace_id = ${ws}
      union all
      select 'i'::text, i.id, jsonb_strip_nulls(jsonb_build_object('name', i.name, 'role', i.role_hint)), '{}'::text[], null::timestamptz, null::timestamptz, i.created_at,
          false, i.created_at, i.kind, i.reminders_sent, coalesce(nullif(i.name, ''), i.email), null::bigint
        from invite i join inst on i.instrument_id = inst.id
        where i.workspace_id = ${ws} and i.kind = 'personal' and i.revoked_at is null and i.sent_at is not null
          and not exists (select 1 from response r2 where r2.workspace_id = ${ws} and r2.invite_id = i.id)
    ),
    sel as (select * from people p ${where}),
    counted as ${once ? sql`materialized ` : sql``}(select * from sel where src = 'r' and (${f.includeUnsubmitted} or submitted_at is not null)),
    ans as (select a.id, a.response_id, a.item_id, a.kind, a.value, a.reason, a.comment, c.fields as rfields from answer a join counted c on c.id = a.response_id where a.workspace_id = ${ws}),
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
// A person's minutes from Start to their first Submit, rounded to a whole minute in SQL (round on
// numeric rounds a half away from zero: postgresql.org/docs/current/functions-math.html). The
// tile is the median of these whole minutes, rounded the same way, so the People file's column
// gives it back: ROUND(MEDIAN(column), 0) in a spreadsheet (E10-1, acceptance 3).
const WHOLE_MINUTES = sql.raw("round(greatest(0, extract(epoch from (first_submitted_at - created_at)) / 60)::numeric)::int");

export type PersonOfRows = { id: string; invited: boolean; submitted: boolean; counted: boolean; minutesToSubmit: number | null };
export type MissingRow = { id: string; responseId: string; text: string };

// One answer as the filter keeps it (E10-1 writes these; the test adds them up), with its
// respondent as the Responses tab names them (who, else Anonymous [anon]), their fields, the
// perspectives they picked, the link they came by and when they submitted.
export type ResultRow = {
  id: string; responseId: string; itemId: string; kind: string; value: string | null; reason: string | null; comment: string | null; submitted: boolean;
  who: string | null; anon: number | null; fields: Record<string, string>; perspectives: string[]; source: "public" | "personal"; submittedAt: Date | null;
  // Submitted, then changed without a second Submit (the Responses tab's mark, decision 0030).
  changedSince: boolean;
};

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
        (select round((percentile_cont(0.5) within group (order by ${WHOLE_MINUTES}))::numeric)::int
          from sel where src = 'r' and first_submitted_at is not null) as median_minutes,
        exists (select 1 from answer a join response r on r.id = a.response_id join inst on r.instrument_id = inst.id where a.workspace_id = ${ws} and r.workspace_id = ${ws}) as any_answer,
        (select count(*) from insight s join inst on s.project_id = inst.project_id where s.workspace_id = ${ws} and s.state = 'open'
          and (exists (select 1 from answer ca where ca.workspace_id = ${ws} and ca.id = any(s.cited_answer_ids))
            or exists (select 1 from missing_item cm where cm.workspace_id = ${ws} and cm.id = any(s.cited_missing_item_ids))))::int as actions,
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
    const rows = await db.execute<{ id: string; response_id: string; item_id: string; kind: string; value: string | null; reason: string | null; comment: string | null; submitted: boolean; who: string | null; anon: string | number | null; fields: Record<string, string> | null; perspectives: string[] | null; source: string; submitted_at: string | Date | null; signed_off: boolean }>(sql`${head(ws, instrumentId, f)}
      select ans.id, ans.response_id, ans.item_id, ans.kind, ans.value, ans.reason, ans.comment, (c.submitted_at is not null) as submitted,
          c.who, c.anon, c.fields, c.perspectives, c.source, c.submitted_at, c.signed_off
        from ans join counted c on c.id = ans.response_id order by ans.response_id, ans.item_id`);
    return rows.map((r) => ({
      id: r.id, responseId: r.response_id, itemId: r.item_id, kind: r.kind, value: r.value, reason: r.reason, comment: r.comment, submitted: r.submitted,
      who: r.who, anon: r.anon === null ? null : Number(r.anon), fields: r.fields ?? {}, perspectives: r.perspectives ?? [], source: r.source === "personal" ? "personal" : "public",
      submittedAt: r.submitted_at === null ? null : new Date(r.submitted_at), changedSince: r.submitted && !r.signed_off,
    }));
  },
  people: async (ws: WorkspaceId, instrumentId: string, f: ResultsFilter): Promise<PersonOfRows[]> => {
    if (!isUuid(instrumentId)) return [];
    const rows = await db.execute<{ id: string; src: string; submitted: boolean; counted: boolean; minutes: number | null }>(sql`${head(ws, instrumentId, f)}
      select sel.id, sel.src, (sel.submitted_at is not null) as submitted, exists (select 1 from counted c where c.id = sel.id) as counted,
          case when sel.first_submitted_at is not null then ${WHOLE_MINUTES} end as minutes
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

// One person of the Responses tab (E8-2): every person the filter keeps, started or invited.
export type PersonRow = {
  id: string;
  source: "public" | "personal";
  fields: Record<string, string>;
  // The name shown: the name field, else a personal invite's name or email; null for a
  // public-link response with no name, which reads "Anonymous [anon]".
  who: string | null;
  anon: number | null;
  status: "invited" | "inProgress" | "submitted";
  // E7-6: submitted with changes not submitted again; or changed and submitted again.
  changedSince: boolean;
  submittedAgain: boolean;
  answered: number;
  visible: number;
  submittedAt: Date | null;
  reminders: number | null;
  withComment: number;
};

// The tracker's columns and their SQL (E8-2, acceptance 5): a sort key from the URL is looked
// up here, never written into the query; a field column only for a key of the instrument.
function personOrder(sort: ResultsFilter["sort"], fieldKeys: string[]): SQL {
  const dir = sort?.dir === "desc" ? sql`desc` : sql`asc`;
  const key = sort?.key ?? "name";
  const name = sql`lower(p.who) ${dir} nulls last, p.anon ${dir} nulls last`;
  const by: Record<string, SQL> = {
    name,
    status: sql`(case when p.src = 'i' then 0 when p.submitted_at is null then 1 else 2 end) ${dir}`,
    progress: sql`coalesce(given.answered, 0) ${dir}`,
    submitted: sql`p.submitted_at ${dir} nulls last`,
    source: sql`p.source ${dir}`,
    reminders: sql`p.reminders ${dir} nulls last`,
    comments: sql`coalesce(given.with_comment, 0) ${dir}`,
  };
  const field = key.startsWith("field.") ? key.slice(6) : null;
  const first = field !== null && fieldKeys.includes(field) ? sql`lower(p.fields ->> ${field}) ${dir} nulls last` : (Object.hasOwn(by, key) ? by[key] : name);
  return sql`${first}, ${name}, p.id`;
}

export const tracker = {
  people: async (ws: WorkspaceId, instrumentId: string, f: ResultsFilter, fieldKeys: string[]): Promise<PersonRow[]> => {
    if (!isUuid(instrumentId)) return [];
    const rows = await db.execute<{ id: string; source: string; fields: Record<string, string>; who: string | null; anon: string | number | null; src: string; submitted_at: string | Date | null; signed_off: boolean; changed_after: boolean; answered: number; visible: number; reminders: number | null; with_comment: number }>(sql`${head(ws, instrumentId, f)},
      -- One pass each over the items and the answers, grouped by person (a subquery per person
      -- was too slow at 500 people).
      shown as (
        select p.id, count(its.id)::int as visible
          from sel p left join its on cardinality(its.perspectives) = 0 or its.perspectives && p.perspectives
          group by p.id
      ),
      -- Progress counts the complete answers to the items the person sees, as the respondent's
      -- own count does (src/lib/respondent-rules.ts isComplete: a reason where the kind needs
      -- one); the answers with a reason or comment are those that count under the switch, so
      -- the column adds up to the strip's tile.
      given as (
        select a.response_id,
            count(*) filter (where (cardinality(its.perspectives) = 0 or its.perspectives && p.perspectives)
              and (a.kind not in ('change', 'disagree', 'unclear') or a.reason ~ '\\S'))::int as answered,
            count(*) filter (where (a.reason is not null or a.comment is not null) and (${f.includeUnsubmitted} or p.submitted_at is not null))::int as with_comment
          from answer a join sel p on p.id = a.response_id join its on its.id = a.item_id
          where a.workspace_id = ${ws}
          group by a.response_id
      )
      select p.id, p.src, p.source, p.fields, p.who, p.anon, p.submitted_at, p.signed_off, p.reminders,
          (p.first_submitted_at is not null and p.updated_at > p.first_submitted_at) as changed_after,
          shown.visible, coalesce(given.answered, 0) as answered, coalesce(given.with_comment, 0) as with_comment
        from sel p join shown on shown.id = p.id left join given on given.response_id = p.id
        order by ${personOrder(f.sort, fieldKeys)}`);
    return rows.map((r) => {
      const submitted = r.submitted_at !== null;
      return {
        id: r.id,
        source: r.source === "public" ? "public" : "personal",
        fields: r.fields ?? {},
        who: r.who,
        anon: r.anon === null ? null : Number(r.anon),
        status: r.src === "i" ? "invited" : submitted ? "submitted" : "inProgress",
        changedSince: submitted && !r.signed_off,
        submittedAgain: submitted && r.signed_off && r.changed_after,
        answered: r.answered,
        visible: r.visible,
        submittedAt: r.submitted_at === null ? null : new Date(r.submitted_at),
        reminders: r.reminders,
        withComment: r.with_comment,
      };
    });
  },
};

// The Agreement tab's numbers (E8-3): for each item of the instrument (in item id order; the
// tab puts them in the list's order), the counted answers by kind, the values picked (for the distribution of a value rated with
// no proposal shown), the people who could see the item (the counted responses whose
// perspectives show it, E5-4) and the agreement percentage, agree over answered rounded half
// up, for the CSV (E10-1); the tab sums items into areas and groups with the same rule in
// src/lib/results-agreement.ts percentOf, and a test checks the two agree on every item. With `split` (a dropdown field's
// key, checked by the caller against the instrument), one row per item and group value
// (null: the field left empty). Aggregates in SQL (group by item, kind, value, group).
export type ItemCounts = {
  itemId: string;
  group: string | null;
  agree: number;
  change: number;
  disagree: number;
  unclear: number;
  pick: number;
  // The values picked, by code, over every kind that carries a value.
  values: Record<string, number>;
  couldSee: number;
  percent: number | null;
};

export const agreement = {
  byItem: async (ws: WorkspaceId, instrumentId: string, f: ResultsFilter, split: string | null = null): Promise<ItemCounts[]> => {
    if (!isUuid(instrumentId)) return [];
    const group = split === null ? sql`null::text` : sql`(c.fields ->> ${split})`;
    const answerGroup = split === null ? sql`null::text` : sql`(ans.rfields ->> ${split})`;
    const rows = await db.execute<{ item_id: string; grp: string | null; agree: number; change: number; disagree: number; unclear: number; pick: number; values: Record<string, number> | null; could_see: number; percent: number | null }>(sql`${head(ws, instrumentId, f)},
      seen as (
        select its.id as item_id, ${group} as grp, c.id as response_id
          from its join counted c on cardinality(its.perspectives) = 0 or its.perspectives && c.perspectives
      ),
      byval as (
        select ans.item_id, ${answerGroup} as grp, ans.value, count(*)::int as n
          from ans where ans.value is not null group by 1, 2, 3
      ),
      vals as (select item_id, grp, jsonb_object_agg(value, n) as vals from byval group by 1, 2),
      bykind as (
        select ans.item_id, ${answerGroup} as grp,
            count(*) filter (where ans.kind = 'agree')::int as agree,
            count(*) filter (where ans.kind = 'change')::int as change,
            count(*) filter (where ans.kind = 'disagree')::int as disagree,
            count(*) filter (where ans.kind = 'unclear')::int as unclear,
            count(*) filter (where ans.kind = 'pick')::int as pick
          from ans group by 1, 2
      ),
      cells as (
        select item_id, grp, count(*)::int as could_see from seen group by 1, 2
        union
        select item_id, grp, 0 from bykind
      ),
      keys as (select item_id, grp, max(could_see)::int as could_see from cells group by 1, 2)
      select k.item_id, k.grp, coalesce(b.agree, 0) as agree, coalesce(b.change, 0) as change, coalesce(b.disagree, 0) as disagree,
          coalesce(b.unclear, 0) as unclear, coalesce(b.pick, 0) as pick,
          v.vals as values,
          k.could_see,
          round(100.0 * coalesce(b.agree, 0) / nullif(coalesce(b.agree, 0) + coalesce(b.change, 0) + coalesce(b.disagree, 0) + coalesce(b.unclear, 0), 0))::int as percent
        from keys k left join bykind b on b.item_id = k.item_id and b.grp is not distinct from k.grp
          left join vals v on v.item_id = k.item_id and v.grp is not distinct from k.grp
        order by k.item_id, k.grp nulls last`);
    return rows.map((r) => ({ itemId: r.item_id, group: r.grp, agree: r.agree, change: r.change, disagree: r.disagree, unclear: r.unclear, pick: r.pick, values: r.values ?? {}, couldSee: r.could_see, percent: r.percent }));
  },
};

// The registers (E8-4): the answers of one or more kinds and the missing items the page's
// filter keeps (the same selection as the strip, so a heading's count is its tile), one row
// each with the item, the respondent's name and fields, whether they have submitted and
// whether they changed answers since (E7-6), sorted from the register's own list of columns.
// The value columns (Proposed, Their value, Suggested value) sort in the scale's order, not by
// the stored code, so they are sorted here after the query, which then orders by item.
export type RegisterRow = {
  id: string;
  itemId: string;
  reference: string | null;
  itemText: string;
  readerStatus: string | null;
  readerText: string | null;
  proposedValue: string | null;
  kind: string;
  value: string | null;
  reason: string | null;
  comment: string | null;
  fields: Record<string, string>;
  // The name shown and the public-link number, as PersonRow's (E8-2).
  who: string | null;
  anon: number | null;
  submitted: boolean;
  // Submitted, then answers changed and not submitted again (E7-6; the Responses tab's mark).
  changedSince: boolean;
};
export type MissingRegisterRow = { id: string; text: string; area: string | null; value: string | null; fields: Record<string, string>; who: string | null; anon: number | null; submitted: boolean; changedSince: boolean };

// Stable sort of rows by a value's place in the scale (empty values last, both ways); rows
// with the same place keep the query's order (the list's order in the same direction).
function byScale<T>(rows: T[], code: (r: T) => string | null, method: ScoringMethod, dir: "asc" | "desc"): T[] {
  const place = (r: T) => { const c = code(r); const i = c === null ? -1 : SCALES[method].findIndex((v) => v.code === c); return i < 0 ? Number.MAX_SAFE_INTEGER : i; };
  const sign = dir === "desc" ? -1 : 1;
  return rows.map((r, i) => ({ r, i, p: place(r) })).sort((a, b) => {
    const empty = Number(a.p === Number.MAX_SAFE_INTEGER) - Number(b.p === Number.MAX_SAFE_INTEGER);
    return empty || sign * (a.p - b.p) || a.i - b.i;
  }).map((x) => x.r);
}

// The register's columns already carry the direction; a field column (field.[key]) only for a
// key of the instrument; ties in the list's order, then by row.
function registerOrder(sort: ResultsFilter["sort"], fieldKeys: string[], columns: Record<string, SQL>): SQL {
  const dir = sort?.dir === "desc" ? sql`desc` : sql`asc`;
  const key = sort?.key ?? "item";
  const field = key.startsWith("field.") ? key.slice(6) : null;
  const first = field !== null && fieldKeys.includes(field) ? sql`lower(c.fields ->> ${field}) ${dir} nulls last` : (Object.hasOwn(columns, key) ? columns[key] : columns.item);
  return sql`${first}, ${columns.item}, x.id ${dir}`;
}

export const registers = {
  answers: async (ws: WorkspaceId, instrumentId: string, f: ResultsFilter, kinds: ("change" | "disagree" | "unclear")[], fieldKeys: string[], method: ScoringMethod): Promise<RegisterRow[]> => {
    if (!isUuid(instrumentId) || kinds.length === 0) return [];
    const dir = f.sort?.dir === "desc" ? sql`desc` : sql`asc`;
    const columns: Record<string, SQL> = {
      item: sql`it.position ${dir}`,
      respondent: sql`lower(c.who) ${dir} nulls last, c.anon ${dir} nulls last`,
      reason: sql`lower(x.reason) ${dir} nulls last`,
      status: sql`(c.submitted_at is not null) ${dir}`,
    };
    const rows = await db.execute<{ id: string; item_id: string; source_ref: string | null; original_text: string; reader_status: string | null; reader_text: string | null; proposed_value: string | null; kind: string; value: string | null; reason: string | null; comment: string | null; fields: Record<string, string>; who: string | null; anon: string | number | null; submitted: boolean; signed_off: boolean }>(sql`${head(ws, instrumentId, f, true)}
      select x.id, x.item_id, it.source_ref, it.original_text, it.reader_status, it.reader_text, it.proposed_value, x.kind, x.value, x.reason, x.comment, c.fields, c.who, c.anon, (c.submitted_at is not null) as submitted, c.signed_off
        from ans x join counted c on c.id = x.response_id join item it on it.id = x.item_id and it.workspace_id = ${ws}
        where x.kind in (${list(kinds)})
        order by ${registerOrder(f.sort, fieldKeys, columns)}`);
    const out: RegisterRow[] = rows.map((r) => ({ id: r.id, itemId: r.item_id, reference: r.source_ref, itemText: r.original_text, readerStatus: r.reader_status, readerText: r.reader_text, proposedValue: r.proposed_value, kind: r.kind, value: r.value, reason: r.reason, comment: r.comment, fields: r.fields ?? {}, who: r.who, anon: r.anon === null ? null : Number(r.anon), submitted: r.submitted, changedSince: r.submitted && !r.signed_off }));
    const dirOf = f.sort?.dir ?? "asc";
    if (f.sort?.key === "value") return byScale(out, (r) => r.value, method, dirOf);
    if (f.sort?.key === "proposed") return byScale(out, (r) => proposedCode(method, r.proposedValue), method, dirOf);
    return out;
  },
  missing: async (ws: WorkspaceId, instrumentId: string, f: ResultsFilter, fieldKeys: string[], method: ScoringMethod): Promise<MissingRegisterRow[]> => {
    if (!isUuid(instrumentId)) return [];
    const dir = f.sort?.dir === "desc" ? sql`desc` : sql`asc`;
    const columns: Record<string, SQL> = {
      item: sql`lower(x.text) ${dir}`,
      text: sql`lower(x.text) ${dir}`,
      area: sql`x.suggested_area ${dir} nulls last`,
      respondent: sql`lower(c.who) ${dir} nulls last, c.anon ${dir} nulls last`,
      status: sql`(c.submitted_at is not null) ${dir}`,
    };
    const rows = await db.execute<{ id: string; text: string; suggested_area: string | null; suggested_value: string | null; fields: Record<string, string>; who: string | null; anon: string | number | null; submitted: boolean; signed_off: boolean }>(sql`${head(ws, instrumentId, f, true)}
      select x.id, x.text, x.suggested_area, x.suggested_value, c.fields, c.who, c.anon, (c.submitted_at is not null) as submitted, c.signed_off
        from missing_item x join counted c on c.id = x.response_id where x.workspace_id = ${ws}
        order by ${registerOrder(f.sort, fieldKeys, columns)}`);
    const out: MissingRegisterRow[] = rows.map((r) => ({ id: r.id, text: r.text, area: r.suggested_area, value: r.suggested_value, fields: r.fields ?? {}, who: r.who, anon: r.anon === null ? null : Number(r.anon), submitted: r.submitted, changedSince: r.submitted && !r.signed_off }));
    return f.sort?.key === "value" ? byScale(out, (r) => r.value, method, f.sort.dir) : out;
  },
};

// One item's detail (E8-5): the item, and a row for every person the page's filter keeps who
// sees the item (E5-4), with their answer when it counts (the include-unsubmitted switch), so
// the counts (computed here) are the Agreement tab's for that item. A person started without a
// counted answer on it, or invited and not started, has a row with no answer.
export type DetailItem = { id: string; reference: string | null; area: string | null; originalText: string; readerText: string | null; readerStatus: string | null; proposedValue: string | null };
export type DetailRow = { personId: string; invited: boolean; submitted: boolean; fields: Record<string, string>; who: string | null; anon: number | null; kind: string | null; value: string | null; reason: string | null; comment: string | null };

export const detail = {
  item: async (ws: WorkspaceId, instrumentId: string, itemId: string, f: ResultsFilter): Promise<{ item: DetailItem; counts: DetailCounts; rows: DetailRow[] } | null> => {
    if (!isUuid(instrumentId) || !isUuid(itemId)) return null;
    const rows = await db.execute<{ id: string; source_ref: string | null; area: string | null; original_text: string; reader_text: string | null; reader_status: string | null; proposed_value: string | null; person_id: string | null; src: string | null; submitted: boolean | null; fields: Record<string, string> | null; who: string | null; anon: string | number | null; kind: string | null; value: string | null; reason: string | null; comment: string | null; n_agree: number; n_change: number; n_disagree: number; n_unclear: number; n_pick: number; n_not_yet: number }>(sql`${head(ws, instrumentId, f, true)},
      one as (select its.id, its.perspectives from its where its.id = ${itemId})
      select it.id, it.source_ref, it.area, it.original_text, it.reader_text, it.reader_status, it.proposed_value,
          p.id as person_id, p.src, (p.submitted_at is not null) as submitted, p.fields, p.who, p.anon,
          x.kind, x.value, x.reason, x.comment,
          -- The counts in SQL, over the rows (aggregate FILTER with OVER:
          -- postgresql.org/docs/current/sql-expressions.html#SYNTAX-WINDOW-FUNCTIONS).
          (count(*) filter (where x.kind = 'agree') over ())::int as n_agree,
          (count(*) filter (where x.kind = 'change') over ())::int as n_change,
          (count(*) filter (where x.kind = 'disagree') over ())::int as n_disagree,
          (count(*) filter (where x.kind = 'unclear') over ())::int as n_unclear,
          (count(*) filter (where x.kind = 'pick') over ())::int as n_pick,
          (count(p.id) filter (where x.kind is null) over ())::int as n_not_yet
        from one join item it on it.id = one.id and it.workspace_id = ${ws}
          -- A person who sees the item, or who answered it before a Start again changed their
          -- perspectives (responses.restart keeps the answers), as agreement.byItem counts them.
          left join sel p on cardinality(one.perspectives) = 0 or one.perspectives && p.perspectives
            or exists (select 1 from ans a2 where a2.item_id = one.id and a2.response_id = p.id)
          left join ans x on x.item_id = one.id and x.response_id = p.id
        order by (x.kind is null), lower(p.who) nulls last, p.anon nulls last, p.id`);
    if (rows.length === 0) return null;
    const r0 = rows[0];
    return {
      item: { id: r0.id, reference: r0.source_ref, area: r0.area, originalText: r0.original_text, readerText: r0.reader_text, readerStatus: r0.reader_status, proposedValue: r0.proposed_value },
      counts: { agree: Number(r0.n_agree), change: Number(r0.n_change), disagree: Number(r0.n_disagree), unclear: Number(r0.n_unclear), pick: Number(r0.n_pick), notYet: Number(r0.n_not_yet) },
      rows: rows.filter((r) => r.person_id !== null).map((r) => ({ personId: r.person_id!, invited: r.src === "i", submitted: r.submitted === true, fields: r.fields ?? {}, who: r.who, anon: r.anon === null ? null : Number(r.anon), kind: r.kind, value: r.value, reason: r.reason, comment: r.comment })),
    };
  },
};

// Where groups disagree (E8-6): per item, the agreement share of each group of a dropdown
// field among the answers that count (agree over agree, different priority, disagree and
// unclear; a value rated with no proposal is no agreement), and the gap, the largest
// difference in share between two groups with at least MIN_GROUP answers (decision 0031:
// smaller groups are shown, not compared), in percentage points rounded half up; null when
// fewer than two groups are compared. Items in order of the gap, largest first (the caller
// orders ties by the list, src/lib/results-gaps.ts). People without a value on the field are
// the group '' (Not given on screen).
export type GapGroup = { group: string; agree: number; answered: number; compared: boolean };
export type GapItem = { itemId: string; gap: number | null; groups: GapGroup[] };

export const gaps = {
  byField: async (ws: WorkspaceId, instrumentId: string, f: ResultsFilter, fieldKey: string): Promise<GapItem[]> => {
    if (!isUuid(instrumentId)) return [];
    const rows = await db.execute<{ item_id: string; grp: string | null; agree: number | null; answered: number | null; gap: number | null }>(sql`${head(ws, instrumentId, f, true)},
      g as (
        -- The people who left the field empty are a group of their own, '' (Not given on
        -- screen), as in the Agreement tab's split.
        select ans.item_id, coalesce(nullif(ans.rfields ->> ${fieldKey}, ''), '') as grp,
            count(*) filter (where ans.kind = 'agree')::int as agree,
            count(*) filter (where ans.kind in ('agree', 'change', 'disagree', 'unclear'))::int as answered
          from ans
          group by 1, 2
      ),
      shares as (select g.*, case when g.answered >= ${MIN_GROUP} then g.agree::numeric / g.answered end as share from g),
      gap as (
        select item_id, case when count(share) >= 2 then round(100 * (max(share) - min(share)))::int end as gap
          from shares group by item_id
      )
      select its.id as item_id, s.grp, s.agree, s.answered, gap.gap
        from its join item it on it.id = its.id and it.workspace_id = ${ws}
          left join shares s on s.item_id = its.id
          left join gap on gap.item_id = its.id
        order by gap.gap desc nulls last, it.position, its.id, s.grp`);
    const out: GapItem[] = [];
    for (const r of rows) {
      let last = out.at(-1);
      if (!last || last.itemId !== r.item_id) out.push((last = { itemId: r.item_id, gap: r.gap, groups: [] }));
      if (r.grp !== null) last.groups.push({ group: r.grp, agree: r.agree ?? 0, answered: r.answered ?? 0, compared: (r.answered ?? 0) >= MIN_GROUP });
    }
    return out;
  },
};

// The PM's choices on Results, per instrument (user.results_prefs, INTERFACES.md
// ResultsPrefs): the tiles, the include-unsubmitted switch and the Agreement tab's view (E8-3).
// Keyed by the signed-in person's
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
  set: async (userId: string, instrumentId: string, patch: { tiles?: string[]; includeUnsubmitted?: boolean; view?: "table" | "columns" | "share" }): Promise<void> => {
    if (!isUuid(instrumentId)) return;
    await db.update(user).set({
      resultsPrefs: sql`jsonb_set(${user.resultsPrefs}, array[${instrumentId}]::text[], coalesce(${user.resultsPrefs} -> ${instrumentId}, '{}'::jsonb) || ${JSON.stringify(patch)}::jsonb)`,
    }).where(eq(user.id, userId));
  },
};
