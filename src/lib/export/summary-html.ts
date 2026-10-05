// The PDF summary as HTML (stories/E10-3): A4 portrait with 16 mm margins (CSS @page:
// developer.mozilla.org/docs/Web/CSS/@page), Plus Jakarta Sans and Geist Mono embedded as
// data URLs (the design system's fonts, SIL Open Font License 1.1, files and licences in
// ./fonts), the status colours of docs/design-system.md with every count also in words, so no
// figure rests on colour alone. Page 1: the headline numbers, the agreement by area as
// stacked bars, the confidence histogram. Then the items of each area, the registers, and on
// its own page the sign-off record and the actions. The header and the footer are Page.pdf's
// templates (summaryHeader, summaryFooter), which Chromium prints in the top and bottom margins
// of every page: the workspace and the project, the sample's band, and "Page N of M"; page
// styles do not reach them, so they carry their own. Exact colours in print (print-color-adjust:
// developer.mozilla.org/docs/Web/CSS/print-color-adjust), since Page.pdf otherwise adjusts
// them. Pure: no database import, so a test renders it.
import { readFileSync } from "node:fs";
import { join } from "node:path";

export type SummaryCounts = { agree: number; change: number; disagree: number; unclear: number; pick: number; notAnswered: number };
export type SummaryView = {
  workspace: string; project: string; title: string; generatedAt: string; sample: boolean; lines: string[];
  tiles: { label: string; value: string }[];
  areas: { name: string; counts: SummaryCounts; percent: string }[];
  confidence: number[];
  tables: { area: string; rows: { ref: string; text: string; proposed: string; counts: SummaryCounts; percent: string }[] }[];
  // rows: the first REGISTER_ROWS_MAX of total; more: the line naming the CSV with the rest.
  registers: { title: string; columns: string[]; rows: string[][]; total: number; more: string | null; empty: string }[];
  signOffs: { who: string; when: string; confidence: string }[];
  actions: { state: string; kind: string; title: string; why: string; cites: string }[];
};

export const SUMMARY_COPY = {
  heading: "Summary",
  generated: (when: string) => `Made ${when}`,
  watermark: "Sample data, invented",
  agreementByArea: "Agreement by area",
  confidence: "How confident respondents are",
  confidenceAxis: (n: number, value: number) => `${value}: ${n}`,
  average: (avg: string, n: number) => `Average ${avg} from ${n} ${n === 1 ? "answer" : "answers"}`,
  noConfidenceYet: "No confidence given yet",
  items: "Items",
  columns: { ref: "Reference", item: "Item", proposed: "Proposed", agree: "Agree", change: "Different priority", disagree: "Disagree", unclear: "Unclear", pick: "Rated", notAnswered: "Not answered", agreement: "Agreement" },
  signOff: "Sign-off record",
  signOffColumns: ["Respondent", "Submitted", "Confidence"],
  noSignOffs: "No one has submitted yet.",
  noConfidence: "Not given",
  actions: "Actions",
  noActions: "No actions written.",
  more: (n: number, file: string) => `And ${n} more in the ${file} CSV on the Export tab.`,
  page: "Page",
  of: "of",
  countsInWords: (c: SummaryCounts) => [c.agree && `${c.agree} agree`, c.change && `${c.change} different priority`, c.disagree && `${c.disagree} disagree`, c.unclear && `${c.unclear} unclear`, c.pick && `${c.pick} rated`, c.notAnswered && `${c.notAnswered} not answered`].filter(Boolean).join(" · ") || "No answers",
};

// The status colours, Rated in the missing-item blue that starts the values ramp, apart from
// Unclear's violet; Not answered is an absence: the surface with a dashed strong hairline
// (docs/design-system.md, Charts and the status table).
const COLOURS = { agree: "#2f855a", change: "#b7791f", disagree: "#718096", unclear: "#7c3aed", pick: "#2b6cb0", notAnswered: "#ffffff" };
const NOT_ANSWERED_STROKE = "#cfcbe0";
let barId = 0;
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

let fonts: string | null = null;
function fontFaces(): string {
  if (fonts) return fonts;
  const dir = join(process.cwd(), "src/lib/export/fonts");
  const face = (family: string, file: string, range: string) => `@font-face{font-family:"${family}";src:url(data:font/woff2;base64,${readFileSync(join(dir, file)).toString("base64")}) format("woff2");font-weight:200 900;unicode-range:${range}}`;
  // The two subsets Google Fonts serves for Latin text (fonts.googleapis.com/css2): basic
  // Latin, and Latin Extended for Romanian and the other diacritics.
  const latin = "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD";
  const ext = "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF";
  fonts = [face("Jakarta", "plus-jakarta-sans-latin.woff2", latin), face("Jakarta", "plus-jakarta-sans-latin-ext.woff2", ext), face("GeistMono", "geist-mono-latin.woff2", latin), face("GeistMono", "geist-mono-latin-ext.woff2", ext)].join("");
  return fonts;
}

