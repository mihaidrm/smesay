# 0030 Partial responses on the dashboard, the evals key, an analytics epic, 2026-10-02

Decided by Mihai in the Claude Code cloud session of 2026-10-02, answering the list of open
questions.

1. Partial responses (docs/context.md item 1, carried by stories/E7-1 and E8-1). Unsubmitted
   answers reach the dashboard: the respondent shows as not submitted and their answers
   appear, marked as such. The PM has a switch to exclude unsubmitted answers from the charts
   and the tally. Mihai's words: "they show up as not answered, and the PM has an option to
   exclude them from charts and tally". Claude reads "not answered" as "not submitted" (the
   answers exist, the response does not); if Mihai meant something else, this file changes.
   Default of the switch: unsubmitted answers included, so what arrives is visible while the
   link is open. Whether a closed public link shows per-device state stays open (recommended:
   it shows nothing).
2. The Anthropic key for the evals job in CI (stories/E4-6): Mihai provides it when E4-6 is
   built and a real run is needed. Claude reminds him then. Not listed as an open question
   until then.
3. Analytics for Mihai, on the landing page and in the product: a new epic E13 with its own
   stories (E13-1 to E13-3) and a place in the plan after E12, before the launch gate. Plausible
   moves from E11-5 to E13-3; product events are first-party, in the database, with no
   personal data (SECURITY.md).

Consequence: stories E7-1, E8-1, E8-2, E8-3, E4-6, E11-5 updated; stories E13-1 to E13-3
written; stories/backlog.md, docs/plan-steps.md, the Roadmap board and docs/context.md updated.
