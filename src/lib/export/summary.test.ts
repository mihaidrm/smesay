// The PDF summary's content and HTML (stories/E10-3): on the seeded sample, page 1 carries the
// strip's numbers and the agreement by area, the sign-off record lists the 5 submitted
// responses with their confidence, the actions come open first, then done and dismissed with
// their state; the HTML has the sections in the story's order, every bar's counts in words, the
// watermark band in the header template on the sample only, the footer's page numbers, and
// escapes what respondents typed. The PDF itself
// renders in e2e/export-summary.spec.ts (Chromium is installed after the unit tests in CI).
import { randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { instruments, projects } from "@/db/queries";
import type { Instrument } from "@/db/queries/instruments";
import { createWorkspaceWithSample } from "@/db/queries/onboarding";
import { expected } from "@/db/seed/sample";
import { results } from "@/db/queries/results";
import { prepareTestDatabase } from "@/db/test-db";
import type { WorkspaceId } from "@/db/types";
import { auth } from "@/lib/auth";
import { memoryOutbox } from "@/lib/mail";
import type { FilterContext, ResultsFilter } from "@/lib/results-filter";
import { DEFAULT_TILES, tileView } from "@/lib/results-tiles";
import { requireWorkspace } from "@/lib/workspace";
import { pageCount } from "./pdf";
import { register, REGISTER_ROWS_MAX, summaryView } from "./summary";
import { SUMMARY_COPY, summaryFooter, summaryHeader, summaryHtml, type SummaryView } from "./summary-html";

const BASE = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
const NONE: ResultsFilter = { fields: {}, kinds: [], withComment: false, perspective: null, status: [], includeUnsubmitted: false, sort: null, split: null, gaps: null };
let ws: WorkspaceId;
let wsB: WorkspaceId;
let project: { id: string; name: string; isSample: boolean };
let instrument: Instrument;
let ctx: FilterContext;
const NOW = new Date("2026-10-21T08:00:00Z");

async function signIn(label: string) {
  const email = `${label}-${Date.now()}-${randomUUID().slice(0, 6)}@example.com`;
  const before = memoryOutbox.length;
  await auth.handler(new Request(`${BASE}/api/auth/sign-in/magic-link`, { method: "POST", headers: { "content-type": "application/json", origin: BASE }, body: JSON.stringify({ email, callbackURL: "/app" }) }));
  const link = memoryOutbox[before].text.split("\n").find((l) => l.startsWith(BASE + "/api/auth/magic-link/verify"))!;
  const verified = await auth.handler(new Request(link, { redirect: "manual" }));
  const headers = new Headers({ cookie: verified.headers.getSetCookie().find((c) => c.includes("session_token="))!.split(";")[0] });
  return { id: (await auth.api.getSession({ headers }))!.user.id, headers };
}

beforeAll(async () => {
  await prepareTestDatabase();
  const user = await signIn("summary");
  ws = await requireWorkspace(user.headers, (await createWorkspaceWithSample({ name: "Summary A", slug: `summary-a-${randomUUID()}` }, user.id)).id);
  wsB = await requireWorkspace(user.headers, (await createWorkspaceWithSample({ name: "Summary B", slug: `summary-b-${randomUUID()}` }, user.id)).id);
  [project] = (await projects.list(ws)).filter((p) => p.isSample);
  instrument = (await instruments.latestForProject(ws, project.id))!;
  ctx = { fields: instrument.respondentFields, perspectives: instrument.perspectives };
}, 60_000);

const input = (f: ResultsFilter) => ({ ws, workspace: "Summary A", project, instrument, filter: f, ctx, tiles: DEFAULT_TILES, now: NOW });

describe("summaryView", () => {
  it("carries the strip's numbers and the agreement by area", async () => {
    const v = (await summaryView(input(NONE)))!;
    const n = (await results.numbers(ws, instrument.id, NONE))!;
    expect(v.tiles).toEqual(DEFAULT_TILES.map((id) => tileView(id, n)).map((t) => ({ label: t.label, value: t.value })));
    const sum = (k: "agree" | "change" | "disagree" | "unclear") => v.areas.reduce((s, a) => s + a.counts[k], 0);
    expect([sum("agree"), sum("change"), sum("disagree"), sum("unclear")]).toEqual([expected.agree, expected.change, expected.disagree, expected.unclear]);
    expect(v.tables.flatMap((t) => t.rows)).toHaveLength(expected.items);
    // The two shares beside each item's agreement (decision 0062), each from the row's own
    // counts over its answered four kinds; each area's line carries the three shares.
    for (const r of v.tables.flatMap((t) => t.rows)) {
      const answered = r.counts.agree + r.counts.change + r.counts.disagree + r.counts.unclear;
      expect([r.changePercent, r.disagreePercent]).toEqual(answered === 0 ? ["", ""] : [`${Math.round((100 * r.counts.change) / answered)}%`, `${Math.round((100 * r.counts.disagree) / answered)}%`]);
    }
    expect(v.areas.map((a) => a.percent).every((p) => /^\d+% agree · \d+% different priority · \d+% not needed$/.test(p))).toBe(true);
    expect(v.sample).toBe(true);
    expect(v.generatedAt).toBe("21 Oct 2026, 08:00 UTC");
  });
  it("lists the sign-offs with their confidence, and the actions open first", async () => {
    const v = (await summaryView(input(NONE)))!;
    expect(v.signOffs).toHaveLength(expected.submitted);
    expect(v.confidence.reduce((a, b) => a + b, 0)).toBe(v.signOffs.filter((s) => s.confidence !== SUMMARY_COPY.noConfidence).length);
    expect(v.actions).toHaveLength(expected.insights);
    const states = v.actions.map((a) => (a.state === "Open" ? 0 : a.state.startsWith("Done") ? 1 : 2));
    expect(states).toEqual([...states].sort());
    expect(v.actions.every((a) => a.cites.startsWith("From: "))).toBe(true);
  });
  it("follows the filter and names it", async () => {
    const f = { ...NONE, kinds: ["disagree" as const] };
    const v = (await summaryView(input(f)))!;
    expect(v.lines).toEqual(["Filtered: Disagree"]);
    expect(v.registers.find((r) => r.title === "Disagree")!.rows).toHaveLength(expected.disagree);
    expect(v.registers.find((r) => r.title === "Disagree")!.total).toBe(expected.disagree);
  });
  it("is nothing for another workspace's instrument", async () => {
    expect(await summaryView({ ...input(NONE), ws: wsB })).toBeNull();
  });
});

const VIEW: SummaryView = {
  workspace: "Marlow Group", project: "Expense tool", title: "Expense tool v1", generatedAt: "21 Oct 2026, 08:00 UTC", sample: false, lines: [],
  tiles: [{ label: "Submitted of invited", value: "5 of 7" }],
  areas: [{ name: "Submitting", counts: { agree: 3, change: 1, disagree: 0, unclear: 1, pick: 0, notAnswered: 0 }, percent: "60%" }],
  confidence: [0, 1, 0, 2, 2],
  tables: [{ area: "Submitting", rows: [{ ref: "CL-04", text: "Photograph a receipt", proposed: "Should", counts: { agree: 3, change: 1, disagree: 0, unclear: 1, pick: 0, notAnswered: 0 }, percent: "60%", changePercent: "20%", disagreePercent: "0%" }] }],
  registers: [{ title: "Unclear", columns: ["", "Item", "Respondent", "Question"], rows: [["CL-04", "Photograph a receipt", "Ioana Marin", "What about <b>PDF</b> & scans?"]], total: 1, more: null, empty: "None under this filter." }],
  signOffs: [{ who: "Ioana Marin", when: "9 Oct 2026, 16:30 UTC", confidence: "4" }],
  actions: [{ state: "Open", kind: "Rewrite", title: "Say what a receipt is", why: "Two people asked.", cites: "From: Ioana Marin on CL-04" }],
};

describe("summaryHtml", () => {
  it("stops each register at 20 rows and names the CSV with the rest (decision 0048)", () => {
    const rows = Array.from({ length: 47 }, (_, i) => [`R-${i}`, "Item", "Ioana Marin", "Too slow"]);
    const r = register("Disagree", ["", "Item", "Respondent", "Reason"], rows, "Answers");
    expect([r.rows.length, r.total, REGISTER_ROWS_MAX]).toEqual([20, 47, 20]);
    expect(r.more).toBe("The Answers CSV on the Export tab has 27 more.");
    expect(register("Disagree", [], rows.slice(0, 20), "Answers").more).toBeNull();
    const html = summaryHtml({ ...VIEW, registers: [r] });
    expect(html).toContain("<h2>Disagree (47)</h2>");
    expect(html).toContain("The Answers CSV on the Export tab has 27 more.");
    expect(html.match(/<td>R-\d+<\/td>/g)).toHaveLength(20);
  });
  it("puts the sections in the story's order, the last on its own page", () => {
    const html = summaryHtml(VIEW);
    const at = (s: string) => html.indexOf(s);
    const order = [SUMMARY_COPY.agreementByArea, SUMMARY_COPY.confidence, SUMMARY_COPY.items, "Unclear (1)", SUMMARY_COPY.signOff, SUMMARY_COPY.actions].map(at);
    expect(order.every((i) => i > 0)).toBe(true);
    expect(order).toEqual([...order].sort((a, b) => a - b));
    expect(html).toContain(`<h2 class="break">${SUMMARY_COPY.signOff}</h2>`);
    expect(html).toContain(`<h2 class="break">${SUMMARY_COPY.items}</h2>`);
    expect(html).toContain("@page{size:A4 portrait;margin:16mm}");
  });
  it("puts the two shares beside the agreement in the items table (decision 0062)", () => {
    const html = summaryHtml(VIEW);
    expect(html).toContain('<th class="n">Agreement</th><th class="n">Different priority %</th><th class="n">Not needed %</th>');
    expect(html).toContain('<td class="n">60%</td><td class="n">20%</td><td class="n">0%</td>');
  });
  it("labels every bar with its counts in words, never colour alone", () => {
    const html = summaryHtml(VIEW);
    expect(html).toContain('aria-label="3 agree · 1 different priority · 1 unclear"');
    expect(html).toContain('<div class="muted">3 agree · 1 different priority · 1 unclear</div>');
    expect(html).toContain('aria-label="1: 0, 2: 1, 3: 0, 4: 2, 5: 2"');
  });
  it("embeds the fonts and escapes what respondents typed", () => {
    const html = summaryHtml(VIEW);
    expect(html.match(/@font-face/g)).toHaveLength(4);
    expect(html).toContain("What about &lt;b&gt;PDF&lt;/b&gt; &amp; scans?");
    expect(html).not.toContain("<b>PDF</b>");
  });
  it("carries the watermark band in every page's header on the sample only, and numbers the pages", () => {
    expect(summaryHeader({ ...VIEW, sample: true })).toContain(`>${SUMMARY_COPY.watermark}</div>`);
    expect(summaryHeader(VIEW)).not.toContain(SUMMARY_COPY.watermark);
    expect(summaryHeader({ ...VIEW, project: "A <b> & co" })).toContain("Marlow Group · A &lt;b&gt; &amp; co");
    expect(summaryHtml({ ...VIEW, sample: true })).not.toContain(SUMMARY_COPY.watermark);
    expect(summaryFooter()).toContain('<span class="pageNumber"></span> of <span class="totalPages"></span>');
  });
});

describe("pageCount", () => {
  it("counts the page objects, not the page tree", () => {
    const pdf = Buffer.from("%PDF-1.4\n1 0 obj << /Type /Pages /Kids [2 0 R 3 0 R] /Count 2 >>\n2 0 obj << /Type /Page >>\n3 0 obj <</Type/Page/Parent 1 0 R>>\n", "latin1");
    expect(pageCount(pdf)).toBe(2);
  });
});
