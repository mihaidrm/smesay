# E8-8 Sample project on first login, watermarked, deletable

User: a new PM who wants to see the end before the start
Status: ready
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
this story adds the confirm text, the button on the sample header and the Playwright check.
The sample's About card is read-only since E3-1.
The sample's invite tokens are real 128-bit tokens, one set per workspace (E2-3); acceptance 2
is what keeps them closed to outsiders, and E7-1 refuses them until then.

## Out of scope
- Restoring a deleted sample: not in R1 (a new workspace gets a new one).

## Open questions
- None.

## Technical notes
project.is_sample (docs/schema.md). The band is one component used by the layout when the
project is a sample; exports read the same flag.
