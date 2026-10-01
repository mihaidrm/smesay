# Design note 13: preview panel in the PM builder, 2026-10-01

Made in the Claude Code cloud session of 2026-10-01 from Mihai's canvas comment (decision 0021).
File: docs/design-notes/prototype-01/PmApp.dc.html. Logic check: pm-preview-check.js (node,
25 checks). Screenshots: pm-preview-shape-desktop.png, pm-preview-build-phone.png,
pm-preview-share-revoked-phone.png.

## What changed

- Panel, 460 px, right of the content column on Import, Shape, Build and Share. Header with
  "Preview", a Desktop and Phone segmented control, and "Open full size" (links to the respondent
  board for that device). A caption with a teal 300 square: "Highlighted: what this step
  changes" and one sentence per step.
- Desktop frame: 420 by 378 px box, the respondent's 1000 by 900 px column inside at
  transform scale 0.42. Phone frame: 390 by 844 px at true size, radius 24. The panel body
  scrolls when the phone frame is taller than the space.
- The preview is the respondent instrument reduced to what the builder controls: header note,
  chapter row with counts, area title and intro, 260 px cards with reference, two-line title,
  "Your rating" row, Details and + comment, footer with Back and Continue. About you page with
  the open and close note and the two fields. Withdrawn page for a revoked link.
- Driven by the builder state: shaped (reader version, or the original where rejected), method
  (MoSCoW five pills with the proposed one dashed and captioned; 1 to 5 fit six pills with "no
  fit" and "fits fully" captions; keep, change, drop four pills), show proposed (captions off),
  layout (chapters: one area; one item per screen: one card and "Item 1 of 2"; single page: all
  areas, no chapter row), link state (draft, published, revoked).
- Highlight: box-shadow ring in teal 300, 6 px inside the scaled desktop frame (reads as 2.5 px),
  3 px on the phone. Which parts ring is listed in decision 0021.
- Step screens reflow to the 740 px column: titles and their buttons share one row, the subtitle
  runs full width under them; Import stacks its context card, mapping, checks and file rows;
  Build loses its old one-card preview; Share stacks the link card over the invites.

## Why

Form builders that show the instrument while you edit (Typeform's editor is the common example)
let the PM see the effect of a choice without a round trip. The previous board showed one card on
Build only, so the effect of Shape and Share decisions was invisible until the respondent board
was opened. Unverified against a published usability source: the network in this session blocks
nngroup.com and the GOV.UK design system, so this is from product practice, not a cited study.

## Limits

- The desktop preview at 42 percent shows layout, not readable text. Phone and "Open full size"
  are where the words are read. Decision 0021 leaves the alternative (reflow to one column)
  open for Mihai.
- The preview shows one area at a time in the chapters layout, with the chapter pills live.
  Wrap up is not drawn in the preview.
- Prototype only: the PM board has no real respondent state, so counts are "0 of 2" and the
  rating pills do not answer.
