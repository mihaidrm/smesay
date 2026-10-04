// The Responses tab (stories/E8-2; the PM app board, Responses): one row per person the page's
// filter keeps, started or invited (src/db/queries/results.ts tracker.people): the name (or
// "Anonymous [N]" for a public-link response with no name), every other respondent field, the
// status with E7-6's "changes not submitted again" or "submitted again", the progress against
// the items the person sees (E5-4), the submitted date, the source, the reminders sent and the
// answers with a reason or comment. Every column header sorts, ascending then descending,
// with the sort in the URL (aria-sort on the header: developer.mozilla.org/docs/Web/
// Accessibility/ARIA/Reference/Attributes/aria-sort). Copy: docs/copy/app.md, Results.
import Link from "next/link";
import { NeutralPill, StatusPill } from "@/components/ui/status-pill";
import type { WorkspaceId } from "@/db/types";
import { tracker, type PersonRow } from "@/db/queries/results";
import { RESPONSES_COPY } from "@/lib/results-copy";
import { nextSort, type FilterContext, type ResultsFilter } from "@/lib/results-filter";
import { formatUtc } from "@/lib/sharing";

type Props = { ws: WorkspaceId; instrumentId: string; filter: ResultsFilter; ctx: FilterContext; href: (f: ResultsFilter) => string };

export async function ResponsesTab({ ws, instrumentId, filter, ctx, href }: Props) {
  const fields = ctx.fields.filter((f) => f.key !== "name");
  const rows = await tracker.people(ws, instrumentId, filter, ctx.fields.map((f) => f.key));
  const sort = filter.sort ?? { key: "name", dir: "asc" as const };
  const columns: { key: string; label: string }[] = [
    { key: "name", label: RESPONSES_COPY.name },
    ...fields.map((f) => ({ key: `field.${f.key}`, label: f.label })),
    { key: "status", label: RESPONSES_COPY.status },
    { key: "progress", label: RESPONSES_COPY.progress },
    { key: "submitted", label: RESPONSES_COPY.submitted },
    { key: "source", label: RESPONSES_COPY.source },
    { key: "reminders", label: RESPONSES_COPY.reminders },
    { key: "comments", label: RESPONSES_COPY.withComment },
  ];
  return (
    <div className="card overflow-x-auto p-0" data-testid="responses-tab">
      <table className="w-full min-w-[880px] text-left text-sm">
        <caption className="sr-only">{RESPONSES_COPY.caption(rows.length)}</caption>
        <thead>
          <tr>
            {columns.map((c) => {
              const on = sort.key === c.key;
              return (
                <th key={c.key} scope="col" aria-sort={on ? (sort.dir === "asc" ? "ascending" : "descending") : "none"} className="h-9 px-4 text-xs font-semibold whitespace-nowrap text-ink-muted">
                  <Link href={href({ ...filter, sort: nextSort(filter.sort, c.key) })} scroll={false} className="inline-flex items-center gap-1 rounded-sm outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface" data-testid={`sort-${c.key}`}>
                    {c.label}
                    <span aria-hidden="true" className="font-mono">{on ? (sort.dir === "asc" ? "↑" : "↓") : ""}</span>
                  </Link>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id} className="h-10 border-t border-hairline hover:bg-tint" data-testid="response-row">
              <th scope="row" className="px-4 font-semibold whitespace-nowrap">{nameOf(p)}</th>
              {fields.map((f) => <td key={f.key} className="px-4 whitespace-nowrap">{p.fields[f.key] ?? ""}</td>)}
              <td className="px-4 whitespace-nowrap"><Status p={p} /></td>
              <td className="px-4 font-mono whitespace-nowrap">{RESPONSES_COPY.progressOf(p.answered, p.visible)}</td>
              <td className="px-4 whitespace-nowrap" data-testid="submitted-cell">{p.submittedAt ? formatUtc(p.submittedAt) : RESPONSES_COPY.notYet}</td>
              <td className="px-4 whitespace-nowrap">{p.source === "public" ? RESPONSES_COPY.publicLink : RESPONSES_COPY.personalInvite}</td>
              <td className="px-4 font-mono">{p.reminders ?? RESPONSES_COPY.none}</td>
              <td className="px-4 font-mono">{p.withComment}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const nameOf = (p: PersonRow) => p.fields.name || (p.anon !== null ? RESPONSES_COPY.anonymous(p.anon) : RESPONSES_COPY.anonymous(0));

function Status({ p }: { p: PersonRow }) {
  if (p.status === "invited") return <NeutralPill>{RESPONSES_COPY.invited}</NeutralPill>;
  if (p.status === "inProgress") return <NeutralPill>{RESPONSES_COPY.inProgress}</NeutralPill>;
  return (
    <span className="inline-flex items-center gap-2">
      <StatusPill status="agree">{RESPONSES_COPY.submittedStatus}</StatusPill>
      {p.changedSince && <span className="text-xs font-semibold text-sun-text">{RESPONSES_COPY.changedSince}</span>}
      {p.submittedAgain && <span className="text-xs text-ink-muted">{RESPONSES_COPY.submittedAgain}</span>}
    </span>
  );
}
