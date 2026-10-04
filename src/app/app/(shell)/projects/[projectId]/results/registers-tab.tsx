// The registers (stories/E8-4): the "Different priority and Disagree" tab holds the
// different-priority register (item, respondent, role, proposed, their value, reason) and the
// disagree register (item, respondent, role, reason); the "Questions and gaps" tab the unclear
// register (item, respondent, role, question) and the missing-item register (text, suggested
// area, suggested value, respondent, role). Each register's heading carries its count, which is
// its tile's (the same selection, src/db/queries/results.ts registers); every column sorts both
// ways with the sort in the URL; values use the instrument's labels (E5-2); a respondent who has
// not submitted is marked (decision 0030). A row reads as the landing page promises: the
// respondent, then what they say and why. Copy: docs/copy/app.md, Results.
import Link from "next/link";
import { NeutralPill } from "@/components/ui/status-pill";
import type { Instrument } from "@/db/queries/instruments";
import { registers, type MissingRegisterRow, type RegisterRow } from "@/db/queries/results";
import type { WorkspaceId } from "@/db/types";
import { textFor, type ReaderFields } from "@/lib/item-text";
import { REGISTERS_COPY, RESPONSES_COPY } from "@/lib/results-copy";
import { nextSort, type FilterContext, type ResultsFilter } from "@/lib/results-filter";
import { labelFor, proposedCode } from "@/lib/scoring";

type Props = { ws: WorkspaceId; instrument: Instrument; filter: ResultsFilter; ctx: FilterContext; href: (f: ResultsFilter) => string };
type Column = { key: string; label: string };

const nameOf = (who: string | null, anon: number | null) => who ?? RESPONSES_COPY.anonymous(anon ?? 0);

// The keys each register's query sorts by (src/db/queries/results.ts registers); any other
// key sorts by the first column, in the direction asked.
const ANSWER_KEYS = ["item", "respondent", "proposed", "value", "reason", "status"];
const MISSING_KEYS = ["item", "text", "area", "value", "respondent", "status"];

// The sort the register's rows are in, to mark its header: the one asked when this register
// shows that column, the first column when the query fell back to it, none when the query
// sorted by a column this register does not show (Proposed on the disagree register).
function shownSort(sort: ResultsFilter["sort"], columns: Column[], queryKeys: string[]): ResultsFilter["sort"] {
  if (!sort) return { key: columns[0].key, dir: "asc" };
  if (columns.some((c) => c.key === sort.key)) return sort;
  return queryKeys.includes(sort.key) ? null : { key: columns[0].key, dir: sort.dir };
}

function SortHeader({ c, sort, filter, href }: { c: Column; sort: ResultsFilter["sort"]; filter: ResultsFilter; href: Props["href"] }) {
  const on = sort?.key === c.key;
  return (
    <th scope="col" aria-sort={on ? (sort!.dir === "asc" ? "ascending" : "descending") : undefined} className="h-9 px-4 text-xs font-semibold whitespace-nowrap text-ink-muted">
      <Link href={href({ ...filter, sort: nextSort(on ? sort : null, c.key) })} scroll={false} className="inline-flex items-center gap-1 rounded-sm outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface">
        {c.label}
        <span aria-hidden="true" className="font-mono">{on ? (sort!.dir === "asc" ? "↑" : "↓") : ""}</span>
      </Link>
    </th>
  );
}

function Register({ title, count, columns, queryKeys, filter, href, testId, children, empty }: { title: string; count: number; columns: Column[]; queryKeys: string[]; filter: ResultsFilter; href: Props["href"]; testId: string; children: React.ReactNode; empty: string }) {
  const sort = shownSort(filter.sort, columns, queryKeys);
  return (
    <section className="card overflow-x-auto p-0" aria-label={title} data-testid={testId}>
      <h3 className="px-4 pt-4 pb-2 text-[15px] font-bold">{title} <span className="font-mono text-sm text-ink-muted" data-testid={`${testId}-count`}>{count}</span></h3>
      {count === 0 ? <p className="px-4 pb-4 text-sm text-ink-muted">{empty}</p> : (
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead><tr>{columns.map((c) => <SortHeader key={c.key} c={c} sort={sort} filter={filter} href={href} />)}</tr></thead>
          <tbody>{children}</tbody>
        </table>
      )}
    </section>
  );
}

function Respondent({ who, anon, submitted }: { who: string | null; anon: number | null; submitted: boolean }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <span className="font-semibold">{nameOf(who, anon)}</span>
      {!submitted && <NeutralPill>{REGISTERS_COPY.notSubmitted}</NeutralPill>}
    </span>
  );
}

function Item({ row }: { row: RegisterRow }) {
  return (
    <>
      {row.reference && <span className="mr-2 font-mono text-xs text-ink-muted">{row.reference}</span>}
      {textFor({ readerStatus: row.readerStatus as ReaderFields["readerStatus"], readerText: row.readerText, originalText: row.itemText })}
    </>
  );
}

const CELL = "px-4 py-2.5 align-top";

