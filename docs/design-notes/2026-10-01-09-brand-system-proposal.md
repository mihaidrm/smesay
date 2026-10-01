# Design note 09: brand and design system, analysis and proposal, 2026-10-01

Status: proposal, waiting for Mihai's approval. Nothing on the canvas is built from it yet.
Made in the Claude Code cloud session of 2026-10-01. Inputs: design notes 01 to 08, the five
current boards rendered at their sizes with the Geist font loaded, docs/business-plan.pdf pages
15 to 17, WRITING.md, SECURITY.md, the palette validator from the dataviz skill. No external
site was looked at. Nothing client-derived.

## What was measured

Contrast (WCAG 2 ratio, text on background):

| Pair | Ratio | Verdict |
|---|---|---|
| Teal #0E6B63 on white | 6.36 | passes 4.5:1 |
| Teal on greige #ECEAE5 | 5.29 | passes |
| White on teal (closing panel) | 6.36 | passes |
| Muted ink #5B6069 on white | 6.32 | passes |
| Grey #8A8E96 on white (table headers in fragments) | 3.29 | fails for text under 24 px |
| Grey #C9C7C1 on white (arrows) | 1.69 | fine as decoration, never as text |
| Status tints, dark text on light fill (five pairs) | 6.15 to 8.20 | all pass |
| Solid pushed back #B7791F as text on white | 3.64 | fails; use only in bars and tints |
| Solid agree #2F855A as text on white | 4.54 | passes by 0.04; avoid as text |
| Mint #9BE7B4 on ink (AI label on dark cards) | 12.26 | passes |
| Teal on dark #111214 | 2.95 | fails; dark mode needs a lighter teal |

Data colours through the palette validator (light surface):

- Current five (agree #2F855A, pushed back #B7791F, unclear #6B46C1, missing #2B6CB0, not
  needed #718096): fails. Unclear and missing are 4.8 apart for deutan vision (red-green
  deficiency, the common one) and 12.0 for normal vision; the validator wants 15. The grey
  reads as grey, which is intended for "not needed" but means it never carries meaning alone.
- Unclear moved to #7C3AED, the rest unchanged: all checks pass (worst pair 17.3).
- Unclear moved to magenta #B83280: also passes (17.7). Further from the current purple.
- Dark surface: the current five fail the same way, and teal fails as text on dark.

Other findings from the renders:

- Radii in use on the marketing page: 10, 12, 16, 20, 28 px, plus 6 (PM) and 12 (respondent).
  Seven values where four would do.
- One shadow token exists (0 10px 28px at 8 percent ink) and is used consistently.
- Mono uppercase eyebrows with letter spacing appear above the hero and the "who it is for"
  cards. It is the one typographic habit on the page that reads as generated.
- Weights in use: 400, 500, 600. Headline letter spacing from -0.015em at 22 px to -0.045em
  at 64 px, which is right for Geist.
- Mark B (two speech marks on a line) is drawn at 64, 28 and 24 px. Nothing at 16 px, which is
  the favicon and the browser tab. The line under the marks is 2.5 units of 32, about 1.25 px
  at 16 px: it will blur.
- The respondent side has no theming rule yet. A PM can set any accent (E2 story); a yellow
  accent on white fails every contrast check.
- Email: web fonts are not reliably loaded by mail clients (unverified per client; Mihai tests
  Gmail, Outlook and Apple Mail per decision 0004). Emails need a system font stack.

## Proposal

Six boards in a "Brand and design system" row on the canvas, to the right of the current
boards (x 3200, y 0, above the superseded landing pages), each 1440 wide, plus
docs/design-system.md as the text twin (plan step 1.4). The boards are the reference
everything else is built from; the document is what the scaffold's styleguide page is built
from.

1. Identity. Wordmark D (ME in teal) and mark B. Lockups: horizontal, stacked, mark alone.
   On white, on ink, on teal, on a PM's own colour. Clear space one mark-width. Minimum sizes:
   lockup 96 px wide, mark 20 px. A 16 px favicon drawn as a simplified B (marks only, line
   dropped) shown at 1x and 2x. Misuse: no outline, no gradient, no rotation, teal never
   changed. Tagline line: "What the SMEs say" as the one tagline.
2. Colour. Neutrals (white, #F6F6F4, greige #ECEAE5, hairline #E6E4DF, muted #5B6069, ink
   #16181C). Teal as a 9-step scale with the brand step at 700 (#0E6B63) and the dark-mode
   step at 300 (near #9BE7B4), so teal exists for dark cards and the respondent progress bar.
   Status colours: agree, pushed back, unclear (#7C3AED, pending approval), missing, not
   needed, each with solid, tint and text variant and its contrast ratio printed beside it.
   Rules: teal never for data, status never alone (always a label), black for primary
   actions. Dark mode: tokens listed as a mapping, not built in R1 (see decisions).
3. Type. Geist Sans and Geist Mono (SIL OFL, free). Scale 12, 13, 14, 16, 17, 20, 24, 32,
   40, 64 with line height and letter spacing per step. Three contexts: PM app base 14,
   respondent base 17, marketing body 17 and 20. Weights 400, 500, 600 only. Mono for
   references, counts and timestamps, never for labels. Eyebrows in sentence case. Email
   stack: -apple-system, Segoe UI, Roboto, Helvetica, Arial.
4. Space, shape, elevation, layout. 4 px grid, spacing steps 4 to 96. Radii cut to four:
   6 (PM controls and rows), 12 (respondent cards, inputs), 20 (marketing cards and panels),
   999 (pills). One shadow. Hairline borders. Widths: marketing 1120 in 1440, app 1440 with
   240 sidebar, respondent 390 with 20 px gutters. Row height 36 in tables, tap targets 48.
5. Components. Buttons: primary (ink pill), secondary (white pill, hairline), tertiary
   (underlined link), destructive, disabled (primary at 40 percent, not grey on grey). Each
   with rest, hover, focus ring (2 px teal, 2 px offset), loading. Inputs, select, textarea
   with error state and message. Status pills. Cards. Table row. Tabs. Progress bar. Toggle.
   Banner (the ambiguity flag). Toast. Empty state. Every state the build rules require.
6. Data, motion, respondent theming, email. Charts: stacked agreement bar, histogram, the
   two-group comparison bars, with 2 px gaps and direct labels; no pie. Live update fades the
   changed cell. Motion: 150 ms state, 250 ms transition, 750 ms reveal, reduced motion off.
   Respondent theming: the PM's logo replaces the mark, the PM's accent is used on the
   progress bar and the focus ring only, buttons stay ink, and an accent under 4.5:1 on white
   falls back to ink with a notice in settings. Email: header, body, button, footer, in the
   system stack, 600 px wide.

Not proposed: an illustration style (decision 0004), a second typeface, a second accent,
a dark mode in R1.

## Decisions for Mihai

1. The six boards and the document, as listed. Build order: 2, 3, 1, 4, 5, 6.
2. Unclear changes from #6B46C1 to #7C3AED so unclear and missing can be told apart by people
   with red-green colour deficiency. Recommended. Magenta #B83280 is the alternative.
3. No dark mode in R1. Tokens are defined so it is a mapping later. Recommended.
4. Favicon: simplified mark B without the line. Recommended over a lettermark "S".
