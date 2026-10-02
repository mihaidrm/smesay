# E4-3 A reader version per item, the original kept and shown; Accept and Reject

User: a PM turning jargon into sentences their experts will read
Status: ready
Outcome: each item gets a plain-words version beside its original; nothing changes until the
PM presses Accept.

## Acceptance criteria
1. Each item on Shape shows the reader version above the original, with a pill: Suggested,
   Reader version used, Original kept (PM app board). Accept, Reject and Undo per item;
   "Accept all" and "Reject all" on one row at the top, each confirming the count.
2. No rewrite is applied without an explicit accept: the respondent instrument and the
   preview use reader_text only where reader_status is accepted, the original everywhere else
   (decision 0009 item 2). A test proves a suggested item renders its original.
3. original_text is never changed (E1-2 trigger). The item detail on Results and the respondent
   card's Details toggle show the original (decision 0018 item 3).
4. A reader version identical to the original shows "The readable version is the same as the
   original, so there is nothing to accept." and no buttons.
5. The counter "[N] of [M] reader versions accepted." sits under the row of buttons. Shape can
   be left at any time; Build works with whatever is accepted.
6. The golden set runner checks must_keep tokens survive in every reader version and that no
   negative is dropped (evals/README.md, scoring).
7. Edit: each item has "Edit" beside Accept; the reader text becomes an input, saving sets
   reader_status to accepted with the edited text, the original stays untouched (decision
   0031). A blank edit is refused with "Write the readable version, or reject the suggestion
   to keep the original."

## Out of scope
- Rewriting the original text: never (E1-2).

## Open questions
- None.

## Technical notes
Columns item.reader_text and item.reader_status (INTERFACES.md ReaderStatus). Accept all and
Reject all are one update each, scoped by set version.
