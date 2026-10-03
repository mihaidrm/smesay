# Design note 28: reader versions on Shape, 2026-10-02

Story E4-3, on the Shape page of E4-2 (note 27). The PM app board (PmApp.dc.html, Shape)
draws each item with its reader version, the original under it, a pill and Accept, Reject
and Undo; this build follows it and adds Edit (decision 0031, item 8). Screenshots beside
the boards: shape-readers-desktop.png (after a run, every version suggested) and
shape-reader-edit-desktop.png (one version edited and so accepted).

## The row

Reference in mono, then the reader version at 15 px with "Original: ..." in 12 px muted
under it. On the right, stacked: the pill (Suggested in the pushed-back tint, Reader version
used in the agree tint, Original kept in the disagree tint, the status colours of the design
system), then Accept (primary, small), Edit (secondary, small) and Reject (secondary, small)
while suggested, or Undo (tertiary, teal) once decided; under them the "Placed by AI" or
"Moved by you" pill and the Move to select of E4-2. Edit swaps the buttons for a textarea
with the reader version, Save and Cancel; Save accepts the edited text, a blank one shows
"Write the readable version, or reject the suggestion to keep the original." in place. A
reader version that is the original again shows the sameAsOriginal line and no pill or
buttons. The title row gains Accept all and Reject all while suggested versions exist; each
turns into its confirm line with the count, the button and Cancel. The grouped line ends
with the counter, "[A] of [R] reader versions accepted.", where R counts the items whose
reader version differs from the original.

## Decisions taken here

- The one rule for which text an item shows is textFor() in src/lib/item-text.ts, with no
  database import: the reader version only where the status is accepted, the original
  everywhere else (decision 0009, item 2). The preview (E5-6) and the respondent side (E7)
  read it, so a suggested version can never reach a respondent.
- Undo returns an item to suggested with the text it carries. After an edit, the model's
  wording is gone; Undo keeps the edited text as the suggestion. Run again replaces the
  suggested versions and leaves accepted and rejected ones alone (E4-2's apply).
- An edit that writes the original's own words back (whitespace aside) is a rejection: the
  original is kept and the model's wording stays as the suggestion for Undo, so no item ends
  up with an identical "accepted" version and no way back (the audit's note 7). Edits are
  capped at 1,000 characters, the model's own cap.
- Accept all and Reject all touch the latest set's suggested versions only, in one update
  each (the story's note). The ids come from the same rule the page counts with
  (hasReaderVersion, whitespace folded), so the confirmed count is what the update touches;
  versions equal to the original and blank ones are skipped. The model's reader text is
  stored with its whitespace folded, and an answer with a blank version is refused.
- Accept and Reject apply only while the row is still suggested, Undo only while it is
  decided: a decision pressed on a stale page changes nothing and the page redraws from
  the server. A Run again between the page load and an Accept still swaps the suggested
  text under the PM: the row keeps its status, so the new text is accepted unseen. Rare,
  and visible on the redraw; a text check on the decision would close it.
- The sample project shows its reader versions as accepted (the seed), with the pills and
  no controls; its counter reads "6 of 6".
- Items without a reader version (a set never shaped) show the original alone; the server
  refuses a decision on them with its own line (docs/copy/errors.md).
- The row's client state is keyed by the server's text and status, so a saved decision or
  edit closes it; the edit form is its own component, mounted while editing, so Cancel drops
  a shown error; the Accept all and Reject all control is keyed by the suggested count, so a
  change on the server closes an open confirm line (MISTAKES.md).

## Open for Mihai

The copy was accepted on 2026-10-03 (decision 0037, point 2).

- The copy of this story (docs/copy/app.md, Shape, and the two Shaping rows in errors.md)
  waits for your acceptance.
- "Continue" to Build still waits for E5-1.
