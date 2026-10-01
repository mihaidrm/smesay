# Design note 05: landing page B and motion, 2026-09-30

Made in a Claude Code session with Mihai, after his feedback on note 04.

## Feedback from Mihai

1. The first landing page (now "A") follows duna.com too closely. Duna was an example of the
   quality wanted, not a template to follow.
2. Duna has many animations. Screenshots do not show them. A page at that level needs motion.

Direction from now on: Duna sets the bar for restraint and finish. The layout, the ideas and the
motion of our page come from our product.

## Motion observed on duna.com

Read from the live page by sampling element styles over time, not from screenshots.

| Where | What moves | Timing |
|---|---|---|
| Every block | Fades in and rises 16 to 20 px when it scrolls into view | About 79 elements start hidden |
| Product sections | The feature list opens the next item by itself; the picture beside it cross-fades to match | A change every 4 seconds, about half a second each |
| Logo strip | Slides sideways without stopping | About 70 px per second |
| Big numerals | Two stacked copies of each number, one hidden, used for a reveal | On scroll into view |

Not confirmed: hover states and the navigation menu animation were not measured.

## Landing page B

Board "Landing page B (own layout, animated)" on the canvas
https://claude.ai/artifact/Y7ZpX3JPahVt8shJDzQx5d, 1440 by 5,052 px.
Source: docs/design-notes/prototype-01/LandingB.dc.html. Rendered in a browser at 1440 px; no
section overflows; 33 animations running.

The idea: the page shows a validation happening, instead of describing one.

| Section | Layout | Motion |
|---|---|---|
| Hero | Headline left, a live panel right. No image band, nothing centred. | Text rises in on load. In the panel five answers arrive one by one, the agreement bar fills, then a suggested action appears. 13 second loop. |
| Three steps | Three step labels with a progress line each, one large panel under them | The line fills, the panel cross-fades to the next step. 5 seconds per step. |
| Reasons | Dark band, two rows of real-looking reasons and questions | The rows slide in opposite directions without stopping |
| Results | Text and a list left, the agreement chart right | The bars grow from the left, one after another. A live dot pulses. |
| Actions | Three cards | The cards rise in one after another |
| Pricing | One bordered table with four columns | None |
| Closing | One teal panel with two buttons | None |
| Footer | Light, three link columns | None |

What stays from notes 01 to 04: Geist, the neutrals, black pill buttons, teal as the one accent,
the data colours, the mocked veterinary data.

What is dropped from page A: the image band and hill shapes, the centred hero, the logo strip,
the three big numerals, the quote card, the repeated label-heading-card sections, the dark footer.

## Reveal on scroll, added the same day

Mihai asked for the effect where elements float up while scrolling. Added to page B: every
section heading, panel and card below the hero starts 22 px lower and transparent, then rises
and fades in over 0.75 seconds when it enters the screen, once. Cards in a row are staggered by
0.12 seconds. The action cards use this instead of the timed loop. Checked in a browser at
1440 px: 14 blocks reveal in order as the page scrolls. Without scripting, or with "reduce
motion" on, everything is simply visible.

## Limits of the prototype motion

- Everything loops on a timer so it can be seen on a canvas. In the built site the same effects
  start when a section scrolls into view and run once, except the hero panel and the sliding rows.
- The three steps advance by themselves. In the built site a click on a step also selects it.
- With "reduce motion" switched on in the operating system, all of it stops and the page stays
  readable.

## For Mihai to decide

1. Page A, page B, or parts of each.
2. Headline on B: "Know where they agree before you build."
