# E15-5 Measuring the guide: shown, dismissed, acted on, and the first-project funnel

User: Mihai deciding which tips stay
Status: ready
Outcome: every tip's shown, dismissed and acted-on counts, and the first-project path's
completion per week, on the admin page next to the funnel.

## Acceptance criteria
1. Three events in E13-1's catalogue: guide_shown (tip id), guide_dismissed (tip id),
   guide_acted (tip id); guide_shown is logged once per tip per person per day at most, so a
   card on every page load does not inflate the count.
2. The admin page (E13-2) gains a table "Guide": tip id, shown, dismissed, acted on, acted on
   over shown, for the last 30 days; tips with more dismissals than actions are marked "to
   review" (E15-4, acceptance 3).
3. The first-project funnel: per sign-up week, how many people ticked Import, Shape, Build,
   Share (E15-2's rule from the data) and the median time from sign-up to the first published
   link; shown as a row under the existing funnel table. The Userpilot 2025 benchmark figures
   (activation 37.5 percent, checklist completion 19.2 percent; design note 39) are printed
   under the table as the comparison, with the source named.
4. The target for R1 is not a number: the first ten real sign-ups set the baseline; this
   story records it in docs/plan-steps.md on acceptance.
5. Unit test: the once-per-day rule and the "to review" mark on fixed rows. The funnel query
   runs in SQL; 10,000 events under 500 ms (one measurement, decision 0004).

## Out of scope
- A/B tests of tip wording: not with the first users.

## Open questions
- None.

## Technical notes
Events through E13-1's tracking function with the catalogue extended; the funnel is one
query in src/db/queries/analytics.ts grouped by sign-up week, reading the same tables as
E15-2's state rule so the two cannot disagree.
