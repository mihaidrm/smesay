# E9-2 Mark an action done or dismissed; regeneration does not resurrect a dismissed action

User: a PM working through the list
Status: built
Outcome: actions move to done or dismissed and stay there across runs.

## Acceptance criteria
1. Each open action has Mark done and Dismiss (PM app board); a closed action shows its state
   pill, greyed, with Reopen. Not on the sample, which is read-only (E8-8; E9-1 acceptance 7).
2. State is insight.state (open, done, dismissed; INTERFACES.md). A new run (E9-1) never
   creates an action that matches a dismissed one: matching is by the set of cited answer ids
   and kind; a test dismisses an action, runs again with the same output and sees it absent.
3. Done actions stay listed under "Done" with the date; the Actions tab label counts open
   ones only.
4. The PDF summary (E10-3) and the JSON export (E10-2) carry the state.

## Out of scope
- Assigning actions to people: R2.

## Open questions
- None.

## Technical notes
insight.state, plus `closed_at` and `closed_by` added in migration 0022 (not 0002) for the
date and the export.

Built 2026-10-04 (design note 67, decision 0044):
- Acceptance 1: each open action has Mark done (primary) and Dismiss; a done or dismissed one
  sits in its section, greyed, with its state and date in a pill and Reopen
  (results/action-controls.tsx, actions-tab.tsx); setActionState (src/lib/insights.ts)
  refuses the sample, an action that is not the project's and a state that is not one. The
  sample shows no controls.
- Acceptance 2: insight.state with closed_at and closed_by (migration 0022; a check keeps
  closed_at null exactly while open). A new run skips an action matching a dismissed one by
  kind and the sets of cited answers and missing items (sameAction; the missing items added
  so two coverage actions on different missing items do not match); src/lib/insights.test.ts
  dismisses one, runs again with the same output and sees it absent.
- Acceptance 3: the Done section lists each with "Done [DATE] UTC"; the tab's count is the
  open ones (results.numbers), tested in the e2e.
- Acceptance 4: the exports are E10-2 and E10-3, not built yet; insight.state, closed_at and
  closed_by are there for them, and their stories carry the criterion.
- Playwright: e2e/actions.spec.ts dismisses one, marks one done, reads the date and the tab
  count, reopens, writes again and sees the dismissed one stay out.

