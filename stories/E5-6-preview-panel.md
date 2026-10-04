# E5-6 Live preview panel on Import, Shape, Build and Share, desktop and phone

User: a PM who wants to see what respondents get while changing it
Status: built
Outcome: a preview of the respondent instrument stays visible on every builder step, rings
what the current step changes, shows desktop by default and phone on a toggle, and never
stores a response (decision 0021).

## Acceptance criteria
1. A 460 px panel on the right of Import, Shape, Build and Share, not on Results, Projects or
   Settings (PM app board, note 13). Header: "Preview", a Desktop and Phone segmented control
   (desktop first), "Open full size" which opens the respondent app for the chosen device in
   a new tab, in preview mode.
2. The caption under the toggle names what the step changes, and the same parts carry the
   violet ring (design v2): Import rings the chapter row and the cards; Shape rings the card wording;
   Build rings the rating row (and the chapter row when the layout changes); Share rings the
   open and close note and shows the withdrawn page when the link is revoked (decision 0021
   item 3).
3. The preview is the real respondent app (E7) rendered in an iframe in preview mode, driven
   by the draft: the same components, so the two cannot drift. Chapter pills are clickable;
   changing step resets the preview.
4. Preview mode never writes a response: the respondent app in preview mode keeps answers in
   memory only, shows "Preview: nothing you enter here is saved" in its header, and the
   submit button is disabled. A test calls the autosave route with a preview token and gets
   403.
5. The desktop preview is the 1000 px column at 42 percent; the phone preview is 390 px at
   true size, scrolling inside the panel.
6. Playwright: on Build, switch the method, see the pills change in the preview.

7. The preview shows the workspace's current brand (E2-5): the logo in the header and
   `effectiveAccent()` where the respondent app uses it, so a PM sees the colour before sharing.

## Out of scope
- A preview on Results: nothing there changes the instrument (decision 0021).

## Open questions
- None. The desktop preview stays at 42 percent with "Open full size" (decision 0031).

## Technical notes
Sequencing (decision 0045, Mihai, 2026-10-04): built after E7-5, once the respondent app
exists to load in the iframe; until then the Build preview draws the shared components
(src/components/respondent/) in its own panel (E5-2 to E5-5). Placed 2026-10-04 under
decision 0044: the first story after the pause that follows E8, before E9-1, since Mihai
asked for E8 straight after E7 (docs/review-list.md).

The iframe loads /r/preview?instrument=[draft id]&device=desktop|phone with a short-lived
preview token tied to the PM's session; the respondent app treats the token as "render only".
Highlight rings are passed as a query parameter (`ring=nav,cards`) and drawn by the
respondent app, so the preview and the real app share the markup.

Built 2026-10-04 (design note 65, decision 0044; docs/review-list.md):
- Acceptance 1: src/components/app/preview-frame.tsx, 460 px, on Import, Shape, Build and Share
  through src/app/app/(shell)/projects/[projectId]/with-preview.tsx; not on Results,
  Projects or Settings. "Preview", Desktop and Phone (desktop first), "Open full size" (the
  same preview in a new tab for the device chosen).
- Acceptance 2: the caption names what the step changes and the respondent app draws the
  violet ring (src/lib/preview.ts STEP_RINGS): Import the chapter row and the cards, Shape the
  cards' wording, Build the rating row, the chapter row, About you's fields and the Wrap up's
  closing part, Share the closing date in the header; a revoked link shows the withdrawn page
  on Share.
- Acceptance 3: the iframe loads /r/[preview token] (src/lib/preview-token.ts: "p.", a signed
  claim of the project, the workspace and the PM, one to two hours long; the story's
  /r/preview?instrument= became the token itself, so the route stays /r/[token]); the page
  checks the session is that PM's in that workspace (previewAccess; the same PM in another
  workspace is told to switch) and renders src/app/r/[token]/
  respondent-app.tsx for the draft (src/lib/preview.ts loadPreview: the latest list on
  Import and Shape, the draft's list on Build, the live link's instrument on Share, the
  defaults before Build opens a draft; never the sample, decision 0021 item 1). On Build the
  Closing card focused opens the Wrap up (E5-5 acceptance 3). The chapter pills move between screens; the source changes only when what it
  shows changes, so a save reloads the preview and a render that changes nothing does not.
- Acceptance 4: in preview mode Start, the cards and the Wrap up stay in memory, Submit is
  off and every screen says "Preview: nothing you enter here is saved"; the write routes
  answer 403 to a preview token (src/app/r/[token]/preview-writes.test.ts; e2e/preview.spec.ts
  calls the answers and start routes with the preview's token).
- Acceptance 5: desktop is the 1000 px column scaled to 42 percent in a 420 by 560 frame;
  phone is 390 px at true size in a 720 px frame that scrolls.
- Acceptance 6: e2e/build.spec.ts switches the method on Build and sees the pills change in
  the preview, with the layouts, the perspectives after Start and the Wrap up.
- Acceptance 7: the preview is in the workspace's current brand (its logo and
  effectiveAccent()).

