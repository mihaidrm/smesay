# E4-4 Duplicate and ambiguity flags

User: a PM who wants to fix a list before 40 people read it
Status: ready
Outcome: near-duplicates and items that do not say enough are flagged, each flag links to the
items involved, and a dismissed flag stays dismissed.

## Acceptance criteria
1. The ambiguity banner on Shape (PM app board): "Ambiguity in [REF]. [What the item does not
   say]. Respondents may mark it unclear." with Dismiss. One banner per flagged item, stacked;
   the item card carries the same note.
2. Duplicate flags name both items ("CL-02 may duplicate CL-05") and link to each; the PM can
   dismiss or, in R1, do nothing else (merging is a manual re-import).
3. Dismissing sets item.flags.dismissed and survives a re-run of shaping and a reload.
4. Flags are the model's, validated by the schema: a flag naming a reference that does not
   exist is dropped before display (SECURITY.md, output validated).
5. The golden set runner checks that the ambiguous items in each spec are flagged and that
   the duplicate pairs (01 and 08) are either merged with must_keep intact or flagged.

## Out of scope
- Merging two items in the app: R2 candidate.

## Open questions
- None.

## Technical notes
ItemFlags in INTERFACES.md: duplicateOf, ambiguity, dismissed. Exact duplicates never reach
this story (E3-5 folds them).
