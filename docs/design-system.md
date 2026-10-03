# Design system

Version 2, written 2026-10-03 from decision 0041, design note 33 and the boards Brand07,
LandingF, PmAppV2 and RespondentV2 on the canvas (docs/design-notes/prototype-01/). Two modes,
a violet accent with coral, mint and sun, Plus Jakarta Sans, cards that float. The boards are
the picture; this file is the text the styleguide page and the Tailwind theme are built from.
Rendered at /styleguide (src/app/styleguide), values in src/lib/tokens.ts, theme in
src/app/globals.css. When they disagree, fix all the same day and say so in a design note.
Version 1 (teal, Geist, one mode, 2026-10-01) is in the history of this file and in design
notes 01 to 09 and 14; the implementation note of v2 is design note 34.

## Identity

- Name: SMEsay, provisional until the trademark database search (decisions 0005, 0012).
- Wordmark: "SMEsay" in Plus Jakarta Sans 800, tracking -0.02em, the ME in violet text (violet
  700 on light, violet 300 on dark and on the marketing navy).
- Mark B: two speech marks in a violet rounded square (radius 9 of 32), no baseline since v2.
- Lockups: horizontal (mark then wordmark, gap 10 at 24 px text), stacked, mark alone.
- The mark is violet on every ground. On a violet surface it is white with violet marks.
- Clear space: one mark width on every side. Minimum: lockup 16 px mark with 12 px text; mark
  alone 20 px.
- Favicon: the two speech marks at 16, 32 and 64 (docs/assets.md, row 6).
- Not allowed: rotation, gradients on the mark, other colours, outlines, stretching, ME not in
  violet.
- One tagline: "What the SMEs say." Footer expands SME once: subject matter expert.
- Respondent side: the PM's logo and name take the header; SMEsay appears once as "Powered by",
  smallest lockup. Always shown on the Free plan.
- The mascot (bought, docs/assets.md row 1) stands in the hero, on sign-in, in the empty states
  and on the respondent thank-you; until it arrives a violet blob with the two speech marks
  holds the frame (src/components/app/mascot.tsx).

## Colour

Every colour is one token with a light and a dark value (src/app/globals.css: `:root` and
`.dark`). Components use the token name; the mode switches the value. Neutrals:

| Token | Light | Dark | Use |
|---|---|---|---|
| ground | #F7F6FB | #16152A | page background |
| surface | #FFFFFF | #1E1D33 | cards, the sidebar, inputs, pills |
| raised | #FFFFFF | #27263F | rows inside a card |
| tint | #F7F6FB | #27263F | table header, hovered row, the segmented track, the workspace chip |
| hairline | #E6E3F0 | #343252 | borders, dividers |
| hairline-strong | #CFCBE0 | #46445F | input borders, secondary buttons, dashed frames |
| ink | #15131F | #F3F1FA | text |
| ink-soft | #3E3A54 | #D4D0E4 | body on marketing, neutral pill text |
| ink-muted | #5E5A72 | #A8A4BE | secondary text |
| placeholder | #8C88A3 | #7D7996 | placeholder text only |
| danger | #9B2C2C | #FF8A78 | error text and the destructive button |

The four colours, each as solid (decorative: bars, dots, tiles, the mark), text (reads on the
surface and on its soft) and soft (a pill or chip fill):

| Token | Light solid, text, soft | Dark solid, text, soft | Use |
|---|---|---|---|
| violet | #6D4CF5, #5A3BE0, #EEEAFF | #9B86FF, #B8A8FF, #2E2B55 | the brand: links, focus rings, the selected state, the active nav item, the primary button, the mark |
| coral | #FF6B57, #9E3321, #FFE9E5 | #FF8A78, #FF8A78, #3A2230 | counts, the disagreement view, what needs attention |
| mint | #1F9D7A, #166A52, #E1F5EE | #5FD3B3, #5FD3B3, #15302B | saved, agreed, a done step, the reader version used |
| sun | #F5B740, #8A5A00, #FFF3D6 | #FFD36E, #FFD36E, #3A2F14 | pushed back, the ambiguity dot |

Two gradients and no more: the primary button (135deg #7A5CFF, #6D4CF5 at 60 percent, #5A3BE0,
with the glow 0 8px 20px rgba(109,76,245,0.35)) and the marketing hero's aurora (violet, coral
and sun at low opacity on the navy). The ambiguity banner and the sample card sit on a soft
violet to surface gradient. Never a gradient on text inside the app. None of the four colours
is used for data.

