# E1-4 Local development with seed data

User: Mihai, opening the app on his PC; Claude, testing every later story against known data
Status: building
Outcome: `docker compose up -d` and `npm run dev` give a running app with one seeded
workspace holding the sample project, so there is something to look at from day one.

## Acceptance criteria
1. `npm run db:seed` on a migrated, empty database creates the workspace "Marlow Group" with
   the sample project "New expense tool" (decision 0005): 6 items in 3 areas with original and
   reader text, one instrument (MoSCoW, proposed value shown, chapters layout, fields name and
   role), one public invite and five personal invites, 7 responses (5 submitted, 1 in
   progress, 1 not started) with the answers, reasons, questions, one missing item and
   confidences the prototype boards show, and 4 insights. The numbers on the PM app board
   (5 of 7 submitted, agreement per item) are reproducible from these rows.
2. The sample project is marked `is_sample = true` on the project row so every screen can show
   the watermark (CLAUDE.md, dashboard rules) and "Delete sample" can remove it.
3. Running the seed twice does not duplicate anything: it exits 0 and says the sample already
   exists.
4. The seed never creates a user account: the workspace has no members until E2 signs the
   first user in and attaches them (the seed stores the sample under a fixed workspace id, and
   E2's first sign-in becomes its owner).
5. docs/setup.md "Run it" includes the seed step and Mihai has run it on his PC.

## Out of scope
- Rendering the sample on any screen: E8 (dashboard) and E5 (builder).
- A watermark component: E8.
- Resetting the database from the UI: not in R1.

## Open questions
- None. The seed carries the full sample, responses and insights included (decision 0027).

## Technical notes
Seed data lives in src/db/seed/sample.ts as plain objects, the same facts as the prototype's
mocked data (docs/design-notes/prototype-01/PmApp.dc.html data()), and the respondent names
and reasons as on the landing page. `npm run db:seed` is `tsx src/db/seed/index.ts` (tsx added
as a dev dependency; its licence and release checked before adding). Fixed ids for the sample
rows so tests can reference them. The seed uses the E1-3 helpers, so it is also the first
caller of every insert.
