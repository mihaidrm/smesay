// The Marlow Group sample (decisions 0005, 0027): the same facts as the prototype boards
// (docs/design-notes/prototype-01/PmApp.dc.html data(), Respondent.dc.html items(), the sign-off
// record on LandingE.dc.html). Nothing here comes from a client engagement (decision 0002).

// One fixed id, the workspace's (the helpers ignore ids on create, E1-3). Every other sample
// row is found by a natural key: the item reference, the invite token, the respondent's name.
export const SAMPLE_WORKSPACE_ID = "00000001-0000-4000-8000-000000000001";

export const workspace = { id: SAMPLE_WORKSPACE_ID, name: "Marlow Group", slug: "marlow-group", accentHex: "#1F4F7A" };

export const project = {
  name: "New expense tool",
  contextGoal: "We are replacing the expense tool for all 400 staff. The list is what the new tool should do; Sales, Finance, HR and the engineering managers answer.",
  contextTerms: "Marlow Group, cost centre, policy limit",
  isSample: true,
};

export const areas = [
  { name: "Submitting", rationale: "This comes first, because every claim starts here." },
  { name: "Approving", rationale: "This covers what happens to a claim once it is in." },
  { name: "Paying", rationale: "This comes last and covers paying the money back." },
];

// position, reference, area, proposed value (M, S, C, W), reader text, original text, details.
export const items = [
  { n: 1, ref: "CL-01", area: "Submitting", proposed: "M", reader: "Photograph a receipt and the amount, date and merchant are filled in automatically.", original: "OCR receipt capture via mobile (auto-fill amt/date/vendor).", details: "Covers paper receipts and PDFs. Out of scope: receipts in a language the OCR does not read." },
  { n: 2, ref: "CL-02", area: "Submitting", proposed: "S", reader: "Split one receipt across two projects or cost centres.", original: "Multi-allocation of single expense line to 2+ cost centres/projects.", details: "The split can be by amount or by percentage. Each part follows its own approval chain." },
  { n: 3, ref: "CL-03", area: "Approving", proposed: "M", reader: "Managers approve or reject from the email, without logging in.", original: "Approval actionable from notification email (no login).", details: "The email shows the amount, the category and the receipt thumbnail. Links expire after seven days." },
  { n: 4, ref: "CL-04", area: "Approving", proposed: "S", reader: "Expenses over the policy limit are flagged before they reach the approver.", original: "Policy engine: auto-flag out-of-policy claims pre-approval.", details: "Limits are set per category and per role. A flagged claim still reaches the approver, with the flag." },
  { n: 5, ref: "CL-05", area: "Paying", proposed: "M", reader: "Approved expenses are paid with the next salary run.", original: "Reimbursement via payroll integration, next cycle.", details: "Cut-off is the 20th of the month. Claims approved after the cut-off go into the following run." },
  { n: 6, ref: "CL-06", area: "Paying", proposed: "C", reader: "Employees can request a cash advance before a trip.", original: "Travel advance request workflow (pre-trip).", details: "Advance is reconciled against the trip claims. The spreadsheet does not say who repays an advance if the trip is cancelled." },
];

// As the PM app board's Import step shows: 6 rows read, header on row 1, nothing skipped.
export const importReport = { emptyRows: 0, exactDuplicates: 0, overLimit: 0, rowsRead: 6, headerRow: 1, unrecognisedValues: 0, duplicateRefs: [] };
export const sourceFilename = "expense-requirements.xlsx";

export const instrument = {
  title: "New expense tool",
  intro: "We are replacing the expense tool for all 400 staff. The new tool should do six things, in three chapters. Tell us where you agree and where you do not. It takes about five minutes.",
  method: "moscow" as const,
  showProposed: true,
  layout: "chapters" as const,
  respondentFields: [
    { key: "name", label: "Name", type: "text" as const, mandatory: true },
    { key: "role", label: "Role", type: "dropdown" as const, mandatory: true, options: ["Sales", "Finance", "Engineering manager", "HR", "Office manager"] },
  ],
  closing: { confidence: true as const, missingForm: true, signOffText: "I confirm these answers reflect my view as of today." },
  // The boards say 6 Oct 09:00 and 20 Oct 18:00, Marlow Group's local time; Romania is UTC+3
  // until 25 October 2026, so these are the instants.
  opensAt: new Date("2026-10-06T06:00:00Z"),
  closesAt: new Date("2026-10-20T15:00:00Z"),
};

