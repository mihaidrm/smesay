# E15-4 Rescue tips for three stuck states

User: a PM who is stuck without knowing it
Status: built
Outcome: when the data shows one of three stuck states, the robot says what is wrong and
what to do, once, in that place.

## Acceptance criteria
1. Three stuck states, each a guide card (E15-1) in the "help" pose placed from the robot
   pack (design note 39): an upload stored ten minutes ago or more with columns to map and not
   imported (Import); a shape run refused or failed on the newest list, with no run that
   applied after it (Shape; the error banner of E4-1 stays, the card adds the next step, and
   "Try again" only where a second run can pass: failed, invalid, rate limited); a link open
   for three days or more (from the publish, or the open date when later) with no response
   (Share: the card suggests a personal invite, E6-2).
2. The states are computed from the rows' timestamps on the server, with no client timer; a
   card that no longer applies (the mapping is saved, a run succeeded, a response arrived)
   disappears on the next load.
3. Delivered by E15-5: each rescue tip is counted shown, dismissed and acted on; a tip whose dismissals
   exceed its actions over a month is listed on the admin page (E13-2) as "to review".
4. Unit test: the three conditions on fixed rows and timestamps, including the boundary
   (nine minutes, ten minutes). Playwright: a stored upload with the clock moved by the test
   shows the Import rescue card.

## Out of scope
- Rescue by email: not in R1.
- Detecting hesitation from mouse or scroll behaviour: no client tracking of that kind
  (decision 0030 limits what is logged).

## Open questions
- None. The three states and their thresholds are decided (decision 0044, item 2;
  docs/review-list.md).

## Technical notes
The thresholds are constants in src/lib/guide.ts, the one place. Built 2026-10-05 (design
note 90): the Shape rescue reads a new event, shape_failed (reason, project), written by
src/lib/shaping.ts on every refusal or failure (docs/analytics.md, the catalogue now 22
events, E13-1 amended); the newest row is read by events.lastWith. The Share rescue counts
responses with responses.countForInstrument and needs the link open (linkState "open"), so a
withdrawn, closed or not yet open link shows none. The Playwright test moves the upload's
created_at back eleven minutes instead of moving a clock. The "help" pose is a fifth
file under public/assets/mascot/ from the same pack, recoloured as the four others (note 37):
the pack's "Medical Bot", placed 2026-10-05 (docs/assets.md).
