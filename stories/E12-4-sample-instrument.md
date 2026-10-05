# E12-4 A sample instrument visitors can answer

User: a visitor pressing "Try the sample as a respondent" on the landing page (it goes to /sample since this story was built; before, "See the sample" went to the app)
Status: built
Outcome: a public link to the Marlow instrument that anyone can go through on their phone
without creating anything in anyone's workspace.

## Acceptance criteria
1. /sample opens the Marlow Group instrument in the respondent app in preview mode (E5-6):
   answers stay on the device for the visit, nothing is written to a workspace, the band
   across the top says "Sample: nothing you enter here is saved", Submit shows the Done page without storing.
2. The sample carries the watermark band (E8-8) and the "Powered by SMEsay" lockup with a
   link to the landing page; the Done page offers "Start free".
3. Rate limited like any respondent route (E11-1); no cookie beyond the preview's own.
4. Playwright: open /sample, answer one item, see Saved on this device, reach Done.

## Out of scope
- Collecting the visitors' answers for research: not without a privacy notice; not in R1.

## Open questions
- None. The sample stores nothing (decision 0031).

## Technical notes
A fixed instrument built from the seed data in a read-only "sample" workspace that exists in
every deployment (created by the seed). The preview mode of E5-6 (nothing saved, Submit off)
is the likely way to serve it, but its token needs a PM's session and lasts one to two hours,
and loadPreview refuses a sample (decision 0021, item 1): this story decides its own access
rule when it is built.

Built 2026-10-05 (design note 80, decision 0044). The access rule this story was to decide: none
is needed, because /sample reads no database. The instrument is built in memory from the seed's
facts (src/lib/sample-instrument.ts), so no "sample" workspace has to exist in a deployment and
no preview token is involved.
- Acceptance 1: src/app/sample/page.tsx and sample-app.tsx render the respondent app
  (src/app/r/[token]/respondent-app.tsx) in sample mode: About you, the three chapters, the
  Wrap up, Done. The details, the cards, the Wrap up and the Submit stay in the tab's session
  storage under smesay-sample (src/lib/sample-drafts.ts), so a reload or Back keeps the screen
  and what was entered; each answered card says "Saved on this device" ("Kept until you leave
  this page" when the browser keeps nothing). Submit shows Done ("Nothing was sent: this is the
  sample.") and sends nothing; the savers never call /r/sample (token "sample"). The sentence
  "Sample: nothing you enter here is saved" is the band across the top, on every screen
  (docs/review-list.md).
- Acceptance 2: the band is the watermark band (src/components/app/sample-band.tsx) with that
  sentence; "Powered by SMEsay" links to /landing-page; Done adds Start free (to sign-in).
- Acceptance 3: src/proxy.ts counts /sample in the respondent limit (src/proxy.test.ts); the
  page sets no cookie (the Playwright test checks the context's cookies).
- Acceptance 4: e2e/sample-instrument.spec.ts (also: reload and Back keep the screen and the
  answers, no request other than GET, no cookie); unit tests in
  src/lib/sample-instrument.test.ts and the seed's no-import check in
  src/db/queries/lint-rule.test.ts.
- The landing page's two sample buttons now say "Try the sample as a respondent" and go to
  /sample (stories/E12-1, docs/copy/landing.md, e2e/landing.spec.ts).
