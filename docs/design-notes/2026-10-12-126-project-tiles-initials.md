# 126 Project tiles with initials on eight gradients, 2026-10-12

Mihai, 2026-10-12, with a screenshot of the Projects list: "whats up with the project icons
why are they all the same? Could we maybe do something fun and nice visually here?" His three
projects (YES, Test 1, BBC) showed the same mint to sun square.

Cause: the tile hashed the name with h * 31 + c and took the result modulo 4. 31 is 3 modulo
4, so the bucket was only the alternating sum of the character codes modulo 4; YES, Test 1
and BBC all came to 3. The tile had no other mark, so the three rows looked alike.

Decided:
- The tile shows the project's initials, by the workspace chip's rule (the first letter of the
  first two words, or two letters of a one-word name), in the dark ink at 12 px extrabold,
  centred in the 32 px square.
- Eight gradients from the palette's lifted tones (the dark mode's values of coral, sun, mint
  and lavender in globals.css): their six pairs, then coral and mint fading to their soft
  tints. The dark ink reads at 4.5 or better on every stop and every midpoint (WCAG 2.1,
  1.4.3), proved in tiles.test.ts; the old third gradient's violet (#7A5CFF) read at 4.19 and
  is gone.
- The gradient is picked by the project's id with FNV-1a (32 bit), not by the name, so a
  project keeps its colour through a rename. The 26 capital letters fill all eight buckets;
  YES, Test 1 and BBC land on two gradients with three different monograms.
- The sample's tile keeps its dashed outline, because it is not the workspace's own, and now
  carries its initials in muted ink, so the column reads as one set.
- The tiles stay hidden from assistive technology; the name is written beside them, as the
  design system has always said.

Rejected:
- A colour or an icon the PM picks: a bought icon set (decision 0041) and a picker are a story
  of their own; recorded in docs/review-list.md for Mihai's call.
- Emoji as icons: they differ by operating system and are not from the bought assets.
- A better hash of the name: a rename would change the colour.

Checked: tiles.test.ts, 6 tests (initials, stability, eight gradients, the spread over the 26
letters and over the three names, contrast on every stop and midpoint); e2e/projects.spec.ts
renders the list.
