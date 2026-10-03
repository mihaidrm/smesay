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

