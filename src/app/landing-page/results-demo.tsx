"use client";
// The results fragment of "What you get back" (stories/E12-1 as amended on 2026-10-04,
// design note 53): the dashboard of R1 as planned (stories/E8-1 tiles and filter bar, E8-3
// the three views of agreement), drawn as static markup over the Marlow sample (decision
// 0005; the numbers are the seed's, src/db/seed/sample.ts `expected`: 5 of 7 submitted, 30
// answers, 19 agree, 7 different priority, 2 disagree, 2 unclear) until the dashboard
// components exist. The view switch is the one live part: Table (a stacked bar per item),
// Columns (aligned bars per kind per area) and Share (a donut per area with the numbers
// beside it). The kinds are named as decision 0014 names them and drawn in the status
// colours of docs/design-system.md (Agree #2F855A, Different priority in the pushed-back
// #B7791F, Disagree #718096, Unclear #7C3AED), written out because the landing keeps its
// own light section whatever the app's mode (decision 0041, point 2). Every bar's kind and
// count is also text for screen readers, and every chart prints its numbers. The switch is
// the landing's variant of the segmented control (design note 53) with toggle buttons
// (aria-pressed: developer.mozilla.org/docs/Web/Accessibility/ARIA/Reference/Attributes/
// aria-pressed).
import { useState } from "react";
import { cn } from "cn";

type Kind = "agree" | "change" | "disagree" | "unclear";
const KINDS: { key: Kind; label: string; colour: string }[] = [
  { key: "agree", label: "Agree", colour: "#2F855A" },
  { key: "change", label: "Different priority", colour: "#B7791F" },
  { key: "disagree", label: "Disagree", colour: "#718096" },
  { key: "unclear", label: "Unclear", colour: "#7C3AED" },
];
type Counts = Record<Kind, number>;
const c = (agree: number, change = 0, disagree = 0, unclear = 0): Counts => ({ agree, change, disagree, unclear });

// The seed's five submitted responses per item (src/db/seed/sample.ts answers).
const ITEMS: { ref: string; text: string; area: string; counts: Counts }[] = [
  { ref: "CL-01", text: "Photograph a receipt and the amount, date and merchant are filled in automatically.", area: "Submitting", counts: c(4, 1) },
  { ref: "CL-02", text: "Split one receipt across two projects or cost centres.", area: "Submitting", counts: c(2, 2, 0, 1) },
  { ref: "CL-03", text: "Managers approve or reject from the email, without logging in.", area: "Approving", counts: c(4, 1) },
  { ref: "CL-04", text: "Expenses over the policy limit are flagged before they reach the approver.", area: "Approving", counts: c(2, 2, 1) },
  { ref: "CL-05", text: "Approved expenses are paid with the next salary run.", area: "Paying", counts: c(5) },
  { ref: "CL-06", text: "Employees can request a cash advance before a trip.", area: "Paying", counts: c(2, 1, 1, 1) },
];
const AREAS = ["Submitting", "Approving", "Paying"].map((area) => ({
  area,
  counts: ITEMS.filter((it) => it.area === area).reduce((sum, it) => c(sum.agree + it.counts.agree, sum.change + it.counts.change, sum.disagree + it.counts.disagree, sum.unclear + it.counts.unclear), c(0)),
}));
const total = (n: Counts) => n.agree + n.change + n.disagree + n.unclear;
const pct = (n: Counts) => `${Math.round((n.agree / total(n)) * 100)}%`;
const spoken = (n: Counts) => KINDS.filter((k) => n[k.key] > 0).map((k) => `${k.label} ${n[k.key]}`).join(", ");

const VIEWS = ["Table", "Columns", "Share"] as const;
type View = (typeof VIEWS)[number];

function Legend() {
  return (
    <div className="flex flex-wrap gap-x-3.5 gap-y-1 text-xs text-[#5E5A72]">
      {KINDS.map((k) => <span key={k.key}><span className="mr-1 inline-block size-2.5 rounded-[3px] align-[-1px]" style={{ background: k.colour }} aria-hidden="true" />{k.label}</span>)}
    </div>
  );
}

function TableView() {
  return (
    <ul className="flex flex-col gap-3 text-[13px]" data-testid="results-table">
      {ITEMS.map((it) => (
        <li key={it.ref} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1.5 md:grid-cols-[minmax(0,1fr)_180px_44px]">
          <div className="flex min-w-0 gap-2"><span className="shrink-0 font-mono text-[12px] text-[#5E5A72]">{it.ref}</span><span className="truncate">{it.text}</span></div>
          <span className="text-right font-mono md:order-last">{pct(it.counts)}<span className="sr-only"> agree: {spoken(it.counts)}</span></span>
          <div className="col-span-2 flex h-2.5 gap-[2px] md:col-span-1" aria-hidden="true">
            {KINDS.map((k) => it.counts[k.key] > 0 && <div key={k.key} className="rounded-full" style={{ background: k.colour, flexGrow: it.counts[k.key] }} />)}
          </div>
        </li>
      ))}
    </ul>
  );
}

