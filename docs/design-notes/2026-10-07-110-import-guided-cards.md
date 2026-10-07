# 110 Guided cards on Import and Shape, 2026-10-07

Mihai, 2026-10-07, on a screenshot of the Import page of a project with 119 items imported
(Versions, About this project, The list, Preview, the mapping and the check, all open): "The
shape step is a bit too overwhelming - We should probably keep each section collapsed (slow
each animation) and we guide the user through them so we dont show a wall of text on the page
its too much. the user can still open more manually if he wants".

Decided:
- One collapsible card for the PM side, src/components/app/collapsible-card.tsx, built on the
  native details and summary elements (developer.mozilla.org/docs/Web/HTML/Reference/
  Elements/details): the open attribute, a click or Enter on the summary to toggle, the
  content kept in the DOM while closed, so forms keep what was typed and Playwright's
  locators still resolve once a card is opened. The name attribute (one of a group open at
  a time) is not used: any card opens by a click and stays open until closed. The summary row
  is the title (an h3, so the page's anchors and aria-labelledby keep working) with a mono
  count beside it on the left, a one-line muted state summary and Lucide's chevron-down on
  the right, the hand cursor (design note 101) and the design system's focus ring.
- Opening and closing animate over 300 ms ease-out (src/app/globals.css, .collapsible): the
  ::details-content pseudo-element's height goes from 0 to auto with interpolate-size:
  allow-keywords, and content-visibility transitions with allow-discrete so the content stays
  drawn while it closes (developer.mozilla.org/docs/Web/CSS/::details-content, the animation
  example; developer.mozilla.org/docs/Web/CSS/interpolate-size). Support, from
  browser-compat-data read on 2026-10-07 (the MDN pages' tables come from the same data):
  ::details-content in Chrome 131, Firefox 143 and Safari 18.4; interpolate-size in Chrome
  129 and in neither Firefox nor Safari. A browser with ::details-content but no
  interpolate-size opens and closes at once; one without ::details-content too. The base
  rule for prefers-reduced-motion stops the transition.
- A link to an anchor inside a closed card opens it: "Import a new version" (#upload-title),
  "Add it on Import" from Shape (#about-title) and the rescue tip's "Map the columns"
  (#mapping-title). The card checks the hash on mount and on hashchange.
- Import: the card whose work comes next is open, the others closed with a summary. The rule
  is one function, src/lib/import-guide.ts (importStage, openCards), with its unit test:
  no upload yet, The list open (About closed with "[N] of 2,000 characters" or "Nothing
  written yet"); an upload whose mapping has no text column (or an empty sheet), Preview and
  Column mapping open, The list closed with the file name; a mapping with a text column,
  the check card open alone with "[N] items ready"; the latest upload imported, Versions open
  with "Version [N], [N] items" and the rest closed. The sample project, which has no list
  card, opens About. A guessed mapping with a text column counts as confirmed: there is no
  confirm step, and the summaries of the closed Preview ("12 rows, header on row 1") and
  mapping ("4 of 4 columns mapped") say what was guessed; a click opens either.
- Shape: each area is the same card, the first open and the rest closed, the item count beside
  the name and "[A] of [R] reader versions accepted" as the summary once the list is shaped
  (nothing before). The rationale sits first inside the card. The card is the drop target, so
  an item dropped on a closed area's name row lands in it. "Shape with AI", "Run again",
  Accept all, Reject all, the counter, the context line and the flag banners stay above the
  areas as before. Mihai's screenshot was Import; Shape followed the same idea because the
  119-item list made it the longer page.
- What stays as it was: the imported line, the guide card, the published banner above the
  cards; the small details under each check count.
- Rendered on /styleguide under Components (an open and a closed card).

Rejected: one card open at a time through the name attribute (a PM comparing the preview with
the mapping needs both); an accordion component from a library (the native element does the
job with no script, keeps the content in the DOM and animates in the current browsers).

Tests: src/lib/import-guide.test.ts (the stages, the open cards, the summaries);
e2e/import.spec.ts asserts the check card open and Preview closed after the upload, the
mapping closed with its summary, the check closed while the text column is missing, and
after the import Versions open and The list closed, then opened by a click;
e2e/shape.spec.ts asserts the first area open and the second closed with its summary, then
opened by a click, and the About card opened by the anchor link from Shape; e2e/paste.spec.ts,
e2e/projects.spec.ts, e2e/session-expiry.spec.ts, e2e/guide-tips.spec.ts and
e2e/respondent-a11y.spec.ts open the card they work in first.
