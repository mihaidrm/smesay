# Assets to buy or fetch for design v2

Decision 0041: Claude searches and lists, Mihai buys and hands the files over, Claude places
them. Budget EUR 60 for everything here. Prices as read on 2026-10-03; licences as the pages
state them. Nothing on this list is needed for the boards or the code to work: every slot
has a placeholder with the same frame. This is the full list; nothing else is needed for
design v2.

## To buy (one item)

Mihai asked on 2026-10-03 for something ready-made instead of a Fiverr commission. The
shortlist, read the same day; prices in US dollars as the pages show them, before VAT.

| # | What | Where it goes | Links | Licence | Price | Status |
|---|---|---|---|---|---|---|
| 1 | Placed 2026-10-03: the Robot Vector Collection (Smashing Stocks via Craftwork, USD 14, https://craftwork.design/product/robot-vector-collection), bought by Mihai; the round-headed robot in four poses, hi, idea, reading, analysis, recoloured to the violet, in public/assets/mascot/ with LICENCE.txt. The receipt is still to be added beside the files. The shortlist below is history | sign-in, the landing hero, the Projects empty state (idea), Import (reading) and Results (analysis) empty states, the respondent thank-you | https://craftwork.design/product/robot-vector-collection | Craftwork commercial licence (https://craftwork.design/license) | 14, paid | placed (design note 37) |
| 1a | Roger (or Albert), one flat vector character in 140 (125) premade poses: 70 gestures and 70 (55) concept scenes, SVG, AI, EPS and PNG, with a symbol library for recolouring. Recommended: ready files, no tool needed, the jacket recoloured to violet in the SVG when placed | Landing hero (over the live card), sign-in page, the empty states of Projects, Import and Results, the respondent thank-you screen | https://www.animationguides.com/downloads/roger-illustrations-pack/ , https://www.animationguides.com/downloads/albert-illustrations-pack/ | Standard licence; the page says attribution is optional. The licence page could not be opened from this session (404 on /license/), so read the Standard and Extended terms at checkout: the Standard must allow a commercial web app; Extended is 99.90 and not needed for one product | 24.90 | to choose |
| 1b | Superhuman Constructor, a 3D character built in Figma from parts, 9 prebuilt poses and the constructor for more, PNG export at 2x from Figma | same slots | https://craftwork.design/product/superhuman | Commercial licence: own and client projects without limit, teams up to 20, no resale of the files, no logo use (https://craftwork.design/license) | 48 | alternative if a 3D look is wanted and Figma is at hand |
| 1c | Techno Geek, one robot-like character in 10 preset poses, AI, EPS and PNG, parts rearrangeable (from 2016) | same slots | https://creativemarket.com/bagstudio/626669-Techno-Geek-Vector-Mascot-Pack | Creative Market Commercial licence | 18 | cheapest, dated style |
| 1d | Open Peeps, hand-drawn people from mixable parts, busts, standing and sitting, SVG and PNG | same slots | https://www.openpeeps.com | CC0, commercial use without attribution | free | fallback, sketchy style against the rounded violet look |

Looked at and left out: the Fiverr gigs of the first list (a commission, which Mihai does not
want); getillustrations.com packs (the 3D clay mascot pack at 55 and the character packs
could not be opened from this session, 403); UI8 packs (prices load only in the browser);
Creative Market "Friendly Outdoor Mascot Characters" at 17 (several different animals, not
one character); Mascot Maker toolkits at 39 to 49 (vintage sports style); SVG Mascot (an AI
generator, licence of the output unclear); Blush (a subscription, and its pricing page could
not be opened).

What the files must satisfy whichever is chosen: one character, at least two poses (waving
or greeting, pointing right), readable on light #F7F6FB and dark #16152A, PNG at 2x on a
transparent ground or SVG. Claude recolours the SVG's fills to the brand violet #6D4CF5 with
a coral #FF6B57 detail when placing it, which is placement, not drawing.

## Free, licence allows commercial use

| # | What | Where it goes | Links | Licence | Price | Status |
|---|---|---|---|---|---|---|
| 2 | Spot illustrations, recoloured to violet #6D4CF5 on the site before download: "File sync" or "Add files" (Import empty state), "Data" or "Charts" (Results empty state), "Team" (Projects empty state), "Done" or "Completed" (respondent thank-you, beside the mascot) | Landing "three steps", the three empty states, the thank-you screen | https://undraw.co/illustrations (search the names above; set the colour in the top bar) | https://undraw.co/license : commercial use, no attribution | free | to pick, Claude can pick |
| 3 | Icon set: Lucide, already in the app, for the sidebar and everything else; Phosphor Duotone (https://phosphoricons.com , https://www.npmjs.com/package/@phosphor-icons/react , MIT, last release 2025-05-22) only if a duotone look is wanted later for the stat tiles | PM app sidebar, settings cards | https://lucide.dev | ISC | free | in use (design note 34) |
| 4 | Typeface: Plus Jakarta Sans, weights 400 to 800 | Everything but mono | https://fonts.google.com/specimen/Plus+Jakarta+Sans , loaded by next/font/google | SIL Open Font License 1.1 | free | placed (design note 34) |
| 5 | Mono: Geist Mono, already in the app | References, counts, timestamps | https://vercel.com/font | SIL OFL | free | ready |
| 6 | App icon and favicon, from the mark on Brand01 (no purchase; Claude exports the sizes) | Browser tab, phone home screen | made from docs/design-notes/prototype-01/Logo.dc.html | ours | free | Claude makes |
| 7 | Social preview image (Open Graph), a product screen on the aurora ground | Links shared in chat and on LinkedIn | made from the landing board | ours | free | Claude makes |

Total paid: USD 14 for the Robot Vector Collection; nothing else to buy.

Looked at and left out: Storyset (Freepik) is free with attribution and USD 7.49 a month
without it (https://storyset.com), a running cost for one illustration family; Icons8
illustrations and 3D icons are USD 24 a month for 25 downloads
(https://icons8.com/pricing), which with the mascot passes the budget; a Lottie animation
pack was not needed, the motion is CSS. Any of these comes back if the unDraw set reads too
generic on the real pages.

Not assets, listed so the picture is complete: the service accounts and their costs are in
docs/accounts.md (the domain EUR 10 to 40 a year, Plausible EUR 9 a month, Vercel's paid
plan about EUR 20 a month before the first external user; the rest on free tiers).

## When a file arrives

1. Mihai puts it under `public/assets/` (never under docs/) with the licence or receipt as a
   text file beside it (`mascot-waving.svg`, `mascot-licence.txt`).
2. Claude swaps the placeholder for the file in one commit, same frame, both modes, and marks
   the row above "placed".
3. The licence file is listed in docs/accounts.md under step 12, so the paper trail is in one
   place.

Placeholders today: none for the mascot (placed); the
spot illustrations are dashed frames with a one-line caption; icons are Lucide.