// Seven respondents: six personal invites and one person who came through the public link.
// status: submitted (the sign-off record on the landing page: time and confidence), progress
// (answers so far), invited (never opened). Priya's time and confidence are not on a board; 3
// gives the record's 3.8 average.
export const people = [
  { n: 1, name: "Ioana Marin", role: "Sales", invite: "personal", status: "submitted", submittedAt: "2026-10-07T14:05:00Z", confidence: 4, reminders: 0 },
  { n: 2, name: "Tom Reyes", role: "Sales", invite: "personal", status: "submitted", submittedAt: "2026-10-08T08:41:00Z", confidence: 3, reminders: 1 },
  { n: 3, name: "Dana Okafor", role: "Finance", invite: "public", status: "submitted", submittedAt: "2026-10-08T09:12:00Z", confidence: 5, reminders: 0 },
  { n: 4, name: "Lukas Berg", role: "Engineering manager", invite: "personal", status: "submitted", submittedAt: "2026-10-09T16:30:00Z", confidence: 4, reminders: 0 },
  { n: 5, name: "Priya Nair", role: "HR", invite: "personal", status: "submitted", submittedAt: "2026-10-12T08:55:00Z", confidence: 3, reminders: 1 },
  { n: 6, name: "Sam Hill", role: "Office manager", invite: "personal", status: "progress", submittedAt: null, confidence: null, reminders: 1 },
  { n: 7, name: "Elena Costa", role: "Sales", invite: "personal", status: "invited", submittedAt: null, confidence: null, reminders: 1 },
] as const;

// Answers per item and person (decisions 0014 and 0018): agree; change with the value picked and
// the reason; disagree (Not needed) with the reason; unclear with the question in `reason`.
type A = { kind: "agree" } | { kind: "change"; value: string; reason: string } | { kind: "disagree"; reason: string } | { kind: "unclear"; reason: string };
const agree: A = { kind: "agree" };
// Sam Hill (person 6) is in progress with four answers; no board lists them, so they are agree.
export const answers: Record<number, Record<number, A>> = {
  1: { 1: agree, 2: agree, 3: { kind: "change", value: "S", reason: "Half our receipts are PDFs from suppliers, not paper. Upload matters more than the camera." }, 4: agree, 5: agree, 6: agree },
  2: { 1: agree, 2: { kind: "unclear", reason: "Does this include splitting between two clients on one trip?" }, 3: { kind: "change", value: "M", reason: "Finance re-keys about thirty split claims a month by hand." }, 4: { kind: "change", value: "M", reason: "My team bills two projects on almost every trip." }, 5: agree, 6: agree },
  3: { 1: agree, 2: { kind: "change", value: "S", reason: "Approving from email means approving without seeing the receipt." }, 3: agree, 4: agree, 5: agree, 6: agree },
  4: { 1: { kind: "change", value: "M", reason: "I find out I was over the limit three weeks later, after I have paid." }, 2: { kind: "change", value: "M", reason: "Sales gets most of the rejections, and always after the fact." }, 3: agree, 4: agree, 5: { kind: "disagree", reason: "Flagging after submission is too late. The limit should block the claim at entry." }, 6: agree },
  5: { 1: agree, 2: agree, 3: agree, 4: agree, 5: agree },
  6: { 1: agree, 2: agree, 3: { kind: "change", value: "S", reason: "New starters ask for an advance every month. It is a real need." }, 4: { kind: "unclear", reason: "Would the advance be deducted from salary if the trip is cancelled?" }, 5: { kind: "disagree", reason: "Advances are taxable income if not reconciled in time. Payroll would have to police it." } },
};

export const missingItem = { person: 3, text: "Mileage is calculated from a start and end address instead of typed in." };

// Four actions with their kind (stories/E9-1); cites are (item, person) answer pairs, and the
// fourth cites the missing item (cited_missing_item_ids, decision 0033).
export const insights = [
  { n: 1, kind: "conflict" as const, title: "Decide whether policy flags move to Must have.", why: "Both salespeople pushed it up from Should have. Nobody outside Sales did.", cites: [[4, 1], [4, 2]] as [number, number][], missing: false },
  { n: 2, kind: "followUp" as const, title: "Answer two open questions before the link closes.", why: "Two respondents could not rate an item without more detail.", cites: [[2, 2], [6, 4]] as [number, number][], missing: false },
  { n: 3, kind: "rewrite" as const, title: "Rewrite CL-06 to say who repays an advance if the trip is cancelled.", why: "HR rated it Not needed because an unreconciled advance becomes taxable income, and the engineering manager asked who carries the risk if the trip is cancelled.", cites: [[6, 5], [6, 4]] as [number, number][], missing: false },
  { n: 4, kind: "coverage" as const, title: "Consider adding mileage from addresses to Submitting.", why: "One respondent suggested it as a missing item.", cites: [] as [number, number][], missing: true },
];

// Two model calls, invented numbers in the shape E4 logs (euro cents).
export const aiRuns = [
  { purpose: "shape" as const, model: "sample", tokensIn: 4120, tokensOut: 1630, costEurCents: 4, durationMs: 9800 },
  { purpose: "insights" as const, model: "sample", tokensIn: 6890, tokensOut: 910, costEurCents: 5, durationMs: 7400 },
];

// What the dashboard must show for this sample (E8 tests read these). The answer counts are
// over submitted responses only; the in-progress response adds 4 more rows.
export const expected = { items: 6, invites: 7, responses: 6, submitted: 5, answers: 34, submittedAnswers: 30, agree: 19, change: 7, disagree: 2, unclear: 2, missing: 1, insights: 4, aiRuns: 2, confidenceAverage: 3.8 };
