// The registers (stories/E8-4): the Different priority and Disagree tab (named with both
// counts, decision 0062) holds the different-priority register (item, respondent, role, proposed, their value, reason) and the
// disagree register (item, respondent, role, reason); the "Questions and gaps" tab the unclear
// register (item, respondent, role, question) and the missing-item register (text, suggested
// area, suggested value, respondent, role). Each register's heading carries its count, which is
// its tile's (the same selection, src/db/queries/results.ts registers); every column sorts both
// ways with the sort in the URL (the value columns in the scale's order); values use the
// instrument's labels (E5-2); a respondent who has not submitted, or changed answers after
// Submit, is marked as on the Responses tab (decision 0030, E7-6). A row reads across its
// columns: the respondent, then what they say and why. Copy: docs/copy/app.md, Results.
import Link from "next/link";
import { NeutralPill } from "@/components/ui/status-pill";
import type { Instrument } from "@/db/queries/instruments";
import { registers, type MissingRegisterRow, type RegisterRow } from "@/db/queries/results";
import type { WorkspaceId } from "@/db/types";
import { textFor, type ReaderFields } from "@/lib/item-text";
import { REGISTERS_COPY, RESPONSES_COPY } from "@/lib/results-copy";
import { filterActive, nextSort, registerShownSort, type FilterContext, type ResultsFilter } from "@/lib/results-filter";
import { labelFor, proposedCode } from "@/lib/scoring";

type Props = { ws: WorkspaceId; instrument: Instrument; filter: ResultsFilter; ctx: FilterContext; href: (f: ResultsFilter) => string; itemHref: (id: string) => string };
type Column = { key: string; label: string };

const nameOf = (who: string | null, anon: number | null) => who ?? RESPONSES_COPY.anonymous(anon ?? 0);

// The keys each register's query sorts by (src/db/queries/results.ts registers); any other
// key sorts by the first column, in the direction asked.
const ANSWER_KEYS = ["item", "respondent", "proposed", "value", "reason", "status"];
const MISSING_KEYS = ["item", "text", "respondent", "status"];


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

function Register({ title, count, columns, queryKeys, aliases, filter, href, testId, children }: { title: string; count: number; columns: Column[]; queryKeys: string[]; aliases?: Record<string, string>; filter: ResultsFilter; href: Props["href"]; testId: string; children: React.ReactNode }) {
  const sort = registerShownSort(filter.sort, columns.map((c) => c.key), queryKeys, aliases);
  // An empty register says why: nothing under the filter, or nothing yet (the switch is not
  // a filter, results-filter.ts filterActive).
  const empty = filterActive(filter) ? REGISTERS_COPY.none : REGISTERS_COPY.noneYet;
  return (
    <section className="card overflow-x-auto p-0" aria-label={title} data-testid={testId}>
      <h3 className="px-4 pt-4 pb-2 text-[15px] font-bold">{title} <span className="font-mono text-sm text-ink-muted" data-testid={`${testId}-count`}>{count}</span></h3>
      {count === 0 ? <p className="px-4 pb-4 text-sm text-ink-muted">{empty}</p> : (
        <table className="w-full min-w-[760px] text-left text-sm">
          <caption className="sr-only">{title}</caption>
          <thead><tr>{columns.map((c) => <SortHeader key={c.key} c={c} sort={sort} filter={filter} href={href} />)}</tr></thead>
          <tbody>{children}</tbody>
        </table>
      )}
    </section>
  );
}

function Respondent({ who, anon, submitted, changedSince }: { who: string | null; anon: number | null; submitted: boolean; changedSince: boolean }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <span className="font-semibold">{nameOf(who, anon)}</span>
      {!submitted && <NeutralPill>{REGISTERS_COPY.notSubmitted}</NeutralPill>}
      {changedSince && <span className="text-xs font-semibold text-sun-text" data-testid="changed-since">{RESPONSES_COPY.changedSince}</span>}
    </span>
  );
}

// The item, linked to its detail (E8-5).
function Item({ row, itemHref }: { row: RegisterRow; itemHref: Props["itemHref"] }) {
  return (
    <Link href={itemHref(row.itemId)} scroll={false} data-item-link={row.itemId} className="rounded-sm outline-none hover:underline focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface" data-testid="register-item">
      {row.reference && <span className="mr-2 font-mono text-xs text-ink-muted">{row.reference}</span>}
      {textFor({ readerStatus: row.readerStatus as ReaderFields["readerStatus"], readerText: row.readerText, originalText: row.itemText })}
    </Link>
  );
}

const CELL = "px-4 py-2.5 align-top";