function stackedBar(c: SummaryCounts, width = 420, height = 14): string {
  const total = c.agree + c.change + c.disagree + c.unclear + c.pick + c.notAnswered;
  const id = `bar${(barId += 1)}`;
  const empty = `<rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="3" fill="${COLOURS.notAnswered}" stroke="${NOT_ANSWERED_STROKE}" stroke-dasharray="3 2"/>`;
  if (total === 0) return `<svg width="${width}" height="${height}" role="img" aria-label="${esc(SUMMARY_COPY.countsInWords(c))}">${empty}</svg>`;
  let x = 0;
  const parts = (["agree", "change", "disagree", "unclear", "pick"] as const).map((k) => {
    const w = (c[k] / total) * width;
    const r = w > 0 ? `<rect x="${x.toFixed(2)}" width="${w.toFixed(2)}" height="${height}" fill="${COLOURS[k]}"/>` : "";
    x += w;
    return r;
  });
  return `<svg width="${width}" height="${height}" role="img" aria-label="${esc(SUMMARY_COPY.countsInWords(c))}">${empty}<clipPath id="${id}"><rect width="${width}" height="${height}" rx="3"/></clipPath><g clip-path="url(#${id})">${parts.join("")}</g></svg>`;
}

// One hue (violet), a bar per value 1 to 5 with its count above, an empty bin a 4 px hairline,
// and the average printed as text (docs/design-system.md, Confidence at sign-off).
function histogram(values: number[]): string {
  const max = Math.max(1, ...values);
  const w = 56; const h = 110; const gap = 14;
  const bars = values.map((n, i) => {
    const bh = n === 0 ? 4 : (n / max) * (h - 30);
    const x = i * (w + gap);
    const fill = n === 0 ? "#e6e3f0" : "#6d4cf5";
    return `<rect x="${x}" y="${h - 20 - bh}" width="${w}" height="${bh}" rx="2" fill="${fill}"/><text x="${x + w / 2}" y="${h - 24 - bh}" text-anchor="middle" font-size="10" fill="#15131f">${n}</text><text x="${x + w / 2}" y="${h - 6}" text-anchor="middle" font-size="10" fill="#5e5a72">${i + 1}</text>`;
  });
  return `<svg width="${values.length * (w + gap)}" height="${h}" role="img" aria-label="${esc(values.map((n, i) => SUMMARY_COPY.confidenceAxis(n, i + 1)).join(", "))}">${bars.join("")}</svg>`;
}

const table = (columns: string[], rows: string[][], numeric: number[] = []) =>
  `<table><thead><tr>${columns.map((c, i) => `<th${numeric.includes(i) ? ' class="n"' : ""}>${esc(c)}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c, i) => `<td${numeric.includes(i) ? ' class="n"' : ""}>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;

const averageLine = (bins: number[]) => {
  const n = bins.reduce((a, b) => a + b, 0);
  return n === 0 ? SUMMARY_COPY.noConfidenceYet : SUMMARY_COPY.average((bins.reduce((a, b, i) => a + b * (i + 1), 0) / n).toFixed(1), n);
};

export function summaryHtml(v: SummaryView): string {
  const C = SUMMARY_COPY.columns;
  const css = `${fontFaces()}