Status colours, fixed across the product, each shown with its word, never colour alone. Light
as v1; on dark the solid lifts to read on the surface and doubles as the pill's text.

| Status | Light solid, tint, text, ratio | Dark solid and text, tint, ratio on tint, on surface |
|---|---|---|
| Agree | #2F855A, #E6F4EC, #22643F, 6.25 | #6CCB95, #14332A, 6.91, 8.30 |
| Pushed back | #B7791F, #FBF1DC, #7A5210, 6.15 | #E8B45A, #3A2F14, 6.96, 8.69 |
| Unclear | #7C3AED, #EEE8FA, #4C2F94, 8.20 | #B794F6, #2E2347, 5.93, 6.71 |
| Missing | #2B6CB0, #E3EEF9, #1F4F7A, 7.27 | #6FA8E6, #1B2E44, 5.54, 6.58 |
| Disagree (was not needed, decision 0014) | #718096, #F0F0EE, #454A52, 7.82 | #A0AEC0, #2A2F3A, 5.94, 7.28 |

Not answered (respondent review, tracker): surface fill, dashed strong hairline, muted text. It
is an absence, not a status, so it never takes a status colour. Solid pushed back and solid
disagree are never text on light. The reader pills on Shape: Suggested in violet soft and text,
Reader version used in mint soft and text, Original kept in the disagree tint and text.