function ColumnsView() {
  const max = Math.max(...AREAS.flatMap((a) => KINDS.map((k) => a.counts[k.key])));
  return (
    <div className="grid grid-cols-3 gap-3" data-testid="results-columns">
      {AREAS.map((a) => (
        <div key={a.area} className="flex flex-col gap-2">
          <ul aria-label={a.area} className="flex h-[132px] items-end gap-1.5 border-b border-[#CFCBE0] px-1">
            {KINDS.map((k) => (
              <li key={k.key} className="flex flex-1 flex-col items-center justify-end gap-1">
                <span className="font-mono text-[12px] text-[#5E5A72]"><span className="sr-only">{k.label} </span>{a.counts[k.key]}</span>
                <div className="w-full rounded-t-[4px]" style={{ background: k.colour, height: `${Math.max((a.counts[k.key] / max) * 100, a.counts[k.key] ? 6 : 1)}px` }} aria-hidden="true" />
              </li>
            ))}
          </ul>
          <div className="flex justify-between gap-1 text-[13px]"><span className="truncate">{a.area}</span><span className="font-mono">{pct(a.counts)}</span></div>
        </div>
      ))}
    </div>
  );
}

function ShareView() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3" data-testid="results-share">
      {AREAS.map((a) => {
        let at = 0;
        const stops = KINDS.filter((k) => a.counts[k.key] > 0).map((k) => {
          const from = at;
          at += (a.counts[k.key] / total(a.counts)) * 360;
          return `${k.colour} ${from}deg ${at - 2}deg, #F7F6FB ${at - 2}deg ${at}deg`;
        });
        return (
          <div key={a.area} className="flex items-center gap-3 sm:flex-col sm:items-start">
            <div className="relative size-[88px] shrink-0 rounded-full" style={{ background: `conic-gradient(${stops.join(", ")})` }} aria-hidden="true">
              <div className="absolute inset-[16px] flex items-center justify-center rounded-full bg-[#F7F6FB] font-mono text-[13px] font-bold text-[#15131F]">{pct(a.counts)}</div>
            </div>
            <div className="flex flex-col gap-0.5 text-[12px]">
              <span className="text-[13px] font-semibold">{a.area} <span className="font-mono font-normal text-[#5E5A72]">{pct(a.counts)} agree</span></span>
              {KINDS.filter((k) => a.counts[k.key] > 0).map((k) => <span key={k.key} className="text-[#5E5A72]">{k.label} <span className="font-mono text-[#15131F]">{a.counts[k.key]}</span></span>)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ResultsDemo() {
  const [view, setView] = useState<View>("Table");
  return (
    <div className="flex flex-col gap-4" data-testid="results-demo" data-view={view}>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4" data-testid="results-tiles">
        {[["Submitted", "5 of 7"], ["Agreement", "63%"], ["Different priority", "7"], ["Unclear", "2"]].map(([label, value]) => (
          <div key={label} className="flex flex-col gap-0.5 rounded-[14px] border border-[#E6E3F0] bg-white px-3 py-2.5">
            <span className="text-[13px] text-[#5E5A72]">{label}</span>
            <span className="font-mono text-[30px] leading-9 font-extrabold tracking-[-0.03em] whitespace-nowrap">{value}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full border border-[#CFCBE0] bg-white px-2.5 py-1 font-semibold">Role: any</span>
        <span className="rounded-full border border-[#CFCBE0] bg-white px-2.5 py-1 font-semibold">With a reason</span>
        <span className="rounded-full border border-dashed border-[#CFCBE0] px-2.5 py-1 font-semibold text-[#5E5A72]">+ Choose tiles</span>
        <div className="ml-auto flex rounded-full bg-[#EEEAFF] p-[3px]" role="group" aria-label="Chart view">
          {VIEWS.map((v) => (
            <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)} className={cn("h-8 rounded-full px-3.5 font-semibold whitespace-nowrap outline-hidden transition-[background-color,box-shadow,color] duration-150 focus-visible:ring-2 focus-visible:ring-[#6D4CF5] focus-visible:ring-offset-2 motion-reduce:transition-none", view === v ? "bg-white text-[#15131F] shadow-[0_2px_8px_rgba(45,32,110,0.14)]" : "text-[#5E5A72] hover:text-[#15131F]")}>{v}</button>
          ))}
        </div>
      </div>
      <div className="min-h-[188px]">{view === "Table" ? <TableView /> : view === "Columns" ? <ColumnsView /> : <ShareView />}</div>
      <Legend />
      <p className="border-t border-[#E6E3F0] pt-3 text-xs text-[#5E5A72]">Filter by any field you asked for, such as role, or by who left a reason. Every chart, count and export follows the same filter.</p>
    </div>
  );
}