export async function PushedTab({ ws, instrument, filter, ctx, href, itemHref }: Props) {
  const keys = ctx.fields.map((f) => f.key);
  const answerKeys = [...ANSWER_KEYS, ...keys.map((k) => `field.${k}`)];
  const role = ctx.fields.find((f) => f.key === "role") ?? null;
  const rows = await registers.answers(ws, instrument.id, filter, ["change", "disagree"], keys, instrument.method);
  const label = (code: string | null) => (code ? (labelFor(instrument.method, instrument.scaleLabels, code) ?? code) : "");
  const proposed = (r: RegisterRow) => label(instrument.showProposed ? proposedCode(instrument.method, r.proposedValue) : null);
  const change = rows.filter((r) => r.kind === "change");
  const disagree = rows.filter((r) => r.kind === "disagree");
  const base: Column[] = [{ key: "item", label: REGISTERS_COPY.item }, { key: "respondent", label: REGISTERS_COPY.respondent }, ...(role ? [{ key: "field.role", label: role.label }] : [])];
  return (
    <div className="flex flex-col gap-4" data-testid="pushed-tab">
      <Register title={REGISTERS_COPY.changeTitle} count={change.length} filter={filter} href={href} testId="register-change" queryKeys={answerKeys}
        columns={[...base, { key: "proposed", label: REGISTERS_COPY.proposed }, { key: "value", label: REGISTERS_COPY.theirValue }, { key: "reason", label: REGISTERS_COPY.reason }]}>
        {change.map((r) => (
          <tr key={r.id} className="border-t border-hairline hover:bg-tint" data-testid="register-row">
            <td className={CELL}><Item row={r} itemHref={itemHref} /></td>
            <td className={CELL}><Respondent who={r.who} anon={r.anon} submitted={r.submitted} changedSince={r.changedSince} /></td>
            {role && <td className={CELL}>{r.fields.role ?? ""}</td>}
            <td className={`${CELL} whitespace-nowrap text-ink-muted`}>{proposed(r)}</td>
            <td className={`${CELL} font-semibold whitespace-nowrap`}>{label(r.value)}</td>
            <td className={CELL}>{r.reason}</td>
          </tr>
        ))}
      </Register>
      <Register title={REGISTERS_COPY.disagreeTitle} count={disagree.length} filter={filter} href={href} testId="register-disagree" queryKeys={answerKeys}
        columns={[...base, { key: "reason", label: REGISTERS_COPY.reason }]}>
        {disagree.map((r) => (
          <tr key={r.id} className="border-t border-hairline hover:bg-tint" data-testid="register-row">
            <td className={CELL}><Item row={r} itemHref={itemHref} /></td>
            <td className={CELL}><Respondent who={r.who} anon={r.anon} submitted={r.submitted} changedSince={r.changedSince} /></td>
            {role && <td className={CELL}>{r.fields.role ?? ""}</td>}
            <td className={CELL}>{r.reason}</td>
          </tr>
        ))}
      </Register>
    </div>
  );
}

export async function QuestionsTab({ ws, instrument, filter, ctx, href, itemHref }: Props) {
  const keys = ctx.fields.map((f) => f.key);
  const answerKeys = [...ANSWER_KEYS, ...keys.map((k) => `field.${k}`)];
  const missingKeys = [...MISSING_KEYS, ...keys.map((k) => `field.${k}`)];
  const role = ctx.fields.find((f) => f.key === "role") ?? null;
  const [unclear, missing] = await Promise.all([registers.answers(ws, instrument.id, filter, ["unclear"], keys, instrument.method), registers.missing(ws, instrument.id, filter, keys)]);
  const label = (code: string | null) => (code ? (labelFor(instrument.method, instrument.scaleLabels, code) ?? code) : "");
  const who: Column[] = [{ key: "respondent", label: REGISTERS_COPY.respondent }, ...(role ? [{ key: "field.role", label: role.label }] : [])];
  return (
    <div className="flex flex-col gap-4" data-testid="questions-tab">
      <Register title={REGISTERS_COPY.unclearTitle} count={unclear.length} filter={filter} href={href} testId="register-unclear" queryKeys={answerKeys}
        columns={[{ key: "item", label: REGISTERS_COPY.item }, ...who, { key: "reason", label: REGISTERS_COPY.question }]}>
        {unclear.map((r) => (
          <tr key={r.id} className="border-t border-hairline hover:bg-tint" data-testid="register-row">
            <td className={CELL}><Item row={r} itemHref={itemHref} /></td>
            <td className={CELL}><Respondent who={r.who} anon={r.anon} submitted={r.submitted} changedSince={r.changedSince} /></td>
            {role && <td className={CELL}>{r.fields.role ?? ""}</td>}
            <td className={CELL}>{r.reason}</td>
          </tr>
        ))}
      </Register>
      <Register title={REGISTERS_COPY.missingTitle} count={missing.length} filter={filter} href={href} testId="register-missing" queryKeys={missingKeys} aliases={{ item: "text" }}
        columns={[{ key: "text", label: REGISTERS_COPY.missingText }, ...who]}>
        {missing.map((m: MissingRegisterRow) => (
          <tr key={m.id} className="border-t border-hairline hover:bg-tint" data-testid="register-row">
            <td className={`${CELL} whitespace-pre-line`}>{m.text}</td>
            <td className={CELL}><Respondent who={m.who} anon={m.anon} submitted={m.submitted} changedSince={m.changedSince} /></td>
            {role && <td className={CELL}>{m.fields.role ?? ""}</td>}
          </tr>
        ))}
      </Register>
    </div>
  );
}
