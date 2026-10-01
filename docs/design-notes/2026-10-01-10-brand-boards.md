# Design note 10: brand and design system boards built, 2026-10-01

Made in the Claude Code cloud session of 2026-10-01 after Mihai asked for a separate area on the
canvas with colours, themes and brand material. Built from note 09 (the analysis) with its
three recommendations applied, which Mihai can reverse:

1. Unclear is #7C3AED (was #6B46C1). The five status colours now pass the colour-vision check
   as a set.
2. No dark mode in R1. The dark tokens are listed on Brand 02 as a mapping.
3. The favicon is mark B without the baseline.

## What is on the canvas

Six boards in a row titled "Brand and design system", to the right of the current boards and
above the superseded landing pages, at x 3200. Files in docs/design-notes/prototype-01/.

| Board | Size | Holds |
|---|---|---|
| Brand01, identity | 1440 by 1000 | lockups on white, ink, teal, greige; mark and wordmark alone; clear space; minimum sizes; favicon at 16, 32, 64; six misuses; the "Powered by" rule on the respondent side |
| Brand02, colour | 1440 by 1300 | nine neutrals; teal 50 to 900; five status colours with solid, tint, text and computed ratios; ten text-pair ratios; dark-mode mapping |
| Brand03, type | 1440 by 1320 | ten-step scale with line height, tracking, weight; three bases; mono rules; email stack |
| Brand04, space, shape, layout | 1440 by 740 | spacing steps; four radii; elevation; widths; borders |
| Brand05, components | 1440 by 1040 | four button kinds in five states; inputs with focus and error; pills, toggle, progress, tabs; banner, toast, empty state; table row and card |
| Brand06, data, motion, theming, email | 1440 by 1140 | agreement strip, confidence histogram, group comparison; motion table; respondent theming with a failing accent; the sign-in email |

docs/design-system.md is the text twin (plan step 1.4). Every value on the boards is in it.

## Checks

- Each board rendered headless with the Geist font loaded; natural height measured and the
  frame set 40 px taller; no element wider than the frame.
- Contrast ratios on Brand02 are computed in the generator, not typed.
- Status set validated with the dataviz palette validator: all checks pass, worst adjacent
  pair 17.3.
- WRITING.md scan by grep: no em dashes, no banned words.

## Not done

- The prototypes still use the old unclear purple and radii 10, 16, 28. They move to the new
  values as each board is next touched, not in one sweep.
- The scaffold's styleguide page (plan step 2.3) is built from docs/design-system.md later.
