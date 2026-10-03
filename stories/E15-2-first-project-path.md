# E15-2 The first project path: four steps ticked from the data

User: a PM who signed up today and has not published anything yet
Status: ready
Outcome: on Projects, the robot shows the four steps to a published link, ticks each from
the data, and points to the next one, until the first link is published.

## Acceptance criteria
1. On Projects, above the table (design note 39, question 1), a card "Your first validation"
   with the robot ("hi" until a project exists, then "idea") and four steps: Import the list,
   Shape it, Build the instrument, Share one link, then the line "Then: read the results".
   Each step is a link to that step of the newest project of the person's own.
2. A step is ticked from the data, never from a click: Import when the project has a set,
   Shape when a shape run exists on that set (or the person has opened Shape and the list
   came with areas), Build when the instrument has an intro and at least one field saved by
   the person, Share when a link is published (E6-1). The next unticked step carries the
   robot's line from docs/copy/guide.md.
3. The card disappears for good once a link is published in the workspace, or on Dismiss
   (E15-1); it never shows in a workspace that already has a published link, so a member
   joining a live workspace is not onboarded as if the workspace were empty.
4. The sample does not count: its set, run and link are the seed's. "Try it on the sample
   first" is the card's secondary link while no project of the person's own exists; it opens
   the sample's Results (E8-8).
5. Unit test: the step state from fixed rows (no project, a set, a run, an instrument with
   intro, a published link; the sample ignored). Playwright: sign in, see four unticked steps,
   paste a list, see Import ticked and the robot's line on Shape.

## Out of scope
- A progress bar or a completion percentage: four ticks are the progress.
- Reminders by email to finish the first project: not in R1.

## Open questions
- None. The place (above the table) is decided (decision 0044, item 1; docs/review-list.md).

## Technical notes
One query, src/db/queries/guide.ts `firstProjectState(workspaceId, userId)`, from the
existing tables (project, item_set, instrument, invite); no new column. The step rule lives
in src/lib/guide.ts so the unit test runs without the database.
