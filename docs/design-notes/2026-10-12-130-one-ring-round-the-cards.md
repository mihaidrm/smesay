# 130 One ring round the cards, 2026-10-12

Mihai, 2026-10-12, with the full-size preview of Import: "there is no gap between cards and
there is this border looking bad". Import ringed every card (2 px, 4 px offset) and the cards
sit 12 px apart, so two rings side by side met in the gap and read as one thick border
between the cards.

Decided:
- Import rings the cards' grid as one block (the same 2 px violet ring, 4 px offset, on the
  grid that holds the chapter's cards), beside the chapter row's ring. The step sets the
  cards as a set, so one ring says it, and no card loses its gap.
- The sun mark of a changed card (design note 128) stays on the card, at a 2 px offset, so two
  changed cards side by side keep 4 px between their rings.

Rejected:
- A wider grid gap while the cards are ringed: the preview would not match the live link.
- Dropping the card ring on Import: the caption says Import sets the cards, and the full view
  is where the rings live (decision 0061).

Checked: e2e/preview.spec.ts reads the ring on the grid and none on the card in Import's full
view.
