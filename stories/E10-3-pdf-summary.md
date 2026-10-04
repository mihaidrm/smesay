# E10-3 PDF summary: headline numbers, per-area agreement, registers, sign-off record

User: a PM putting the result in a steering deck
Status: ready
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
