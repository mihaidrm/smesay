# E10-3 PDF summary: headline numbers, per-area agreement, registers, sign-off record

User: a PM putting the result in a steering deck
Status: built
Outcome: a PDF of about three pages that renders in under ten seconds for 200 items and 50
responses.

## Acceptance criteria
1. "Summary for the deck" export: page 1 the headline numbers, the agreement by area chart and
   the confidence histogram; page 2 onward the per-item table per area, the pushed back and
   disagree registers, the unclear and missing registers; last page the sign-off record (who
   confirmed, when, confidence; landing page output "Sign-off record") and the actions with
   citations (E9): the open ones, then the done and the dismissed ones with their state and
   date (E9-2, acceptance 4).
2. Renders under 10 seconds for 200 items and 50 responses: measured in a test with generated
   rows, on CI's runner.
3. Charts are the design system's (stacked bar, histogram) drawn as SVG, in the status
   colours with labels, never colour alone; Geist embedded; A4 portrait with 16 mm margins.
4. Over the page limit (30 pages): the file still downloads and the inline note "The summary
   runs to [N] pages. It still downloads; the deck version is the first [N]." appears
   (docs/copy/errors.md).
5. Sample exports carry the watermark band on every page.

## Out of scope
- A branded cover with the PM's logo: the header carries the workspace name and logo at 24 px
  only.

## Open questions
- None.

## Technical notes
Renderer chosen in the story's first session with the research check: a server-side HTML to
PDF through Playwright's Chromium (already a dependency; page.pdf is documented at
playwright.dev/docs/api/class-page#page-pdf, verified when the story starts) is the first
candidate because it reuses the dashboard components; @react-pdf/renderer is the fallback.

Built 2026-10-04 (design note 71, decision 0044):
- Renderer: Playwright's Chromium through playwright-core 1.63.0 (now a runtime dependency;
  Apache-2.0), Page.pdf as node_modules/playwright-core/types/types.d.ts documents it
  (preferCSSPageSize, printBackground, tagged, header and footer templates). Next leaves
  playwright-core out of the server bundle (node_modules/next/dist/lib/
  server-external-packages.jsonc). @react-pdf/renderer was not needed.
- Acceptance 1: Summary for the deck on the Export tab downloads the PDF from
  /api/projects/[id]/export/summary under the page's filter. Page 1: the workspace and the
  project, the strip's tiles (the PM's own choice, else the defaults), the agreement by area as
  stacked bars, the confidence histogram (1 to 5). Then the items of each area (counts, not
  answered, agreement), the Different priority, Disagree, Unclear and Missing items registers.
  On its own page: the sign-off record (who, when, confidence; a person who changed answers
  after Submit is marked) and the actions, open first, then done and dismissed with their state
  and date, each with its citations. src/lib/export/summary.ts reads the same queries Results
  reads; summary.test.ts checks the numbers against the strip, the sign-offs, the actions'
  order and the filter.
- Acceptance 2: e2e/export-summary.spec.ts imports a generated project of 200 items and 50
  submitted responses (through E10-2's import) and times the summary: 6,526 ms in this
  container for 245 pages. CI's runner prints its own time in the job log; the CI figure is
  recorded here when the pull request's run finishes.
- Acceptance 3: the bars and the histogram are SVG in the status colours (Rated in the
  missing-item blue, Not answered a dashed outline; the histogram one violet with empty bins a
  4 px hairline and the average as text), each with its counts in words under it and as its
  accessible name; Plus Jakarta Sans and Geist Mono, the design
  system's fonts, are embedded (SIL Open Font License 1.1, licences in src/lib/export/fonts);
  A4 portrait with 16 mm margins (@page). The story's "Geist" is read as the design system's
  Geist Mono for the numbers.
- Acceptance 4: the route returns the page count in x-summary-pages (the document title is
  fixed, so no typed name can read as a page object); over 30 pages the file still downloads and
  the tab shows the errors.md sentence, which says how to shorten the file (e2e checks it on the 245 pages).
- Acceptance 5: the sample's band "Sample data, invented" is in Page.pdf's header template,
  which Chromium prints on every page; pdftotext found it on 10 of 10 pages of a sample
  render. A position: fixed band missed the last page, so it was not used.
- The outcome's "about three pages" holds for a short list only: a 200-item list's item
  table runs to about 17 pages, and each register row is a line. Asked of Mihai with a
  recommendation (docs/review-list.md).
- Resources: at most two summaries render at once per process, each stops after 60 seconds,
  and the page runs no script and loads nothing from the network.
- Out of scope as written: the workspace logo is not in the header yet (the name is).
- E9-2 acceptance 4: the summary carries the actions' state.
