# E15-4 Rescue tips for three stuck states

User: a PM who is stuck without knowing it
Status: ready
Outcome: when the data shows one of three stuck states, the robot says what is wrong and
what to do, once, in that place.

## Acceptance criteria
1. Three stuck states, each a guide card (E15-1) in the "help" pose placed from the robot
   pack (design note 39): an upload stored for more than ten minutes with no mapping saved
   (Import); a shape run that failed on the budget or an error, with no run after it (Shape;
   the error banner of E4-1 stays, the card adds the next step); an instrument with a link
   published for more than three days and no response (Share: the card suggests a personal
   invite or a reminder, E6-2 and E6-3).
2. The states are computed from the rows' timestamps on the server, with no client timer; a
   card that no longer applies (the mapping is saved, a run succeeded, a response arrived)
   disappears on the next load.
3. Each rescue tip is counted shown, dismissed and acted on (E15-5); a tip whose dismissals
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
The thresholds are constants in src/lib/guide.ts, the one place. The "help" pose is a fifth
file under public/assets/mascot/ from the same pack, recoloured as the four others (note 37).