@page{size:A4 portrait;margin:16mm}
*{box-sizing:border-box}
body{margin:0;font-family:Jakarta,sans-serif;font-size:10pt;line-height:1.4;color:#15131f;-webkit-print-color-adjust:exact;print-color-adjust:exact}
h1{font-size:18pt;margin:0 0 2mm;font-weight:800;letter-spacing:-0.02em}
h2{font-size:12pt;margin:6mm 0 2mm;font-weight:700}
h3{font-size:10.5pt;margin:4mm 0 1.5mm;font-weight:700}
.muted{color:#5e5a72}
.mono,.n{font-family:GeistMono,monospace}
.head{display:flex;justify-content:space-between;align-items:baseline;border-bottom:1px solid #e6e3f0;padding-bottom:2mm;margin-bottom:4mm}
.tiles{display:grid;grid-template-columns:repeat(3,1fr);gap:3mm}
.tile{border:1px solid #e6e3f0;border-radius:3mm;padding:3mm}
.tile b{display:block;font-size:16pt;font-family:GeistMono,monospace}
.area{margin:2mm 0}
.legend span{display:inline-block;margin-right:4mm}
.legend i{display:inline-block;width:3mm;height:3mm;border-radius:1mm;margin-right:1mm;vertical-align:middle}
table{width:100%;border-collapse:collapse;font-size:8.5pt;margin-bottom:3mm}
th{text-align:left;font-weight:600;color:#5e5a72;border-bottom:1px solid #cfcbe0;padding:1.2mm 1.5mm}
td{border-bottom:1px solid #e6e3f0;padding:1.2mm 1.5mm;vertical-align:top}
th.n,td.n{text-align:right}
tr{break-inside:avoid}
.break{break-before:page}
.action{border:1px solid #e6e3f0;border-radius:2mm;padding:2.5mm;margin-bottom:2mm;break-inside:avoid}`;
  const rated = v.areas.some((a) => a.counts.pick > 0);
  const legend = `<p class="legend muted">${(["agree", "change", "disagree", "unclear", "pick", "notAnswered"] as const).filter((k) => k !== "pick" || rated).map((k) => `<span><i style="background:${COLOURS[k]}${k === "notAnswered" ? `;border:1px dashed ${NOT_ANSWERED_STROKE}` : ""}"></i>${esc(C[k])}</span>`).join("")}</p>`;
  const page1 = `<div class="head"><div><h1>${esc(v.project)}</h1><div class="muted">${esc(v.workspace)} · ${esc(v.title)}</div></div><div class="muted">${esc(SUMMARY_COPY.generated(v.generatedAt))}</div></div>
${v.lines.map((l) => `<p class="muted">${esc(l)}</p>`).join("")}
<div class="tiles">${v.tiles.map((t) => `<div class="tile"><b>${esc(t.value)}</b>${esc(t.label)}</div>`).join("")}</div>
<h2>${esc(SUMMARY_COPY.agreementByArea)}</h2>${legend}
${v.areas.map((a) => `<div class="area"><div><b>${esc(a.name)}</b> <span class="muted mono">${esc(a.percent)}</span></div>${stackedBar(a.counts)}<div class="muted">${esc(SUMMARY_COPY.countsInWords(a.counts))}</div></div>`).join("")}
<h2>${esc(SUMMARY_COPY.confidence)}</h2>${histogram(v.confidence)}<p class="muted">${esc(averageLine(v.confidence))}</p>`;
  const items = `<h2 class="break">${esc(SUMMARY_COPY.items)}</h2>${v.tables.map((t) => `<h3>${esc(t.area)}</h3>${table([C.ref, C.item, C.proposed, C.agree, C.change, C.disagree, C.unclear, C.pick, C.notAnswered, C.agreement], t.rows.map((r) => [r.ref, r.text, r.proposed, String(r.counts.agree), String(r.counts.change), String(r.counts.disagree), String(r.counts.unclear), String(r.counts.pick), String(r.counts.notAnswered), r.percent]), [3, 4, 5, 6, 7, 8, 9])}`).join("")}`;
  const regs = v.registers.map((r) => `<h2>${esc(r.title)} (${r.total})</h2>${r.rows.length === 0 ? `<p class="muted">${esc(r.empty)}</p>` : table(r.columns, r.rows)}${r.more ? `<p class="muted" data-more>${esc(r.more)}</p>` : ""}`).join("");
  const last = `<h2 class="break">${esc(SUMMARY_COPY.signOff)}</h2>${v.signOffs.length === 0 ? `<p class="muted">${esc(SUMMARY_COPY.noSignOffs)}</p>` : table(SUMMARY_COPY.signOffColumns, v.signOffs.map((s) => [s.who, s.when, s.confidence]), [2])}
<h2>${esc(SUMMARY_COPY.actions)}</h2>${v.actions.length === 0 ? `<p class="muted">${esc(SUMMARY_COPY.noActions)}</p>` : v.actions.map((a) => `<div class="action"><div class="muted">${esc([a.kind, a.state].filter(Boolean).join(" · "))}</div><b>${esc(a.title)}</b><div>${esc(a.why)}</div><div class="muted">${esc(a.cites)}</div></div>`).join("")}`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(SUMMARY_COPY.heading)}</title><style>${css}</style></head><body>${page1}${items}${regs}${last}</body></html>`;
}

// The header and footer templates (Page.pdf headerTemplate and footerTemplate: "Page styles are
// not visible inside templates", so each carries its styles inline, with a system font).
const T = "font-family:Helvetica,Arial,sans-serif;font-size:8px;color:#5e5a72;width:100%;margin:0 16mm;-webkit-print-color-adjust:exact;print-color-adjust:exact";
export function summaryHeader(v: Pick<SummaryView, "workspace" | "project" | "sample">): string {
  const band = v.sample ? `<div style="background:#fff3d6;color:#8a5a00;font-weight:700;text-align:center;padding:2px 0;margin-bottom:2px">${esc(SUMMARY_COPY.watermark)}</div>` : "";
  return `<div style="${T}">${band}<div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(v.workspace)} · ${esc(v.project)}</div></div>`;
}
export const summaryFooter = (): string => `<div style="${T};text-align:right">${SUMMARY_COPY.page} <span class="pageNumber"></span> ${SUMMARY_COPY.of} <span class="totalPages"></span></div>`;
