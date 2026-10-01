# E5-6 Live preview panel on Import, Shape, Build and Share, desktop and phone

User: a PM who wants to see what respondents get while changing it
Status: ready
Outcome: a preview of the respondent instrument stays visible on every builder step, rings
what the current step changes, shows desktop by default and phone on a toggle, and never
stores a response (decision 0021).

## Acceptance criteria
1. A 460 px panel on the right of Import, Shape, Build and Share, not on Results, Projects or
   Settings (PM app board, note 13). Header: "Preview", a Desktop and Phone segmented control
   (desktop first), "Open full size" which opens the respondent app for the chosen device in
   a new tab, in preview mode.
2. The caption under the toggle names what the step changes, and the same parts carry the
   teal 300 ring: Import rings the chapter row and the cards; Shape rings the card wording;
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

## Out of scope
- A preview on Results: nothing there changes the instrument (decision 0021).

## Open questions
- Decision 0021's open item: keep the desktop preview at 42 percent (layout, not readable
  text) or reflow it to one readable column. Recommend 42 percent plus "Open full size",
  since the phone frame is where words are read. Mihai decides after clicking the PM board.

## Technical notes
The iframe loads /r/preview?instrument=[draft id]&device=desktop|phone with a short-lived
preview token tied to the PM's session; the respondent app treats the token as "render only".
Highlight rings are passed as a query parameter (`ring=nav,cards`) and drawn by the
respondent app, so the preview and the real app share the markup.
