# E11-3 Privacy policy, terms, DPA and subprocessor list; privacy notice on every instrument

User: a PM's legal team; a respondent wondering where their answers go
Status: built
Outcome: the four legal pages exist as drafts with a marker at every place a lawyer must
confirm, each showing its version and date, and every instrument links to the privacy notice.

## Acceptance criteria
1. /legal/privacy, /legal/terms, /legal/dpa, /legal/subprocessors: drafted by Claude in plain
   English (WRITING.md), with "[LAWYER: confirm ...]" markers at every place a lawyer must
   confirm (decision 0004 item 3), the controller Alerty S.R.L. with the registered address
   placeholder, the hosting region, retention (24 hour deletion, E11-2), the respondent data
   stored (only the fields the PM configured, CLAUDE.md), the AI processing (Anthropic as a
   subprocessor, what is sent), exports ("exports you make": the CSV files of E10-1 and the
   whole-project JSON of E10-2 hold respondents' names, emails and free text, the values of
   every respondent field the PM configured, invite role hints, and the email of the workspace
   member who closed an action; E10-2, acceptance 4), contact, and the landing page's questions (E12-5,
   decision 0046: emailed to SMEsay with the visitor's address, nothing kept in the app).
2. Each page shows "Version [N], [DATE]" at the top; versions are files in docs/legal/ and
   the pages render them, so a change is a commit.
3. The respondent About you page and the Done page link to the privacy notice ("How your
   answers are used") in the footer beside Powered by; the landing page footer links to all
   four (docs/copy/landing.md).
4. The markers are counted by a script (`npm run legal:markers`) and listed in docs/accounts.md
   step 12 for the lawyer; the pages ship with the markers visible until Mihai says they are
   confirmed, then the markers are removed in one commit.
5. The copy scan passes on docs/legal/.

## Out of scope
- The lawyer's review itself: the launch gate (docs/accounts.md step 12).

## Open questions
- None.

## Technical notes
The sign-in email's footer already links to /legal/privacy (E2-1, src/lib/mail/sign-in-email.ts),
so the address is fixed; until this story the link opens the 404 page.
Markdown in docs/legal/ rendered through a small renderer with the design system's type;
subprocessors list from docs/accounts.md (hosting, database, email, storage, AI, errors,
analytics) with "none yet" where the account does not exist (decision 0006).

Built 2026-10-04 (design note 74, decision 0044):
- Acceptance 1: docs/legal/privacy.md, terms.md, dpa.md and subprocessors.md, drafted in plain
  English with 36 "[LAWYER: ...]" markers; /legal/privacy, /legal/terms, /legal/dpa and
  /legal/subprocessors render them (src/app/legal/[page]/page.tsx, src/lib/legal.ts), built
  once at build time; any other name under /legal is the 404 page. The privacy policy covers
  every topic this criterion lists. The subprocessor list marks Anthropic as in use, the launch
  accounts as planned (decision 0006) and says no error reports or visit counts are in use; no
  company's legal name is written, the lawyer confirms them. After the fresh-context audit (8
  blocking statements the code contradicted), every statement on what is stored or sent was
  checked against the code again; design note 74 lists what changed.
- Acceptance 2: each file starts with "version: N" and "date: YYYY-MM-DD"; each page shows
  "Version [N], [DATE]" at the top; a change is a commit.
- Acceptance 3: About you and the Done page carry "How your answers are used" beside Powered by
  (src/components/respondent/powered-by.tsx, privacy), on every plan, opening in a new tab; the
  landing page's footer links to the four pages (docs/copy/landing.md).
- Acceptance 4: `npm run legal:markers` (scripts/legal-markers.mjs) lists the markers per page
  with their count; docs/accounts.md step 12 points the lawyer at it. The pages show the
  markers in the sun tint until Mihai says they are confirmed.
- Acceptance 5: the copy scan covers docs/legal/ (scripts/scan-copy.mjs reads every .md).
- Tests: src/lib/legal.test.ts, src/components/respondent/powered-by.test.tsx,
  e2e/legal.spec.ts.
