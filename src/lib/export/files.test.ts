// The Export tab's files against Results (stories/E10-1, acceptance 3 and 4), on the seeded
// sample: every headline number of the strip but the Actions count (in no file), every item's
// row with the Agreement tab's figures, and every register's count is a sum of a file's rows, under no filter, with the switch off, and under a filter; the
// sample's files start with the watermark line and a filtered file names its filter; another
// workspace's instrument gives empty files.
import { randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { instruments, items as itemsQ, projects } from "@/db/queries";
import type { Instrument } from "@/db/queries/instruments";
import { createWorkspaceWithSample } from "@/db/queries/onboarding";
import { agreement, registers, results } from "@/db/queries/results";
import { prepareTestDatabase } from "@/db/test-db";
import type { WorkspaceId } from "@/db/types";
import { auth } from "@/lib/auth";
import { memoryOutbox } from "@/lib/mail";
import { requireWorkspace } from "@/lib/workspace";
import type { FilterContext, ResultsFilter } from "@/lib/results-filter";
import { changePercentOf, disagreePercentOf, EMPTY_COUNTS, notAnsweredOf, percentOf } from "@/lib/results-agreement";
import { csv, safeText } from "./csv";
import { EXPORT_COPY } from "./copy";
import { exportTable } from "./files";
import { perItem } from "./per-item";

const BASE = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
let wsA: WorkspaceId;
let wsB: WorkspaceId;
let instrument: Instrument;
let ctx: FilterContext;
const itemsOf = (ws: WorkspaceId, setId: string) => itemsQ.forSet(ws, setId);

const NONE: ResultsFilter = { fields: {}, kinds: [], withComment: false, perspective: null, status: [], includeUnsubmitted: false, sort: null, split: null, gaps: null };

// A minimal reader of the files the writer makes: quoted fields, doubled quotes, CRLF lines.
function parse(text: string): string[][] {
  const out: string[][] = [];
  let row: string[] = []; let cell = ""; let quoted = false;
  const body = text.replace(/^﻿/, "");
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (quoted) {
      if (ch === '"' && body[i + 1] === '"') { cell += '"'; i++; } else if (ch === '"') quoted = false; else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === "\r" && body[i + 1] === "\n") { row.push(cell); out.push(row); row = []; cell = ""; i++; }
    else cell += ch;
  }
  return out;
}

// The file as text and back: the preamble, the header and the rows by column name.
async function file(ws: WorkspaceId, which: "answers" | "items" | "people" | "missing", f: ResultsFilter, sample = true) {
  const t = await exportTable(ws, instrument, which, f, ctx, sample);
  const lines = parse(csv(t.preamble, t.header, t.rows));
  const header = lines[t.preamble.length];
  const rows = lines.slice(t.preamble.length + 1).map((cells) => Object.fromEntries(header.map((h, i) => [h, cells[i]])));
  return { preamble: lines.slice(0, t.preamble.length).map((l) => l[0]), rows };
}

