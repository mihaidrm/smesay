# Design note 37: the mascot placed, 2026-10-03

Mihai did not want a commission or any of the ready-made shortlist and bought the Robot
Vector Collection (Smashing Stocks via Craftwork, USD 14, 75 flat outlined robots, SVG),
then uploaded the SVG folder to the repository for Claude to choose from.

## The choice

The round-headed robot with the ear discs and the antenna: it appears in four poses that
map onto the slots the design has, which no other character in the pack does.

- hi ("Talking Robot"): waving, with a "Hi.." bubble. Sign-in card, the landing hero, the
  respondent thank-you when E5 builds it.
- idea ("Robot Idea"): a light bulb on a wire. The Projects empty state (a tip: start one),
  and since 2026-10-03 the state where every project is archived and the sample is deleted
  (Mihai expected the robot there; the page was blank under the tiles).
- reading ("Robot Reading"): an open book. The Import empty state when Import has one.
- analysis ("Robot Analysis"): a chart on a screen at a desk. The Results empty state (E6).

Left out: the square-headed family ("Robot Waving", "Robot", "Robot Translator") reads well
but has two poses of use; "Bot" (both arms up) and "Cute Robot" are single poses.

## Placement

- The yellows of the pack (#FBAC02, #FBC606 and seven light yellows) are mapped to the
  brand violet (#5A3BE0, #7A5CFF, #6D4CF5) in the four files; the greys and the dark
  outlines stay. Nothing is redrawn (decision 0041).
- The robot sits on a light disc (#F7F6FB, hairline, the card shadow) in both modes, like a
  sticker, so its dark outlines read on the dark surface; 88 px on sign-in, 104 on the
  landing hero (floating 8 px over 6 s, no rotation now), 96 in an empty state.
- Decorative: empty alt, the page text carries the meaning; the SVG keeps a role and label
  for anyone who opens the file itself.
- Only the four files in use are in the repository, with LICENCE.txt beside them; the pack
  is licensed for use, not redistribution, and the repository holds nothing it does not
  use. The receipt is Mihai's to add beside the files. The 75-file upload and the
  Thumbs.db that came with it are removed in the same commit.
- The CSS placeholder (the blob) is gone; docs/assets.md row 1 says placed.
