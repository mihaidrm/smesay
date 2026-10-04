"use client";
// The conflict view's field (stories/E8-6, acceptance 1): a select of the dropdown respondent
// fields that writes gaps=[key] into the URL with the rest of the page's state (filterQuery),
// so the view can be shared; an open item's detail (E8-5) stays open.
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { CONFLICT_COPY } from "@/lib/results-copy";
import { filterQuery, type FilterContext, type ResultsFilter } from "@/lib/results-filter";

const SELECT = "h-8 rounded-lg border border-hairline-strong bg-surface px-2 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-ground";

export function GapField({ filter, ctx }: { filter: ResultsFilter; ctx: FilterContext }) {
  const router = useRouter();
  const pathname = usePathname();
  const item = useSearchParams().get("item");
  const [pending, startTransition] = useTransition();
  const fields = ctx.fields.filter((f) => f.type === "dropdown");
  const go = (gaps: string) => {
    const q = filterQuery({ ...filter, gaps }, ctx, item ? { item } : {});
    startTransition(() => router.push(q ? `${pathname}?${q}` : pathname, { scroll: false }));
  };
  return (
    <label className="flex items-center gap-2 text-xs font-semibold text-ink-muted" aria-busy={pending || undefined}>
      {CONFLICT_COPY.compareBy}
      <select value={filter.gaps ?? ""} onChange={(e) => go(e.target.value)} className={SELECT} data-testid="gap-field">
        {fields.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
      </select>
    </label>
  );
}