async function reconcile(f: ResultsFilter) {
  const n = (await results.numbers(wsA, instrument.id, f))!;
  const answers = (await file(wsA, "answers", f)).rows;
  const kind = (k: string) => answers.filter((r) => r.Answer === k).length;
  expect([kind("Agree"), kind("Different priority"), kind("Disagree"), kind("Unclear"), kind("Rated")]).toEqual([n.agree, n.change, n.disagree, n.unclear, n.pick]);
  expect(answers.filter((r) => r["Reason or question"] !== "" || r.Comment !== "").length).toBe(n.withComment);
  const items = (await file(wsA, "items", f)).rows;
  const sum = (col: string) => items.reduce((s, r) => s + Number(r[col]), 0);
  expect([sum("Agree"), sum("Different priority"), sum("Disagree"), sum("Unclear"), sum("Rated")]).toEqual([n.agree, n.change, n.disagree, n.unclear, n.pick]);
  // Each item's row, found by its reference, carries the Agreement tab's figures for that item:
  // the counts, not answered, the agreement and the two shares beside it (decision 0062), each
  // share the row's own count over its answered four kinds.
  const setItems = await itemsOf(wsA, instrument.itemSetId);
  const counts = new Map((await agreement.byItem(wsA, instrument.id, f)).map((c) => [c.itemId, c]));
  expect(items.length).toBe(setItems.length);
  const num = (r: Record<string, string>, k: string) => Number(r[k]);
  for (const it of setItems) {
    const row = items.filter((r) => r.Reference === (it.sourceRef ?? ""));
    expect(row, `one row for ${it.sourceRef}`).toHaveLength(1);
    const c = counts.get(it.id) ?? { ...EMPTY_COUNTS, itemId: it.id, group: null, percent: null, changePercent: null, disagreePercent: null };
    const p = percentOf(c);
    expect([row[0].Agree, row[0]["Different priority"], row[0].Disagree, row[0].Unclear, row[0].Rated, row[0]["Not answered"], row[0]["Agreement %"], row[0]["Different priority %"], row[0]["Not needed %"]])
      .toEqual([c.agree, c.change, c.disagree, c.unclear, c.pick, notAnsweredOf(c), p ?? "", changePercentOf(c) ?? "", disagreePercentOf(c) ?? ""].map(String));
    // Each share recomputed from the row's own cells, rounded half up.
    const answered = num(row[0], "Agree") + num(row[0], "Different priority") + num(row[0], "Disagree") + num(row[0], "Unclear");
    const share = (k: string) => (answered === 0 ? "" : String(Math.round((100 * num(row[0], k)) / answered)));
    expect([row[0]["Agreement %"], row[0]["Different priority %"], row[0]["Not needed %"]]).toEqual([share("Agree"), share("Different priority"), share("Disagree")]);
  }
  // The Answers file added up per item gives each Items row's five counts.
  for (const [k, [fromAnswers, fromItems]] of perItem(await exportTable(wsA, instrument, "answers", f, ctx, true), await exportTable(wsA, instrument, "items", f, ctx, true))) expect(fromAnswers, k).toEqual(fromItems);
  expect(items.filter((r) => ["Agree", "Different priority", "Disagree", "Unclear", "Rated"].every((k) => r[k] === "0")).length).toBe(n.unansweredItems);
  expect(items.filter((r) => num(r, "Agree") > 0 && ["Different priority", "Disagree", "Unclear", "Rated"].every((k) => r[k] === "0")).length).toBe(n.fullyAgreed);
  // The two item tiles are two counts of the file's rows, never one (decision 0062).
  expect(items.filter((r) => num(r, "Different priority") > 0).length).toBe(n.differentPriorityItems);
  expect(items.filter((r) => num(r, "Disagree") > 0).length).toBe(n.notNeededItems);
  const people = (await file(wsA, "people", f)).rows;
  expect([people.length, people.filter((r) => r.Status === "Submitted").length, people.filter((r) => r.Status === "In progress").length]).toEqual([n.invited, n.submitted, n.inProgress]);
  // The tile is ROUND(MEDIAN(Minutes to submit), 0) over the People file.
  const minutes = people.filter((r) => r["Minutes to submit"] !== "").map((r) => Number(r["Minutes to submit"])).sort((a, b) => a - b);
  const mid = minutes.length / 2;
  const median = minutes.length === 0 ? null : Math.round(minutes.length % 2 ? minutes[Math.floor(mid)] : (minutes[mid - 1] + minutes[mid]) / 2);
  expect(median).toBe(n.medianMinutes);
  const missing = (await file(wsA, "missing", f)).rows;
  expect(missing.length).toBe(n.missing);
  const registered = await registers.missing(wsA, instrument.id, f, instrument.respondentFields.map((s) => s.key), instrument.method);
  expect(missing.map((r) => r["Suggested item"]).sort()).toEqual(registered.map((m) => safeText(m.text)).sort());
  return { answers, people };
}

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
  const user = await signIn("export");
  wsA = await requireWorkspace(user.headers, (await createWorkspaceWithSample({ name: "Export A", slug: `export-a-${randomUUID()}` }, user.id)).id);
  wsB = await requireWorkspace(user.headers, (await createWorkspaceWithSample({ name: "Export B", slug: `export-b-${randomUUID()}` }, user.id)).id);
  const [sample] = (await projects.list(wsA)).filter((p) => p.isSample);
  instrument = (await instruments.latestForProject(wsA, sample.id))!;
  ctx = { fields: instrument.respondentFields, perspectives: instrument.perspectives };
}, 60_000);

describe("the files reconcile with Results", () => {
  it("with no filter, submitted answers only", async () => {
    const { answers } = await reconcile(NONE);
    expect(answers.length).toBe((await results.rows(wsA, instrument.id, NONE)).length);
  });
  it("with the answers not submitted yet", async () => {
    await reconcile({ ...NONE, includeUnsubmitted: true });
  });
  it("under a filter, which the file names", async () => {
    const f = { ...NONE, kinds: ["change" as const, "disagree" as const] };
    await reconcile(f);
    expect((await file(wsA, "answers", f)).preamble).toEqual([EXPORT_COPY.watermark, `${EXPORT_COPY.filtered("Different priority, Disagree")}`]);
  });
  it("under a respondent field filter and a name filter", async () => {
    const { people } = await reconcile({ ...NONE, fields: { role: ["Finance"] } });
    expect(people.length).toBeGreaterThan(0);
    expect(people.every((r) => r.Role === "Finance")).toBe(true);
    const named = await reconcile({ ...NONE, includeUnsubmitted: true, fields: { name: "Ioana" } });
    expect(named.people.map((r) => r.Respondent)).toEqual(["Ioana Marin"]);
  });
});

describe("the files", () => {
  it("name a respondent as the Responses tab does and give a value with its label", async () => {
    const { rows } = await file(wsA, "answers", NONE);
    const ioana = rows.find((r) => r.Respondent === "Ioana Marin" && r.Reference === "CL-04")!;
    expect([ioana.Answer, ioana["Proposed value"], ioana["Proposed label"], ioana["Their value"], ioana["Their label"]]).toEqual(["Different priority", "S", "Should", "M", "Must"]);
    expect(ioana["Submitted at"]).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+00:00$/);
  });
  it("start with the watermark on the sample only", async () => {
    expect((await file(wsA, "items", NONE)).preamble[0]).toBe(EXPORT_COPY.watermark);
    expect((await file(wsA, "items", NONE, false)).preamble).toEqual([]);
    expect((await file(wsA, "items", { ...NONE, includeUnsubmitted: true }, false)).preamble).toEqual([EXPORT_COPY.withUnsubmitted]);
  });
  it("are empty for another workspace's instrument", async () => {
    for (const which of ["answers", "people", "missing"] as const) expect((await file(wsB, which, NONE)).rows).toEqual([]);
    expect((await file(wsB, "items", NONE)).rows).toEqual([]);
  });
});
