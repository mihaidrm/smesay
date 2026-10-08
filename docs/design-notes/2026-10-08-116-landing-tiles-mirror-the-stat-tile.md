# 116 The landing's result tiles mirror the product's stat tile, 2026-10-08

Mihai, 2026-10-08, with the five tiles of "What you get back" circled: "multiple issues on this
element in the landing page".

What was wrong (src/app/landing-page/results-demo.tsx, the Marlow results fragment of
stories/E12-1): the tiles put the label first and the number under it, so "Different
priority", the one label that wraps, pushed its 7 a line lower than the other numbers; the
five tiles shared the card's width equally from 1280 px, which left "5 of 7" at 30 px in a
mono font about 110 px wide in a tile with 90 px inside, so it ran to the tile's edge; and the
numbers were all ink, where the product colours them by tone.

Decided:
- The tiles mirror the product's StatTile (src/components/app/tiles.tsx, design note 34):
  the number first, the label under it, so every number sits on the same line whatever the
  label's length; the number in the text colour of the tile's tone (src/lib/results-tiles.ts:
  Submitted ink #15131F, Agreement mint #166A52, Different priority and Disagree sun #8A5A00,
  Unclear violet #5A3BE0), written out because the landing keeps its own light section
  (decision 0041, point 2).
- The number is 26 px on a phone and 28 px from 768 px (the product's 30 px has room in the
  dashboard's wider strip); the label stays 13 px.
- From 1280 px the five tiles share one row with the Submitted tile at 1.3 of the others'
  width (grid-template-columns 1.3fr and four 1fr), since "5 of 7" is the widest number; under
  it the rows stay three then two (from 640 px) and two per row on a phone.
- The words and the numbers are unchanged (docs/copy/landing.md, What you get back, tiles;
  the seed's numbers, decision 0062 keeps Different priority and Disagree apart).

Checked at 1440, 1280, 1024 and 390: every number fits inside its tile, every number's top
sits 11 px under the tile's top. e2e/landing.spec.ts keeps its text checks on the tiles.
