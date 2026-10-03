# Assets to buy or fetch for design v2

Decision 0041: Claude searches and lists, Mihai buys and hands the files over, Claude places
them. Budget EUR 60 for everything here. Prices as read on 2026-10-03; licences as the pages
state them. Nothing on this list is needed for the boards or the code to work: every slot
has a placeholder with the same frame. This is the full list; nothing else is needed for
design v2.

## To buy (one item)

| # | What | Where it goes | Links | Licence | Price | Status |
|---|---|---|---|---|---|---|
| 1 | Mascot: one character, two poses (waving, pointing), vector (SVG or AI) plus PNG at 2x on a transparent ground, readable on light #F7F6FB and dark #16152A; a friendly shape, no company logo in it | Landing hero (over the live card), sign-in page, the empty states of Projects, Import and Results, the respondent thank-you screen | Fiverr search: https://www.fiverr.com/search/gigs?query=mascot%20character%20design ; three gigs found 2026-10-03: https://fiverr.com/kayrex/character-design-mascot-design , https://fiverr.com/abcr8tive/create-a-custom-character-or-mascot-illustration , https://fiverr.com/rusmadji/make-cute-animal-mascot-for-you | Add the gig's "commercial use" and "source file" extras; keep the receipt and the order page as the licence | about USD 50 to 60 at the entry tier (listings run from under 50 to 600) | to buy |

Brief to paste into the order: "A small friendly mascot for a web app called SMEsay that
collects opinions from experts. Two poses: waving, pointing to the right. Flat vector style,
rounded shapes, main colour violet #6D4CF5 with a coral #FF6B57 detail, no text, no logo.
Deliver SVG and PNG at 2x on a transparent background. It must read on a white and on a dark
navy background."

## Free, licence allows commercial use

| # | What | Where it goes | Links | Licence | Price | Status |
|---|---|---|---|---|---|---|
| 2 | Spot illustrations, recoloured to violet #6D4CF5 on the site before download: "File sync" or "Add files" (Import empty state), "Data" or "Charts" (Results empty state), "Team" (Projects empty state), "Done" or "Completed" (respondent thank-you, beside the mascot) | Landing "three steps", the three empty states, the thank-you screen | https://undraw.co/illustrations (search the names above; set the colour in the top bar) | https://undraw.co/license : commercial use, no attribution | free | to pick, Claude can pick |
| 3 | Icon set: Lucide, already in the app, for the sidebar and everything else; Phosphor Duotone (https://phosphoricons.com , https://www.npmjs.com/package/@phosphor-icons/react , MIT, last release 2025-05-22) only if a duotone look is wanted later for the stat tiles | PM app sidebar, settings cards | https://lucide.dev | ISC | free | in use (design note 34) |
| 4 | Typeface: Plus Jakarta Sans, weights 400 to 800 | Everything but mono | https://fonts.google.com/specimen/Plus+Jakarta+Sans , loaded by next/font/google | SIL Open Font License 1.1 | free | placed (design note 34) |
| 5 | Mono: Geist Mono, already in the app | References, counts, timestamps | https://vercel.com/font | SIL OFL | free | ready |
| 6 | App icon and favicon, from the mark on Brand01 (no purchase; Claude exports the sizes) | Browser tab, phone home screen | made from docs/design-notes/prototype-01/Logo.dc.html | ours | free | Claude makes |
| 7 | Social preview image (Open Graph), a product screen on the aurora ground | Links shared in chat and on LinkedIn | made from the landing board | ours | free | Claude makes |

Total to pay: about EUR 50 to 55 for the mascot, nothing else.

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

Placeholders today: the mascot is a violet blob with two eyes and a smile (CSS, no file); the
spot illustrations are dashed frames with a one-line caption; icons are Lucide.
