# E15-1 The guide card, its off switch and what it remembers

User: a new PM on their first screens
Status: ready
Outcome: one card where the robot speaks, one line at a time, that the person can dismiss
or switch off, and that stays off.

## Acceptance criteria
1. The guide card (design note 39): the robot in a pose, one line of up to 140 characters,
   at most one action (a link or a button) and Dismiss; a card on the soft violet gradient
   like the Banner (docs/design-system.md), 88 px robot on the left. At most one guide card
   on any screen; never a modal, never a spotlight overlay, never on the respondent side.
2. Every line the card can say is in docs/copy/guide.md with its id, its pose, its screen
   and the data condition that shows it; the component takes the id and renders the file's
   line, so no line exists outside the file.
3. "Show tips" in the sidebar footer, above the mode toggle (docs/copy/app.md): a switch per
   person (not per workspace), on by default; off hides every guide card and the first-project
   path (E15-2); on brings back the tips not dismissed.
4. Dismiss hides that tip for that person for good; GuideState { tipsOff: boolean,
   dismissed: string[] } on the user row (INTERFACES.md), written by a server action; the
   card shows nothing until the state is loaded, never a flash of a dismissed tip.
5. Unit tests: the copy file has every id the code references and no id twice; a dismissed
   id never renders. Playwright: a tip shows on Projects, Dismiss removes it, a reload keeps it
   gone, Show tips off removes another, on brings it back.

## Out of scope
- The lines themselves and when they show: E15-2 to E15-4. Tracking: E15-5.

## Open questions
- None. The card's place on each screen is in the stories that use it.

## Technical notes
user.guide_state jsonb, default { "tipsOff": false, "dismissed": [] }, one migration. The
card is src/components/app/guide-card.tsx with the lines from src/lib/guide-copy.ts, which
is checked against docs/copy/guide.md by scripts/scan-copy.mjs or a unit test (the same way
docs/copy/app.md rows are checked today: by hand in the audit; a test here is new).
