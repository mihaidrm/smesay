# Assets to buy or fetch for design v2

Decision 0041: Claude searches and lists, Mihai buys and hands the files over, Claude places
them. Budget EUR 60 for everything here. Prices as read on 2026-10-03; licences as the pages
state them. Nothing on this list is needed for the boards or the code to work: every slot
has a placeholder with the same frame.

| # | What | Where it goes | Source | Licence | Price | Status |
|---|---|---|---|---|---|---|
| 1 | Mascot: one character, two poses (waving, pointing), SVG or PNG at 2x, on a transparent ground, reads on light and dark | Landing hero, sign-in page, the empty states and the respondent "thank you" screen | A Fiverr mascot gig, e.g. fiverr.com/kayrex/character-design-mascot-design or fiverr.com/abcr8tive/create-a-custom-character-or-mascot-illustration; search "mascot character design", filter by vector delivery and commercial rights | Buy the commercial use and source file extras on the gig; keep the receipt | about USD 50 to 60 at the entry tier (the listings range from under 50 to 600) | to buy |
| 2 | Spot illustrations for the three steps and the empty states, recoloured to violet #6D4CF5 | Landing "three steps", Projects empty state, Import empty state, Results empty state | undraw.co, pick with the colour set to 6D4CF5 | unDraw licence: commercial use, no attribution required | free | to pick |
| 3 | Icon set beyond Lucide: a duotone family for the sidebar and the stat tiles | PM app sidebar, stat tiles, settings cards | phosphoricons.com (Duotone weight) through the npm package | MIT | free | to pick |
| 4 | Typeface: Plus Jakarta Sans, weights 400 to 800 | Everything but mono | fonts.google.com/specimen/Plus+Jakarta+Sans, loaded by next/font/google | SIL Open Font License 1.1 | free | ready |
| 5 | Mono stays: Geist Mono | References, counts, timestamps | Already in the app | SIL OFL | free | ready |

Total to pay: about EUR 50 to 55 for the mascot, nothing else. The rest is free under
licences that allow commercial use without attribution.

Alternatives looked at and left out: Storyset (Freepik) is free with attribution and USD 7.49
a month without it, a running cost for one illustration family; Icons8 illustrations are
USD 24 a month for 25 downloads, which with the mascot passes the budget. Both come back
if the unDraw set reads too generic on the real pages.

## When a file arrives

1. Mihai puts it under `public/assets/` (never under docs/) with the licence or receipt as a
   text file beside it (`mascot-waving.svg`, `mascot-licence.txt`).
2. Claude swaps the placeholder for the file in one commit, same frame, both modes, and marks
   the row above "placed".
3. The licence file is listed in docs/accounts.md under step 12, so the paper trail is in one
   place.

Placeholders today: the mascot is a violet blob with the two speech marks (CSS, no file); the
spot illustrations are dashed frames with a one-line caption; icons are Lucide.
