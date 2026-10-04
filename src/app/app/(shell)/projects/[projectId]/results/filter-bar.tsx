"use client";
// The one filter bar of Results (stories/E8-1, acceptance 3): a dropdown field's options and
// the answer kinds and statuses as toggle chips (docs/design-system.md, Toggle chip), a text
// field as a "contains" box applied on Enter or when it loses focus, the perspective as a
// select, and Clear filters while anything narrows. Every change writes the URL
// (src/lib/results-filter.ts filterQuery), so the server renders the filtered page and a view
// can be shared; the tab stays. data-ready marks the bar once it has hydrated (a
// client-only snapshot, react.dev/reference/react/useSyncExternalStore), for the tests.
// Copy: docs/copy/app.md, Results.
import { usePathname, useRouter } from "next/navigation";
import { useState, useSyncExternalStore, useTransition } from "react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { RESULTS_COPY } from "@/lib/results-copy";
import { clearedFilter, filterActive, filterQuery, KIND_LABELS, RESULTS_STATUSES, STATUS_LABELS, type FilterContext, type ResultsFilter, type ResultsKind } from "@/lib/results-filter";

const CHIP = "inline-flex h-6 items-center rounded-full border px-2.5 text-xs font-semibold outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface aria-pressed:border-transparent aria-pressed:bg-violet-soft aria-pressed:text-violet-text border-hairline-strong text-ink-muted hover:text-ink";

function Chip({ on, onClick, children, testId }: { on: boolean; onClick: () => void; children: React.ReactNode; testId?: string }) {
  return <button type="button" aria-pressed={on} onClick={onClick} className={CHIP} data-testid={testId}>{children}</button>;
}

const toggle = <T,>(xs: T[], x: T): T[] => (xs.includes(x) ? xs.filter((y) => y !== x) : [...xs, x]);
const noSubscribe = () => () => {};

export function FilterBar({ filter, ctx, stored, tab, kinds }: { filter: ResultsFilter; ctx: FilterContext; stored: boolean | null; tab: string | null; kinds: ResultsKind[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const ready = useSyncExternalStore(noSubscribe, () => true, () => false);
  const go = (next: ResultsFilter) => {
    const q = filterQuery(next, ctx, stored, tab ? { tab } : {});
    startTransition(() => router.push(q ? `${pathname}?${q}` : pathname, { scroll: false }));
  };
  const setField = (key: string, value: string[] | string | null) => {
    const fields = { ...filter.fields };
    if (value === null || value.length === 0) delete fields[key];
    else fields[key] = value;
    go({ ...filter, fields });
  };
  return (
    <section aria-label={RESULTS_COPY.filterLabel} aria-busy={pending || undefined} className="card flex flex-col gap-3 p-4" data-testid="filter-bar" data-ready={ready || undefined}>
      <div className="flex flex-wrap items-start gap-x-6 gap-y-3">
        {ctx.fields.map((spec) => {
          const v = filter.fields[spec.key];
          if (spec.type === "dropdown") {
            const picked = Array.isArray(v) ? v : [];
            return (
              <div key={spec.key} role="group" aria-label={spec.label} className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-semibold text-ink-muted">{spec.label}</span>
                {(spec.options ?? []).map((o) => <Chip key={o} on={picked.includes(o)} onClick={() => setField(spec.key, toggle(picked, o))} testId={`filter-${spec.key}`}>{o}</Chip>)}
              </div>
            );
          }
          return <ContainsBox key={spec.key} label={RESULTS_COPY.contains(spec.label)} value={typeof v === "string" ? v : ""} onApply={(text) => setField(spec.key, text.trim() || null)} />;
        })}
        <div role="group" aria-label={RESULTS_COPY.answer} className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-ink-muted">{RESULTS_COPY.answer}</span>
          {kinds.map((k) => <Chip key={k} on={filter.kinds.includes(k)} onClick={() => go({ ...filter, kinds: toggle(filter.kinds, k) })} testId={`filter-kind-${k}`}>{KIND_LABELS[k]}</Chip>)}
          <Chip on={filter.withComment} onClick={() => go({ ...filter, withComment: !filter.withComment })} testId="filter-comment">{RESULTS_COPY.withComment}</Chip>
        </div>
        <div role="group" aria-label={RESULTS_COPY.status} className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-ink-muted">{RESULTS_COPY.status}</span>
          {RESULTS_STATUSES.map((s) => <Chip key={s} on={filter.status.includes(s)} onClick={() => go({ ...filter, status: toggle(filter.status, s) })} testId={`filter-status-${s}`}>{STATUS_LABELS[s]}</Chip>)}
        </div>
        {ctx.perspectives.length > 0 && (
          <label className="flex items-center gap-2 text-xs font-semibold text-ink-muted">
            {RESULTS_COPY.perspective}
            <select value={filter.perspective ?? ""} onChange={(e) => go({ ...filter, perspective: e.target.value || null })} className="h-8 rounded-lg border border-hairline-strong bg-surface px-2 text-sm font-normal text-ink outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface">
              <option value="">{RESULTS_COPY.anyPerspective}</option>
              {ctx.perspectives.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>
        )}
        {filterActive(filter) && <Button type="button" variant="secondary" size="small" onClick={() => go(clearedFilter(filter))} data-testid="clear-filters">{RESULTS_COPY.clearFilters}</Button>}
      </div>
    </section>
  );
}

function ContainsBox({ label, value, onApply }: { label: string; value: string; onApply: (text: string) => void }) {
  const [text, setText] = useState(value);
  const apply = () => { if (text.trim() !== value) onApply(text); };
  return (
    <form onSubmit={(e) => { e.preventDefault(); apply(); }} className="flex items-center gap-2">
      <label className="flex items-center gap-2 text-xs font-semibold text-ink-muted">
        {label}
        <input type="search" value={text} maxLength={100} onChange={(e) => setText(e.target.value)} onBlur={apply} className={cn("h-8 w-44 rounded-lg border border-hairline-strong bg-surface px-2 text-sm font-normal text-ink outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface")} />
      </label>
    </form>
  );
}
