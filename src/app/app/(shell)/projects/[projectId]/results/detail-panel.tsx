// The item detail (stories/E8-5; the PM app board, item detail; design note 62): in place of
// the tabs, Back to the tab, the item's reference and area, the reader text with the original
// text under it, the proposed value and the table of answers, and beside it On this item: the
// four counts and Not yet answered (Rated and Unclear for an item with no proposal). A row
// per person the page's filter keeps who sees the item: the pill (src/lib/results-detail.ts),
// their value where it differs from the proposal, and the reason, question or comment. The
// item is in the URL (item=[id]) so the detail can be linked within the workspace. Counts
// honour the page's filter and switch (src/db/queries/results.ts detail.item). Under Names
// hidden and Anonymous (stories/E5-7) the query sends no name, no role and no invitee row. Copy:
// docs/copy/app.md, Results.
import Link from "next/link";
import { NeutralPill, NotAnsweredPill, StatusPill } from "@/components/ui/status-pill";
import type { Instrument } from "@/db/queries/instruments";
import { detail, type DetailRow } from "@/db/queries/results";
import type { WorkspaceId } from "@/db/types";
import { textFor, type ReaderFields } from "@/lib/item-text";
import { DETAIL_COPY, RESPONSES_COPY } from "@/lib/results-copy";
import { detailCountKeys, rowPill, showValue } from "@/lib/results-detail";
import { type ResultsFilter } from "@/lib/results-filter";
import { labelFor, proposedCode } from "@/lib/scoring";
import { buttonVariants } from "@/components/ui/button";
import { DetailShell } from "./detail-shell";

type Props = { ws: WorkspaceId; instrument: Instrument; itemId: string; filter: ResultsFilter; closeHref: string; backLabel: string };

const CELL = "px-4 py-2.5 align-top";

export async function DetailPanel({ ws, instrument, itemId, filter, closeHref, backLabel }: Props) {
  const found = await detail.item(ws, instrument.id, itemId, filter);
  const back = <Link href={closeHref} scroll={false} className={buttonVariants({ variant: "secondary", size: "small" })} data-testid="detail-close">{backLabel}</Link>;
  if (!found) {
    return (
      <DetailShell itemId={itemId} closeHref={closeHref} titleId="detail-title">
        <div>{back}</div>
        <h2 id="detail-title" tabIndex={-1} className="text-sm font-normal text-ink-muted outline-none" data-testid="detail-not-found">{DETAIL_COPY.notFound}</h2>
      </DetailShell>
    );
  }
  const { item, counts, rows } = found;
  const method = instrument.method;
  const proposed = instrument.showProposed ? proposedCode(method, item.proposedValue) : null;
  const label = (code: string | null) => (code ? (labelFor(method, instrument.scaleLabels, code) ?? code) : "");
  const title = textFor({ readerStatus: item.readerStatus as ReaderFields["readerStatus"], readerText: item.readerText, originalText: item.originalText });
  return (
    <DetailShell itemId={itemId} closeHref={closeHref} titleId="detail-title">
      <div className="flex flex-wrap items-center gap-3">
        {back}
        <p className="font-mono text-xs text-ink-muted">{[item.reference, item.area].filter(Boolean).join(" · ")}</p>
      </div>
      <div className="grid items-start gap-5 lg:grid-cols-[1fr_360px]">
        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-col gap-2 rounded-md border border-hairline bg-surface p-4">
            <h2 id="detail-title" tabIndex={-1} className="text-lg leading-6 font-bold outline-none" data-testid="detail-title">{title}</h2>
            {title !== item.originalText && <p className="text-sm text-ink-muted" data-testid="detail-original">{DETAIL_COPY.original}: {item.originalText}</p>}
            {proposed && <p className="flex items-center gap-2 text-sm text-ink-muted">{DETAIL_COPY.proposed} <NeutralPill>{label(proposed)}</NeutralPill></p>}
          </div>
          {rows.length === 0 ? (
            <p className="text-sm text-ink-muted" data-testid="detail-no-rows">{DETAIL_COPY.noRows}</p>
          ) : (
            <div className="overflow-x-auto rounded-md border border-hairline bg-surface">
              <table className="w-full text-left text-sm" data-testid="detail-rows">
                <caption className="sr-only">{DETAIL_COPY.caption}</caption>
                <thead>
                  <tr className="border-b border-hairline">
                    <th scope="col" className="h-9 px-4 text-xs font-semibold text-ink-muted">{DETAIL_COPY.columns.who}</th>
                    <th scope="col" className="h-9 px-4 text-xs font-semibold text-ink-muted">{DETAIL_COPY.columns.answer}</th>
                    <th scope="col" className="h-9 px-4 text-xs font-semibold text-ink-muted">{DETAIL_COPY.columns.text}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {rows.map((r) => <Row key={r.personId} r={r} proposed={proposed} label={label} />)}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2.5 rounded-md border border-hairline bg-surface p-4" data-testid="detail-counts">
          <h3 className="text-sm font-semibold">{DETAIL_COPY.onItem}</h3>
          <dl className="flex flex-col gap-2 text-sm">
            {detailCountKeys(proposed).map((k) => (
              <div key={k} className={k === "notYet" ? "flex justify-between text-ink-muted" : "flex justify-between"}>
                <dt>{DETAIL_COPY.countLabels[k]}</dt>
                <dd className="font-mono" data-testid={`detail-count-${k}`}>{counts[k]}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </DetailShell>
  );
}

function Row({ r, proposed, label }: { r: DetailRow; proposed: string | null; label: (code: string | null) => string }) {
  const name = r.who ?? RESPONSES_COPY.anonymous(r.anon ?? 0);
  const role = r.fields.role;
  const p = rowPill(r, DETAIL_COPY);
  const pill = p.type === "status" ? <StatusPill status={p.status}>{p.label}</StatusPill> : p.type === "neutral" ? <NeutralPill>{p.label}</NeutralPill> : <NotAnsweredPill />;
  const text = r.kind === null ? null : r.reason ?? r.comment;
  return (
    <tr data-testid="detail-row">
      <td className={CELL}>
        <div className="flex flex-col">
          <span className="font-semibold">{name}</span>
          {role && <span className="text-xs text-ink-muted">{role}</span>}
        </div>
      </td>
      <td className={CELL}>
        <div className="flex flex-wrap items-center gap-2">
          {pill}
          {r.kind !== null && !r.submitted && <NeutralPill>{DETAIL_COPY.notSubmitted}</NeutralPill>}
          {showValue(r.value, proposed) && <span className="text-xs font-semibold">{label(r.value)}</span>}
        </div>
      </td>
      <td className={CELL}>{r.kind === null ? <span className="text-ink-muted">{DETAIL_COPY.noAnswer}</span> : text}</td>
    </tr>
  );
}
