// The charts of Results (stories/E8-3; docs/design-system.md, Data; design note 40), drawn on
// the server with no script: a stacked bar (the compact view), aligned bars on a common
// baseline (the readable one), a donut (area and list level only, at most five slices) and the
// legend. Thin marks, 2 px surface gaps between segments, direct labels only where they fit,
// text in ink tokens never in a series colour, the numbers always printed beside a donut. Each
// chart is an image to assistive technology with every count in its name (role="img",
// aria-label: developer.mozilla.org/docs/Web/Accessibility/ARIA/Reference/Roles/img_role).
// Added with E8-3 (design note 61).
import { cn } from "cn";

export type Series = { key: string; label: string; value: number; color: string; dashed?: boolean };

const describe = (title: string, series: Series[]) => `${title}: ${series.map((s) => `${s.label} ${s.value}`).join(", ")}`;

// A horizontal bar of the series in order, each segment as wide as its share.
export function StackedBar({ title, series, className }: { title: string; series: Series[]; className?: string }) {
  const total = series.reduce((a, s) => a + s.value, 0);
  return (
    <div role="img" aria-label={describe(title, series)} className={cn("flex h-5 w-full gap-0.5 overflow-hidden rounded-md", className)} data-testid="stacked-bar">
      {total === 0 ? <div className="h-full w-full rounded-md border border-dashed border-hairline-strong" /> : series.filter((s) => s.value > 0).map((s) => (
        <div key={s.key} style={{ flexGrow: s.value, background: s.dashed ? undefined : s.color }} className={cn("flex h-full min-w-0 basis-0 items-center justify-center first:rounded-l-md last:rounded-r-md", s.dashed && "border border-dashed border-hairline-strong bg-surface")} data-series={s.key}>
          {s.value / total >= 0.12 && <span aria-hidden="true" className={cn("font-mono text-[11px] font-bold", s.dashed ? "text-ink-muted" : "text-white")}>{s.value}</span>}
        </div>
      ))}
    </div>
  );
}

// One vertical bar per series on a common baseline, the value printed above each.
export function AlignedBars({ title, series, max, className }: { title: string; series: Series[]; max?: number; className?: string }) {
  const top = Math.max(1, max ?? Math.max(...series.map((s) => s.value), 0));
  return (
    <div role="img" aria-label={describe(title, series)} className={cn("flex h-40 items-end gap-3 border-b border-hairline-strong pb-0", className)} data-testid="aligned-bars">
      {series.map((s) => (
        <div key={s.key} className="flex h-full flex-1 flex-col items-center justify-end gap-1" data-series={s.key}>
          <span aria-hidden="true" className="font-mono text-xs font-bold text-ink">{s.value}</span>
          <div style={{ height: `${(s.value / top) * 100}%`, background: s.dashed ? undefined : s.color }} className={cn("w-full max-w-10 rounded-t-sm", s.dashed && "border border-b-0 border-dashed border-hairline-strong bg-surface")} />
        </div>
      ))}
    </div>
  );
}

// A donut of at most five slices with 2 px surface gaps, the line under it ("19 of 30 agree")
// and the numbers beside it as the legend.
export function Donut({ title, series, line, size = 120 }: { title: string; series: Series[]; line: string; size?: number }) {
  const total = series.reduce((a, s) => a + s.value, 0);
  const r = 40;
  const c = 2 * Math.PI * r;
  let at = 0;
  return (
    <figure className="flex items-center gap-5" data-testid="donut">
      <svg role="img" aria-label={`${describe(title, series)}. ${line}`} width={size} height={size} viewBox="0 0 100 100" className="shrink-0 -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--hairline)" strokeWidth="14" />
        {total > 0 && series.filter((s) => s.value > 0).map((s) => {
          const len = (s.value / total) * c;
          const dash = `${Math.max(0, len - (series.filter((x) => x.value > 0).length > 1 ? 1.2 : 0))} ${c}`;
          const el = <circle key={s.key} cx="50" cy="50" r={r} fill="none" stroke={s.dashed ? "var(--hairline-strong)" : s.color} strokeWidth="14" strokeDasharray={dash} strokeDashoffset={-at} data-series={s.key} />;
          at += len;
          return el;
        })}
      </svg>
      <figcaption className="flex flex-col gap-1.5">
        <span className="text-sm font-bold text-ink" data-testid="donut-line">{line}</span>
        <Legend series={series} numbers />
      </figcaption>
    </figure>
  );
}

// The legend: a swatch and the name of each series, with its number when asked.
export function Legend({ series, numbers = false, className }: { series: Series[]; numbers?: boolean; className?: string }) {
  return (
    <ul className={cn("flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted", numbers && "flex-col", className)} data-testid="legend">
      {series.map((s) => (
        <li key={s.key} className="flex items-center gap-1.5">
          <span aria-hidden="true" className={cn("inline-block size-2.5 rounded-sm", s.dashed && "border border-dashed border-hairline-strong bg-surface")} style={s.dashed ? undefined : { background: s.color }} />
          <span>{s.label}</span>
          {numbers && <span className="font-mono font-bold text-ink">{s.value}</span>}
        </li>
      ))}
    </ul>
  );
}