export async function PushedTab({ ws, instrument, filter, ctx, href }: Props) {
  const keys = ctx.fields.map((f) => f.key);
  const answerKeys = [...ANSWER_KEYS, ...keys.map((k) => `field.${k}`)];
  const role = ctx.fields.find((f) => f.key === "role") ?? null;
  const rows = await registers.answers(ws, instrument.id, filter, ["change", "disagree"], keys);
  const label = (code: string | null) => (code ? (labelFor(instrument.method, instrument.scaleLabels, code) ?? code) : "");
  const proposed = (r: RegisterRow) => label(instrument.showProposed ? proposedCode(instrument.method, r.proposedValue) : null);
  const change = rows.filter((r) => r.kind === "change");
  const disagree = rows.filter((r) => r.kind === "disagree");
  const base: Column[] = [{ key: "item", label: REGISTERS_COPY.item }, { key: "respondent", label: REGISTERS_COPY.respondent }, ...(role ? [{ key: "field.role", label: role.label }] : [])];
  return (
    <div className="flex flex-col gap-4" data-testid="pushed-tab">
      <Register title={REGISTERS_COPY.changeTitle} count={change.length} filter={filter} href={href} testId="register-change" queryKeys={answerKeys} empty={REGISTERS_COPY.none}
        columns={[...base, { key: "proposed", label: REGISTERS_COPY.proposed }, { key: "value", label: REGISTERS_COPY.theirValue }, { key: "reason", label: REGISTERS_COPY.reason }]}>
        {change.map((r) => (
          <tr key={r.id} className="border-t border-hairline" data-testid="register-row">
            <td className={CELL}><Item row={r} /></td>
            <td className={CELL}><Respondent who={r.who} anon={r.anon} submitted={r.submitted} /></td>
            {role && <td className={CELL}>{r.fields.role ?? ""}</td>}
            <td className={`${CELL} whitespace-nowrap text-ink-muted`}>{proposed(r)}</td>
            <td className={`${CELL} font-semibold whitespace-nowrap`}>{label(r.value)}</td>
            <td className={CELL}>{r.reason}</td>
          </tr>
        ))}
      </Register>
      <Register title={REGISTERS_COPY.disagreeTitle} count={disagree.length} filter={filter} href={href} testId="register-disagree" queryKeys={answerKeys} empty={REGISTERS_COPY.none}
        columns={[...base, { key: "reason", label: REGISTERS_COPY.reason }]}>
        {disagree.map((r) => (
          <tr key={r.id} className="border-t border-hairline" data-testid="register-row">
            <td className={CELL}><Item row={r} /></td>
            <td className={CELL}><Respondent who={r.who} anon={r.anon} submitted={r.submitted} /></td>
            {role && <td className={CELL}>{r.fields.role ?? ""}</td>}
            <td className={CELL}>{r.reason}</td>
          </tr>
        ))}
      </Register>
    </div>
  );
}

export async function QuestionsTab({ ws, instrument, filter, ctx, href }: Props) {
  const keys = ctx.fields.map((f) => f.key);
  const answerKeys = [...ANSWER_KEYS, ...keys.map((k) => `field.${k}`)];
  const missingKeys = [...MISSING_KEYS, ...keys.map((k) => `field.${k}`)];
  const role = ctx.fields.find((f) => f.key === "role") ?? null;
  const [unclear, missing] = await Promise.all([registers.answers(ws, instrument.id, filter, ["unclear"], keys), registers.missing(ws, instrument.id, filter, keys)]);
  const label = (code: string | null) => (code ? (labelFor(instrument.method, instrument.scaleLabels, code) ?? code) : "");
  const who: Column[] = [{ key: "respondent", label: REGISTERS_COPY.respondent }, ...(role ? [{ key: "field.role", label: role.label }] : [])];
  return (
    <div className="flex flex-col gap-4" data-testid="questions-tab">
      <Register title={REGISTERS_COPY.unclearTitle} count={unclear.length} filter={filter} href={href} testId="register-unclear" queryKeys={answerKeys} empty={REGISTERS_COPY.none}
        columns={[{ key: "item", label: REGISTERS_COPY.item }, ...who, { key: "reason", label: REGISTERS_COPY.question }]}>
        {unclear.map((r) => (
          <tr key={r.id} className="border-t border-hairline" data-testid="register-row">
            <td className={CELL}><Item row={r} /></td>
            <td className={CELL}><Respondent who={r.who} anon={r.anon} submitted={r.submitted} /></td>
            {role && <td className={CELL}>{r.fields.role ?? ""}</td>}
            <td className={CELL}>{r.reason}</td>
          </tr>
        ))}
      </Register>
      <Register title={REGISTERS_COPY.missingTitle} count={missing.length} filter={filter} href={href} testId="register-missing" queryKeys={missingKeys} empty={REGISTERS_COPY.none}
        columns={[{ key: "text", label: REGISTERS_COPY.missingText }, { key: "area", label: REGISTERS_COPY.area }, { key: "value", label: REGISTERS_COPY.suggestedValue }, ...who]}>
        {missing.map((m: MissingRegisterRow) => (
          <tr key={m.id} className="border-t border-hairline" data-testid="register-row">
            <td className={CELL}>{m.text}</td>
            <td className={CELL}>{m.area ?? ""}</td>
            <td className={`${CELL} whitespace-nowrap`}>{label(m.value)}</td>
            <td className={CELL}><Respondent who={m.who} anon={m.anon} submitted={m.submitted} /></td>
            {role && <td className={CELL}>{m.fields.role ?? ""}</td>}
          </tr>
        ))}
      </Register>
    </div>
  );
}
