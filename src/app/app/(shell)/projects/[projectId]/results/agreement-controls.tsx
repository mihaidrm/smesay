"use client";
// The Agreement tab's controls (stories/E8-3, acceptance 2, 4 and 5): the view switch (Table,
// Columns, Share; the design system's segmented control, kept per PM per instrument through
// saveView), "Split by [field]" over the dropdown respondent fields, and the sort of the items
// within an area with its direction. The split and the sort are in the URL (filterQuery), so
// a view can be shared. Copy: docs/copy/app.md, Results.
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { AGREEMENT_COPY } from "@/lib/results-copy";
import { AGREEMENT_SORTS, type AgreementSort } from "@/lib/results-agreement";
import { filterQuery, type FilterContext, type ResultsFilter } from "@/lib/results-filter";
import { saveView } from "./actions";

export type AgreementView = "table" | "columns" | "share";
const VIEWS: AgreementView[] = ["table", "columns", "share"];
const SELECT = "h-8 rounded-lg border border-hairline-strong bg-surface px-2 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-ground";

export function AgreementControls({ projectId, view, filter, ctx, sort }: { projectId: string; view: AgreementView; filter: ResultsFilter; ctx: FilterContext; sort: { key: AgreementSort; dir: "asc" | "desc" } }) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const go = (next: ResultsFilter) => {
    const q = filterQuery(next, ctx);
    startTransition(() => router.push(q ? `${pathname}?${q}` : pathname, { scroll: false }));
  };
  const pick = (v: AgreementView) => startTransition(async () => {
    setError(null);
    const result = await saveView(projectId, v).catch(() => ({ error: AGREEMENT_COPY.saveFailed }));
    // saveView revalidates the page, which renders the new view.
    if (result.error) setError(result.error);
  });
  const splits = ctx.fields.filter((f) => f.type === "dropdown");
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3" aria-busy={pending || undefined} data-testid="agreement-controls">
      <SegmentedControl label={AGREEMENT_COPY.viewLabel} value={view} onChange={(v) => v !== view && pick(v)} options={VIEWS.map((v) => ({ value: v, label: AGREEMENT_COPY.views[v] }))} />
      {splits.length > 0 && (
        <label className="flex items-center gap-2 text-xs font-semibold text-ink-muted">
          {AGREEMENT_COPY.splitBy}
          <select value={filter.split ?? ""} onChange={(e) => go({ ...filter, split: e.target.value || null })} className={SELECT} data-testid="split-by">
            <option value="">{AGREEMENT_COPY.noSplit}</option>
            {splits.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
          </select>
        </label>
      )}
      <label className="flex items-center gap-2 text-xs font-semibold text-ink-muted">
        {AGREEMENT_COPY.sortBy}
        <select value={sort.key} onChange={(e) => go({ ...filter, sort: { key: e.target.value, dir: e.target.value === "ref" ? "asc" : "desc" } })} className={SELECT} data-testid="sort-items">
          {AGREEMENT_SORTS.map((k) => <option key={k} value={k}>{AGREEMENT_COPY.sorts[k]}</option>)}
        </select>
      </label>
      <label className="flex items-center gap-2 text-xs font-semibold text-ink-muted">
        {AGREEMENT_COPY.order}
        <select value={sort.dir} onChange={(e) => go({ ...filter, sort: { key: sort.key, dir: e.target.value === "desc" ? "desc" : "asc" } })} className={SELECT} data-testid="sort-dir">
          <option value="asc">{AGREEMENT_COPY.asc}</option>
          <option value="desc">{AGREEMENT_COPY.desc}</option>
        </select>
      </label>
      {error && <span role="alert" className="text-sm text-danger">{error}</span>}
    </div>
  );
}
