# Design note 65: the builder's preview panel, 2026-10-04

Made in the Claude Code cloud session of 2026-10-04 for stories/E5-6, under decision 0044.
Decision 0021 (the preview on every builder step) and the PM app board's panel (note 13) are
the starting point; this note records what was decided while building it.

## What was decided

- The panel is the respondent app itself in an iframe, not a copy of its parts: the same
  page as a respondent's link, in preview mode. Build's own preview (an About you, an Items
  and a Wrap up screen drawn from the shared components, E5-1 to E5-5) is gone, and so are
  its screen switch and its first-ten-cards rule: the preview shows the whole list.
- The address is /r/[preview token]. The token is "p." and a signed claim (the project, the
  workspace and the PM, an hour long), so the route stays the respondent's and a real link's
  32 hex characters can never be mistaken for it. The page also checks that the session is
  that PM's in that workspace. The story named /r/preview?instrument=[draft id]; a token in
  the path needs no second route and keeps the session check in one place.
- Preview mode keeps Start, the cards and the Wrap up in memory, turns Submit off, and puts
  "Preview: nothing you enter here is saved" on every screen. The write routes answer 403 to
  a preview token before they read anything.
- The preview opens started, on the first chapter, so the chapter row is there to move with;
  About you is one pill away. A list whose items no one sees without a perspective opens on
  the nothing-to-rate screen.
- What each step rings (decision 0021, item 3): Import the chapter row and the cards, Shape
  the cards' wording, Build the rating row, the chapter row (its Layout card changes the row),
  About you's fields and the Wrap up's closing part (as Build's own preview did), Share the
  closing date in the header. A revoked link shows the withdrawn page on Share.
- Import and Shape show the latest list, Build and Share the list the draft is built on.
  Before Build has opened a draft the instrument's defaults stand in, so the preview is there
  from the first import.
- The source changes only when what the preview shows changes: the token is made for the
  current hour (it lasts into the next), and a digest of the view is in the address. A save
  that changes the preview reloads it; a render of the page that changes nothing does not.
- Desktop is the 1000 px column scaled to 42 percent (CSS scale) in a 420 by 560 frame;
  phone is the 390 px column at true size in a 720 px frame that scrolls. "Open full size"
  opens the same address in a new tab.

## Components added

- PreviewFrame (src/components/app/preview-frame.tsx) and WithPreview
  (src/app/app/(shell)/projects/[projectId]/with-preview.tsx). Not in the design system
  before.
- The ring props on the shared respondent components: the chapter row, the card, its wording.

## Checks

- src/lib/preview-token.test.ts, src/app/r/[token]/preview-writes.test.ts.
- e2e/preview.spec.ts (the steps, the rings, Phone, Open full size, the 403), e2e/build.spec.ts
  (the method switch seen in the preview, acceptance 6), e2e/revoke.spec.ts (the withdrawn
  page on Share).
