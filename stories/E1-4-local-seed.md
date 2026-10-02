# E1-4 Local development with seed data

User: Mihai, opening the app on his PC; Claude, testing every later story against known data
Status: built
Outcome: `docker compose up -d` and `npm run dev` give a running app with one seeded
workspace holding the sample project, so there is something to look at from day one.

## Acceptance criteria
1. `npm run db:seed` on a migrated, empty database creates the workspace "Marlow Group" with
   the sample project "New expense tool" (decision 0005): 6 items in 3 areas with original and
   reader text, one instrument (MoSCoW, proposed value shown, chapters layout, fields name and
   role), one public invite and six personal invites, 6 responses (5 submitted, 1 in progress;
   the seventh invitee never opened the link, so has no response) with the answers, reasons,
   questions, one missing item and confidences the prototype boards show, 4 insights and 2 AI
   runs. The numbers on the PM app board (5 of 7, 19 of 30 agree, 7 changed, 2 not needed, 2
   unclear, 1 missing, confidence 3.8) are reproducible from these rows.
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
Built 2026-10-02. Seed data lives in src/db/seed/sample.ts as plain objects, the same facts as
the prototype's mocked data (docs/design-notes/prototype-01/PmApp.dc.html data(),
Respondent.dc.html items()) and the landing page. src/db/seed/sample-seed.ts inserts them
through the E1-3 helpers (the first caller of every insert) and removes the workspace again if
anything fails half way. `npm run db:seed` is `node --env-file-if-exists=.env.local --import
tsx src/db/seed/index.ts` (nodejs.org/api/cli.html; tsx.is/node-enhancement; tsx 4.23.15, MIT,
released 2026-09-20, checked with `npm view` on 2026-10-02). One fixed id, the workspace's
(SAMPLE_WORKSPACE_ID in sample.ts); the helpers ignore ids on create (E1-3), so every
other sample row is found by its natural key (item reference, invite token, respondent name).
Counts: the prototype board stored Priya Nair's answer on CL-06 as "changed to Not needed";
under decision 0018 Not needed is Disagree, so the seed stores it as disagree and the totals
are 19 agree, 7 changed, 2 not needed, 2 unclear over the 30 submitted answers (63 percent
agree); the board, the landing page fragment and story E8-1 were corrected to these numbers
the same day. Agree answers carry the proposed value as their value; unclear answers carry the
question in `reason`. src/db/seed/seed.test.ts runs the seed twice on the test database and
checks the counts in SQL (3 tests).
