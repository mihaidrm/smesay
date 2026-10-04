# E9-2 Mark an action done or dismissed; regeneration does not resurrect a dismissed action

User: a PM working through the list
Status: ready
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
insight.state, plus `closed_at` and `closed_by` added in migration 0002 for the date and the
export.
