// The email templates (stories/E12-3, acceptances 1 and 4): each renders from app data with no
// placeholder left, on the shared frame, with a plain-text part that carries the link.
import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import { deletionEmail } from "./deletion";
import { inviteEmail } from "./invite";
import { COMPANY, renderEmail, type Email } from "./layout";
import { receiptEmail } from "./receipt";
import { reminderEmail } from "./reminder";
import { SAMPLE_NAMES, SAMPLE_ORIGIN, sampleEmails } from "./samples";

const ORIGIN = "https://smesay.example";
const emails = sampleEmails(ORIGIN);
const saved = process.env.COMPANY_ADDRESS;
afterEach(() => { if (saved === undefined) delete process.env.COMPANY_ADDRESS; else process.env.COMPANY_ADDRESS = saved; });

describe.each(SAMPLE_NAMES)("the %s email", (name) => {
  const email = emails[name];
  it("leaves no placeholder in the subject, the text or the HTML", () => {
    for (const part of [email.subject, email.text, email.html]) expect(part).not.toMatch(/\[|\bundefined\b|\bnull\b|NaN/);
  });
  it("is one 600 px column with the 22 px mark from the app and the footer", () => {
    expect(email.html).toContain('width="600"');
    expect(email.html).toContain(`<img src="${ORIGIN}/assets/brand/mark-44.png" width="22" height="22"`);
    expect(email.html).toContain(COMPANY);
    expect(email.text).toContain(COMPANY);
    expect(email.html).toContain("-apple-system,'Segoe UI'");
  });
});

describe.each(SAMPLE_NAMES.filter((n) => n !== "deletion"))("the %s email's button", (name) => {
  it("has one violet button, the link as plain text under it, and the privacy link", () => {
    const { html, text } = emails[name];
    expect(html.match(/background:#6D4CF5/g)).toHaveLength(1);
    const href = html.match(/<a href="([^"]+)" style="display:inline-block/)![1].replace(/&amp;/g, "&");
    expect(html).toContain(`word-break:break-all;color:#5E5A72;font-size:14px;line-height:20px">${href.replace(/&/g, "&amp;")}</p>`);
    expect(text).toContain(`\n${href}\n`);
    expect(html).toContain(`href="${ORIGIN}/legal/privacy"`);
    expect(text).toContain(`Privacy policy: ${ORIGIN}/legal/privacy`);
  });
});

// Every branch of every template, not only the samples: no placeholder, "undefined", "null" or
// "NaN" in any of them (acceptance 4).
describe("every branch", () => {
  const url = `${ORIGIN}/r/3f9c2a7be41d0c58a6e19f7b2d4c8e05`;
  const at = new Date("2026-10-20T15:00:00Z");
  const cases: [string, Email][] = [];
  for (const respondentName of ["Sam", null]) for (const intro of ["Two lines.\nOf intro.", null]) for (const opensAt of [at, null]) for (const closesAt of [at, null]) for (const itemCount of [1, 6]) for (const namesHidden of [false, true]) {
    cases.push([`invite ${respondentName} ${intro} ${opensAt} ${closesAt} ${itemCount} ${namesHidden}`, inviteEmail({ pmName: "Mara Stan", workspaceName: "Marlow Group", projectName: "New expense tool", respondentName, itemCount, minutes: 5, intro, url, opensAt, closesAt, namesHidden })]);
  }
  for (const respondentName of ["Sam", null]) for (const answered of [0, 3]) for (const closesAt of [at, null]) for (const itemCount of [1, 6]) {
    cases.push([`reminder ${respondentName} ${answered} ${closesAt} ${itemCount}`, reminderEmail({ pmName: "Mara Stan", projectName: "New expense tool", respondentName, answered, itemCount, url, closesAt })]);
  }
  for (const respondentName of ["Ioana", null]) for (const rateBlind of [true, false]) for (const closesAt of [at, null]) for (const items of [1, 6]) {
    cases.push([`receipt ${respondentName} ${rateBlind} ${closesAt} ${items}`, receiptEmail({ respondentName, projectName: "New expense tool", workspaceName: "Marlow Group", submittedAt: at, closesAt, counts: { items, changed: 1, rated: 1, notNeeded: 0, unclear: 1, missing: 1, confidence: 4 }, rateBlind, url })]);
  }
  cases.push(["deletion without origin", deletionEmail("Marlow Group", at, null)]);
  it.each(cases)("%s", (_, email) => {
    for (const part of [email.subject, email.text, email.html]) expect(part).not.toMatch(/\[|\bundefined\b|\bnull\b|NaN/);
  });
});

// E5-7, acceptance 3: under Names hidden the invite says what About you says; Named does not change.
describe("the invite under Names hidden", () => {
  it("drops recorded under your name and says the team sees the answers without the name", () => {
    const input = { pmName: "Mara Stan", workspaceName: "Marlow Group", projectName: "New expense tool", respondentName: "Sam", itemCount: 6, minutes: 5, intro: null, url: `${ORIGIN}/r/3f9c2a7be41d0c58a6e19f7b2d4c8e05`, closesAt: null };
    const hidden = inviteEmail({ ...input, namesHidden: true });
    expect(hidden.text).toContain("This link is yours. Do not forward it. The team sees your answers without your name. They can see that you have finished.");
    expect(hidden.text).not.toContain("recorded under your name");
    expect(inviteEmail(input).text).toContain("answers sent through it are recorded under your name.");
    expect(inviteEmail({ ...input, namesHidden: false })).toEqual(inviteEmail(input));
  });
});

describe("the frame", () => {
  it("gives the deletion email no button but the privacy link", () => {
    expect(emails.deletion.html).not.toContain("#6D4CF5;color");
    expect(emails.deletion.text).toContain(`Privacy policy: ${ORIGIN}/legal/privacy`);
  });

  it("sends without the mark and the privacy link when there is no origin", () => {
    const email = deletionEmail("Marlow Group", new Date("2026-10-21T09:00:00Z"), null);
    expect(email.html).not.toContain("<img");
    expect(email.text).not.toContain("Privacy policy");
    expect(email.text).toContain(COMPANY);
  });

  it("matches the committed samples (npm run email:samples)", () => {
    const now = sampleEmails(SAMPLE_ORIGIN);
    for (const name of SAMPLE_NAMES) expect(readFileSync(`docs/design-notes/prototype-01/email-${name}.html`, "utf8")).toBe(now[name].html + "\n");
  });

  it("shows the registered address only when COMPANY_ADDRESS is set", () => {
    delete process.env.COMPANY_ADDRESS;
    const without = renderEmail({ origin: ORIGIN, subject: "S", before: [{ text: "Hi," }] });
    expect(without.text.split("\n")).toEqual(["Hi,", "", COMPANY, `Privacy policy: ${ORIGIN}/legal/privacy`]);
    process.env.COMPANY_ADDRESS = "Strada Exemplu 1, Bucharest";
    const withAddress = renderEmail({ origin: ORIGIN, subject: "S", before: [{ text: "Hi," }] });
    expect(withAddress.text).toContain(`${COMPANY}\nStrada Exemplu 1, Bucharest\n`);
    expect(withAddress.html).toContain(`${COMPANY}<br>Strada Exemplu 1, Bucharest<br>`);
  });

  it("escapes what people typed", () => {
    const email = renderEmail({ origin: ORIGIN, subject: "<b>", before: [{ text: `Ana "<script>" & co` }], button: { label: "Go", url: `${ORIGIN}/r/a?x=1&y="2"` } });
    expect(email.html).toContain("Ana &quot;&lt;script&gt;&quot; &amp; co");
    expect(email.html).toContain(`href="${ORIGIN}/r/a?x=1&amp;y=&quot;2&quot;"`);
    expect(email.html).not.toContain("<script>");
    expect(email.html).toContain("<title>&lt;b&gt;</title>");
  });
});