Text contrast, computed with src/lib/contrast.ts and asserted in src/lib/contrast.test.ts.
Light: ink on ground 17.06, muted on surface 6.60, muted on ground 6.14, soft on surface 10.84,
violet on surface 5.25, violet text on surface 6.69, white on violet 5.25, violet text on its
soft 5.69, coral text on its soft 6.12, mint text on its soft 5.75, sun text on its soft 5.37,
danger on surface 7.53. Dark: ink on ground 15.98, muted on surface 6.82, muted on raised 6.07,
violet on surface 5.67, violet text on surface 7.89, violet text on its soft 6.33, coral on its
soft 6.31, mint on its soft 7.69, sun on its soft 9.27, danger on surface 7.16, the dark ground
as text on the violet (the primary button's label on dark) 6.17. Hairline-strong is never text
(1.58).

Modes: the PM app and the admin area follow the system setting with a toggle at the bottom of
the sidebar (src/components/app/mode-toggle.tsx; the choice is kept in the browser). The
landing page has a dark hero and pricing with light sections between. The respondent side
follows the phone's setting; the PM's accent still marks the selected answer, the active
chapter and the progress bar (decision 0016), lifted two steps on dark. With no accent set the
respondent side uses violet 600 (src/lib/brand-rules.ts).

## Type

Plus Jakarta Sans, SIL Open Font License 1.1, loaded through next/font/google and served from
the app's own build (no request to Google Fonts from product pages). Weights 400, 500, 600,
700, 800. Geist Mono (SIL OFL) for references, counts, progress, timestamps and dashboard
numerals, tabular figures. Never mono for labels, buttons, headings or body. Eyebrows in
sentence case; no uppercase with wide tracking.

| Size | Line height | Tracking | Weight | Use |
|---|---|---|---|---|
| 66 | 68 | -0.04em | 800 | marketing headline (40 on a phone) |
| 44 | 48 | -0.035em | 800 | section heading |
| 30 | 36 | -0.03em | 800 | page title in the app, the stat tile's number (mono) |
| 24 | 30 | -0.03em | 800 | project title, respondent screen title |
| 20 | 26 | -0.02em | 700 | lead paragraph, step title |
| 17 | 26 | -0.01em | 400 | respondent body, marketing body; item text in cards at 600, line 23 |
| 16 | 24 | 0 | 400 | marketing small body, email body |
| 15 | 24 | 0 | 400 | app body; area title at 700 |
| 14 | 20 | 0 | 400 | tables, controls, item rows; buttons at 600 |
| 13 | 18 | 0 | 400 | app secondary, captions, breadcrumbs |
| 12 | 16 | 0 | 400 | labels, mono references, timestamps; pills at 600 |

Bases: PM app 15, respondent 17, marketing 17 and 20. Email stack: -apple-system, "Segoe UI",
Roboto, Helvetica, Arial, sans-serif, body 16 on 24; Mihai checks Gmail, Outlook web and Apple
Mail (decision 0004).

## Space, shape, layout

- Grid 4 px. Steps 4, 8, 12, 16, 24, 32, 48, 64, 96. Inside a component 4 to 12, between
  components 16 and 24, between sections 48 and 64 in the app, 96 on marketing.
- Radii, four: 12 (controls, inputs, rows, nav items, menus), 16 (cards), 20 (marketing cards,
  panels, the sign-in card), 999 (buttons, pills, the stepper, avatars). Tailwind: rounded-md
  and rounded-lg are 12, rounded-xl 16, rounded-2xl 20.
- Shadows: the card, 0 12px 32px rgba(45,32,110,0.10) on light and rgba(0,0,0,0.45) on dark,
  on every card, the active segment and menus; the glow under the primary button; the toast at
  0 12px 32px rgba(0,0,0,0.45). A hovered card lifts 2 px with the deeper shadow (marketing:
  3 px).
- Borders: hairline 1 px on cards and rows; hairline-strong 1 px on inputs, secondary buttons
  and dashed frames; violet 1.5 px on the one highlighted object on a screen (a card being
  dropped on, the selected item). No left-edge-only borders. No two-tone borders.
- Widths: marketing column 1120 in 1440; app sidebar 248 plus fluid content to 1440; respondent
  390 with 20 px gutters; email 600. Table header 36, rows 40 (the project list 52). Respondent
  tap targets 48.

## Motion

Design note 33, Motion: cards lift 2 px on hover; buttons lift 2 px over 150 ms, the primary's
glow deepens, the secondary fills violet soft, pressed drops back in 60 ms; the live dot pulses
every 2.2 s; the stepper's active pill and the mode toggle's thumb slide over 150 to 250 ms;
progress bars fill over 250 ms; a changed dashboard cell fades over 400 ms. On marketing,
sections rise 18 px once, the mascot floats and a light follows the cursor over the dark
sections. Everything stops under prefers-reduced-motion. No counters that spin.

## Components

Built on shadcn/ui restyled to these tokens (decision 0001). Every component has rest, hover,
focus, loading and disabled, plus empty and error where they apply (build rules).

- Buttons: primary (the violet gradient pill with the glow, white text, weight 600), secondary
  (surface pill, hairline-strong, fills violet soft on hover), tertiary (underlined link in
  violet text), destructive (surface pill, danger border and text, coral soft on hover). Height
  40 in the app, 48 on the respondent side and marketing, 32 small. Verbs as labels. One
  primary per screen.
- Focus: 2 px violet ring, 2 px offset, on keyboard focus (focus-visible) on every control.
  Loading: a 14 px ring spinner before the label, the label stays. Disabled: the same control
  at 40 percent opacity, never grey on grey.
- Inputs: 40 high, hairline-strong, radius 12, surface fill, placeholder token (placeholder
  only, never for real text). Focus as buttons. Error: danger border and a message in danger
  saying what happened and what to do next.
- Status pills: tint fill, text colour from the table, 12 px weight 600, height 24, radius 999.
  Neutral pill: tint fill, soft ink. Count badge (nav): coral fill, dark text, 11 px 700.
- Toggle 36 by 20, violet when on, hairline-strong when off, a white thumb. Progress bar 4 px,
  violet fill (the PM's accent on the respondent side), label and mono count above. Tabs:
  14 px, active ink with a 2 px violet underline. Segmented control: tint track, the active
  option a surface pill with the card shadow.
- Banner (the ambiguity flag): a card on the soft violet gradient with a sun dot, ink text, a
  secondary Dismiss pill. Toast: dark surface, light text, violet 300 action, the toast shadow.
  Empty state: a dashed card with a title at 18 px 700, one line that says what to do and the
  mascot where the screen is a first visit (Projects, Import, Results).
- Table: header 36 at 12 px muted 600, no fill; rows 40 with a hairline above; hovered row
  tint. Card: radius 16, hairline, the card shadow, 16 padding, title 15 weight 700 with a mono
  count beside it when there is one. Item row (Shape, the respondent cards' list form): raised
  surface, hairline, radius 12, 12 by 14 padding.
- Stat tile: a card with the number at 30 px 800 in mono and a 13 px muted label; the number in
  ink, violet text, mint or sun by what it counts.
- Sidebar: 248 wide on the surface; the lockup at 17 px; the workspace chip on the tint with
  the initials tile (coral to sun); nav items 40 high, radius 12, icon 18 px (Lucide), the
  current one on violet soft in violet text; the sample card on the soft violet gradient; the
  mode toggle; the signed-in email and Sign out.
- Stepper: pills on a surface track, the current step a violet pill with a white circle and a
  violet number, a done step a mint circle with a dark tick, a coming step muted with a
  hairline-strong circle.
- Tiles: the workspace's initials and a project's colour (one of four gradients picked by the
  name; the sample a dashed outline) are decoration beside the written name, never the only
  mark.
