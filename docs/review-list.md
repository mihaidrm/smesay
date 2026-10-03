# Review list for Mihai's full round

Everything Claude decided on its own under decision 0044, oldest first. One row per
decision: what was decided, where it lives, what to look at. Mihai goes through this list
in the full review when every epic is built; a row he overturns becomes a decision file and
a change.

| Date | Decided | Where | What to look at |
|---|---|---|---|
| 2026-10-03 | The first-project path sits at the top of the Projects page | stories/E15-2, design note 39 | Is it in the way once you have projects? It disappears after the first published link. |
| 2026-10-03 | Rescue tips for three stuck states: an upload not imported after 10 minutes, a failed AI run, a link with no answer after 3 days | stories/E15-4 | Are the three states the right ones and the waits right? |
| 2026-10-03 | Three tips on the sample's Results walkthrough | stories/E15-3 | Enough to understand the dashboard? |
| 2026-10-03 | The robot has no name; the copy says "the guide" | docs/copy/guide.md | Does it need a name for the launch? |
| 2026-10-03 | A donut chart only for a whole area and the whole list, never per item; the design system's "never a pie" relaxed to that | stories/E8-3, docs/design-system.md | The Share view on Results. |
| 2026-10-03 | The `change` answer is called "Different priority" on screen, in the CSV and on the landing page | stories/E8-1, E8-3, E8-4, E10-1 | The strip, the tab name, the legend. |
| 2026-10-03 | Each user picks their own Results tiles, up to six of twelve | stories/E8-1 | Should a workspace share one set instead? |
| 2026-10-03 | The tile catalogue: submitted of invited, agreement, different priority, disagree, unclear, missing items, with a comment, items not answered, items fully agreed, items most pushed back, median minutes to submit, in progress | stories/E8-1 | Anything missing from what you look at first? |
| 2026-10-03 | On the 1 to 5 scale, "1 no fit" counts as disagree, like Not needed and Drop; 2 to 5 off the proposal are a different priority | src/lib/scoring.ts, stories/E5-2 | Should any value other than the proposal be "different priority" on the 1 to 5 scale instead? |
| 2026-10-03 | The import's proposed value is read into the method's code by word (Must, must have, M, Won't, Not needed; 1 to 5; keep, change, drop); a word outside the scale means no proposal on that card | src/lib/scoring.ts proposedCode | Items whose proposed value is not recognised show no dashed pill and store `pick`. |
| 2026-10-03 | The preview panel has an About you and an Items screen on Build; Items shows the first chapter's cards | build/preview-panel.tsx | E5-6 replaces this with the real respondent app in an iframe. |
| 2026-10-03 | An instrument counts as published once it has any link or invite row | src/lib/instruments.ts isPublished | E6-1 may add a published_at; the lock then follows it. |
| 2026-10-03 | Under keep, change, drop, picking Change against a Keep proposal is stored as `change` ("Different priority"), like any other value off the proposal; Drop is disagree | src/lib/scoring.ts classify | Should "Change" mean "wrong as written" (disagree) on that scale instead? |
| 2026-10-03 | A label up to 20 characters wraps to two lines inside its 38 px pill on a phone | src/components/respondent/rating-row.tsx | Type a 20-character label and look at the pill at 390 px. |
| 2026-10-03 | The proposed marker shows under every method, not only MoSCoW as the board drew it | rating-row.tsx, PmApp board | Right for 1 to 5 and keep, change, drop? |
| 2026-10-03 | The selected pill takes the PM's accent as given; the dark-mode lift of the accent (design system, Respondent theming) is left to E7-7 | rating-row.tsx | On dark, a PM accent that fell back to ink shows the selection by its white text only until E7-7. |
| 2026-10-03 | The publish check and the scoring save are two statements; a publish landing between them lets one change through; E6-1 makes the save conditional | src/lib/instruments.ts saveScoring | Nothing to see until E6-1. |
| 2026-10-03 | The scoring refusals use the story's wording: "Pick one of the three methods..." and "Published instruments keep their method. Build a new instrument to change it." | docs/copy/errors.md | A new instrument comes from a re-import plus "Build on version N"; is the line clear enough? |
| 2026-10-03 | The respondent pills stay 38 px high (decision 0018 item 4, the design system), not the 48 px E5-3's acceptance 3 asked for; the buttons are 48 | src/components/respondent/rating-row.tsx, stories/E5-3 | Six pills at 48 px would not fit a 390 px row; tap the pills on your phone when E7-2 is built. |
| 2026-10-03 | The layout of a published instrument can still be changed; only the method, the switch and the labels lock | src/lib/instruments.ts saveScoring | A layout change mid-run changes what a returning respondent sees, not what is stored. |
| 2026-10-03 | E5-3's phone check runs in the 390 px preview frame on a fresh project (the frame's scrollWidth), not at 375 by 667 on the sample; E7-2 repeats it on the real screens | e2e/build.spec.ts, stories/E7-2 | Nothing to see until E7-2. |
| 2026-10-03 | The preview's chapter row is a picture (About you, the areas, Wrap up); free navigation and the two desktop card columns come with E7-4 and E7-2 | build/preview-panel.tsx | The preview is phone-only. |
| 2026-10-03 | The ring on the chapter row is always on in the chapters and item layouts; the page layout has no row to ring | build/preview-panel.tsx | Decision 0021 says "rings the chapter row when the layout changes". |
| 2026-10-03 | On a draft, the Scoring card saves the method, the switch, the labels and the layout together; a stale tab that changes only the layout writes its old method back (last write wins) | src/lib/instruments.ts saveScoring | Two PMs on the same draft at once. |

