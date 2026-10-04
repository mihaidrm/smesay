// The item detail (stories/E8-5; the PM app board, item detail panel): a 560 px panel over
// the right of Results with the item's reference, area, reader text and original text under
// it, the proposed value, the four counts and "[N] not yet answered", then a row per person
// the page's filter keeps who sees the item: the kind (Agree, Different priority, Disagree,
// Unclear, or Rated where no proposal was shown) or In progress or Not started, their value
// where it differs from the proposal, and the reason, question or comment.
// The frame is DetailShell (design note 62), not a modal sheet, so the tab behind stays usable. The item is in the URL (item=[id]) so the panel can be
// linked within the workspace; Close returns to the tab. Counts honour the page's filter and
// switch (src/db/queries/results.ts detail.item). Copy: docs/copy/app.md, Results.
import Link from "next/link";
import { NeutralPill, StatusPill } from "@/components/ui/status-pill";
import type { Instrument } from "@/db/queries/instruments";
import { detail, type DetailRow } from "@/db/queries/results";
import type { WorkspaceId } from "@/db/types";
import { textFor, type ReaderFields } from "@/lib/item-text";
import { DETAIL_COPY, RESPONSES_COPY } from "@/lib/results-copy";
import { KIND_LABELS, type ResultsFilter } from "@/lib/results-filter";
import { labelFor, proposedCode } from "@/lib/scoring";
import { buttonVariants } from "@/components/ui/button";
import { DetailShell } from "./detail-shell";

type Props = { ws: WorkspaceId; instrument: Instrument; itemId: string; filter: ResultsFilter; closeHref: string };

const PILL: Record<string, "agree" | "pushedBack" | "disagree" | "unclear"> = { agree: "agree", change: "pushedBack", disagree: "disagree", unclear: "unclear" };

export async function DetailPanel({ ws, instrument, itemId, filter, closeHref }: Props) {
  const found = await detail.item(ws, instrument.id, itemId, filter);
  if (!found) return null;
  const { item, rows } = found;
  const method = instrument.method;
  const proposed = instrument.showProposed ? proposedCode(method, item.proposedValue) : null;
  const label = (code: string | null) => (code ? (labelFor(method, instrument.scaleLabels, code) ?? code) : "");
  const title = textFor({ readerStatus: item.readerStatus as ReaderFields["readerStatus"], readerText: item.readerText, originalText: item.originalText });
  const count = (k: string) => rows.filter((r) => r.kind === k).length;
  const notYet = rows.filter((r) => r.kind === null).length;
  return (
    <DetailShell closeHref={closeHref} titleId="detail-title">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="font-mono text-xs text-ink-muted">{[item.reference, item.area].filter(Boolean).join(" · ")}</p>
          <h2 id="detail-title" tabIndex={-1} className="text-lg leading-6 font-bold outline-none" data-testid="detail-title">{title}</h2>
          {title !== item.originalText && <p className="text-sm text-ink-muted" data-testid="detail-original">{DETAIL_COPY.original}: {item.originalText}</p>}
        </div>
        <Link href={closeHref} scroll={false} className={buttonVariants({ variant: "secondary", size: "small" })} data-testid="detail-close">{DETAIL_COPY.close}</Link>
      </div>
      {proposed && <p className="text-sm">{DETAIL_COPY.proposed}: <span className="font-semibold">{label(proposed)}</span></p>}
      <p className="font-mono text-xs text-ink-muted" data-testid="detail-counts">
        {instrument.showProposed ? DETAIL_COPY.counts(count("agree"), count("change"), count("disagree"), count("unclear"), notYet) : DETAIL_COPY.ratedCounts(count("pick"), count("unclear"), notYet)}
      </p>
      <ul className="flex flex-col divide-y divide-hairline" data-testid="detail-rows">
        {rows.map((r) => <Row key={r.personId} r={r} proposed={proposed} label={label} />)}
      </ul>
    </DetailShell>
  );
}

function Row({ r, proposed, label }: { r: DetailRow; proposed: string | null; label: (code: string | null) => string }) {
  const name = r.who ?? RESPONSES_COPY.anonymous(r.anon ?? 0);
  const role = r.fields.role;
  // Submit needs every item the person sees answered (E7-5); a submitted row without an answer
  // is a guard case and reads Not answered rather than In progress.
  const pill = r.kind && PILL[r.kind] ? <StatusPill status={PILL[r.kind]}>{KIND_LABELS[r.kind as keyof typeof KIND_LABELS]}</StatusPill>
    : r.kind ? <NeutralPill>{KIND_LABELS[r.kind as keyof typeof KIND_LABELS] ?? r.kind}</NeutralPill>
    : r.invited ? <NeutralPill>{DETAIL_COPY.notStarted}</NeutralPill>
    : r.submitted ? <NeutralPill>{KIND_LABELS.none}</NeutralPill> : <NeutralPill>{DETAIL_COPY.inProgress}</NeutralPill>;
  const text = r.kind === null ? null : r.reason ?? r.comment;
  return (
    <li className="flex flex-col gap-1 py-3" data-testid="detail-row">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold">{name}</span>
        {role && <span className="text-xs text-ink-muted">{role}</span>}
        {pill}
        {r.kind !== null && !r.submitted && <NeutralPill>{DETAIL_COPY.notSubmitted}</NeutralPill>}
        {r.value && r.value !== proposed && <span className="text-xs font-semibold">{label(r.value)}</span>}
      </div>
      {r.kind === null ? <p className="text-sm text-ink-muted">{DETAIL_COPY.noAnswer}</p> : text && <p className="text-sm">{text}</p>}
    </li>
  );
}
