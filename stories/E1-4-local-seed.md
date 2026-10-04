# E1-4 Local development with seed data

User: Mihai, opening the app on his PC; Claude, testing every later story against known data
Status: built
Outcome: `docker compose up -d`, `npm run dev` and the first sign-in give a running app with a
workspace holding the sample project, so there is something to look at from day one; the seed
itself fills the test fixture the later epics' tests read (amended with E2-3).

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
4. The seed never creates a user account or a membership: the seeded workspace is the test
   fixture under a fixed id, read by the tests of E8 and E10. Every workspace made in the app
   gets its own copy of the sample at creation (E2-3, built 2026-10-02; amended from "E2's
   first sign-in becomes its owner").
5. docs/setup.md "Run it" includes the seed step and Mihai has run it on his PC (open until
   Mihai does; the step is in docs/setup.md).

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
the same day (decision 0033). Sign-off times and confidences are the landing page's sign-off
record; the opens and closes instants are the boards' 09:00 and 18:00 in Romania's October
time (UTC+3); the import report is the Import step's (6 rows, header on row 1, nothing
skipped, expense-requirements.xlsx). Tokens are fresh from crypto.randomBytes(16) on every
run, so nothing in the repository opens a link and two workspaces seeded with the sample
(E8-8) never collide. The fourth action cites a missing item, for which schema v1 has no
column until E9-1 adds cited_missing_item_ids (decision 0033); since E9-1 the seed fills it
and gives each action its kind. "Office
manager" was added to the respondent board's role list (respondent-generator.py, both boards
regenerated) so Sam Hill's role exists. Agree answers carry the proposed value as their value;
unclear answers carry the question in `reason`. A seed killed half way (no thrown error)
leaves a partial workspace; the next run sees fewer than 6 items, removes it and starts over.
src/db/seed/seed.test.ts runs the seed twice on the test database and checks the counts, the
sign-off record and every citation in SQL (4 tests). tsx: open issue count unverified, the
GitHub API for repositories outside the project is not reachable from the session.
