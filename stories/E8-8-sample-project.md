# E8-8 Sample project on first login, watermarked, deletable

User: a new PM who wants to see the end before the start
Status: built
Outcome: every new workspace holds the Marlow Group sample with results, insights and exports,
marked everywhere as a sample, and one click deletes it.

## Acceptance criteria
1. The sample project (E2-3, E1-4) opens on Results with every tab filled from the seed rows;
   its header reads "Marlow Group · sample project" and a watermark band "Sample data: invented
   answers, for looking around" sits on every screen of it, in the exports (E10) and on the
   sample instrument link; the band cannot be dismissed (CLAUDE.md, dashboard rules).
2. The sample cannot be edited: Import, Shape, Build and Share are read-only on it, with a
   line saying so; its link cannot be published to outsiders (the sample instrument for
   visitors is E12-4).
3. "Delete sample" on the project list and on the sample header: a confirm with "The sample
   project and its invented answers are deleted. Your own projects are not affected." then the
   rows go in one transaction (decision 0028: responses first, then the project).
4. The watermark cannot be removed except by deleting the sample: a test checks is_sample is
   not updatable through any helper (the helpers refuse the column).
5. Playwright: open the sample, see the band, delete it, see it gone from the list.

## Technical notes
Acceptance 3 (Delete sample on the project list, responses first then the project in one
transaction) is built by E3-1 (projects.deleteSample in src/db/queries/projects.ts, tested);
this story adds the button on the sample header and the Playwright check; the confirm line
(acceptance 3) is on the list since the E3-1 audit fixes. The sample's About card is read-only
since E3-1, and the server refuses a context save or an archive on the sample since the E3-1
audit fixes (src/lib/projects.ts); acceptance 4 (the helpers refuse the column) stays here.
The sample's invite tokens are real 128-bit tokens, one set per workspace (E2-3); acceptance 2
is what keeps them closed to outsiders, and E7-1 refuses them until then.

## Out of scope
- Restoring a deleted sample: not in R1 (a new workspace gets a new one).

## Open questions
- None.

project.is_sample (docs/schema.md). The band is one component used by the layout when the
project is a sample; exports read the same flag.

Built 2026-10-04 (decision 0044; docs/review-list.md):
- Acceptance 1: the sample opens on Results (its furthest step, E8-1) with the Agreement tab,
  the registers, the Responses tab and the detail filled from the seed; Actions and Export
  fill with E9-1 and E10-1, and the exports carry the watermark there (E10-1, acceptance 4).
  The header reads "[workspace] · sample project"; the band is one component
  (src/components/app/sample-band.tsx) drawn by the project frame
  (src/app/app/(shell)/projects/[projectId]/layout.tsx) inside the pinned header on every
  step, so it stays in view while the page scrolls, and by the sample's link page
  (src/app/r/[token]/page.tsx); neither can be dismissed. The sample's Actions tab is E9-1's
  acceptance 7.
- Acceptance 2: Import (the About card), Shape (a line, new here), Build and Share are
  read-only on the sample with "The sample project cannot be edited."; the server refuses
  saves, Publish and invites on it (src/lib/projects.ts, src/lib/sharing.ts,
  src/lib/invitees.ts), and its link never collects answers (E7-1).
- Acceptance 3: Delete sample on the list (E3-1) and, here, on the sample's header in
  Archive's place, with the same confirm line and the same action.
- Acceptance 4: projects.update refuses a patch that carries isSample (SampleFlagError),
  whatever its value, and projects.create refuses isSample true; only the seed makes a sample
  (createSampleProject in src/db/queries/projects.ts, not in the @/db/queries barrel).
  src/lib/projects.test.ts checks both, and that the barrel does not carry it.
- Acceptance 5: e2e/sample.spec.ts opens the sample on Results, sees the band there, on
  Shape (with its line), Build, Share and Import, deletes it from its header and sees it
  gone from the list; e2e/respondent-start.spec.ts sees the band on the sample's link page.
