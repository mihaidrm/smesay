# Design system

Written 2026-10-01 from design notes 01 to 09 and the six brand boards on the canvas
(Brand01 to Brand06 in docs/design-notes/prototype-01/). The boards are the picture; this file
is the text the scaffold's styleguide page and the Tailwind theme are built from. When the two
disagree, fix both the same day and say so in a design note.

## Identity

- Name: SMEsay, provisional until the trademark database search (decisions 0005, 0012).
- Wordmark D: "SMEsay" in Geist 600, tracking -0.03em, the ME in teal 700 (teal 300 on ink).
- Mark B: two speech marks on a shared baseline in a teal rounded square (radius 8 of 32).
- Lockups: horizontal (mark then wordmark, gap 10 at 24 px text), stacked, mark alone.
- On white and greige: mark teal, ME teal. On ink: mark white, ME teal 300. On teal: all white.
- Clear space: one mark width on every side. Minimum: lockup 16 px mark with 12 px text; mark
  alone 20 px.
- Favicon: the two speech marks without the baseline, at 16, 32 and 64. Below 20 px the
  baseline is thinner than a pixel.
- Not allowed: rotation, gradients, other colours, outlines, stretching, ME not in teal.
- One tagline: "What the SMEs say." Footer expands SME once: subject matter expert.
- Respondent side: the PM's logo and name take the header; SMEsay appears once as "Powered by",
  smallest lockup, ink and teal. Always shown on the Free plan.

## Colour

Neutrals

| Token | Hex | Use |
|---|---|---|
| white | #FFFFFF | page background |
| grey-50 | #F6F6F4 | section background, table header, hovered row |
| greige | #ECEAE5 | cards holding product fragments |
| hairline | #E6E4DF | borders, dividers |
| hairline-strong | #C9C7C1 | input borders, secondary buttons, arrows |
| ink-muted | #5B6069 | secondary text |
| ink-soft | #454A52 | body on marketing |
| ink | #16181C | text, primary buttons |
| ink-raised | #22252A | cards on ink |

Teal, the one accent. Steps 50 to 900: #E3F1EF, #CADEDD, #A3C7C4, #7FD1C6, #4CA399, #2A847C,
#21776F, #0E6B63, #10524E, #123D3C. Teal 700 is the brand: links, focus rings, the mark, the ME,
the one coloured band on the landing page. Teal 300 replaces it on ink and dark cards. Teal 50 is
the tint. Primary buttons are ink. Teal is never used for data.

Status colours, fixed across the product, each shown with its word, never colour alone.

| Status | Solid (bars, dots) | Tint (pill fill) | Text on tint | Text on tint ratio |
|---|---|---|---|---|
| Agree | #2F855A | #E6F4EC | #22643F | 6.25 |
| Pushed back | #B7791F | #FBF1DC | #7A5210 | 6.15 |
| Unclear | #7C3AED | #EEE8FA | #4C2F94 | 8.20 |
| Missing | #2B6CB0 | #E3EEF9 | #1F4F7A | 7.27 |
| Not needed | #718096 | #F0F0EE | #454A52 | 7.82 |

Solid pushed back (3.64:1) and solid not needed (4.02:1) are never used as text on white.
Unclear changed from #6B46C1 to #7C3AED on 2026-10-01 so unclear and missing pass the
colour-vision check (worst adjacent pair 17.3, target 15; note 09).

Text contrast, computed: ink on white 17.77, ink-muted on white 6.32, ink-muted on greige 5.26,
teal 700 on white 6.36, teal 700 on greige 5.29, white on teal 700 6.36, teal 300 on ink 10.02.
Hairline-strong is never text (1.69). Teal 700 on ink fails (2.79); use teal 300 there.

Dark mode: defined as a mapping, not built in R1. background #111214, surface #1A1C1F, hairline
#2A2D32, ink #F2F1EE, ink-muted #A3A7AE, accent teal 300. Status solids unchanged; tints become
18 percent of the solid over the surface.

## Type

Geist Sans and Geist Mono, SIL Open Font License, https://github.com/vercel/geist-font. Weights
400, 500, 600; 600 only in the wordmark.

| Size | Line height | Tracking | Weight | Use |
|---|---|---|---|---|
| 64 | 66 | -0.045em | 500 | marketing headline (40 on a phone) |
| 40 | 44 | -0.035em | 500 | section heading |
| 32 | 36 | -0.03em | 500 | page title in the app and on boards |
| 24 | 30 | -0.02em | 500 | card title, respondent item text |
| 20 | 26 | -0.02em | 500 | lead paragraph, step title |
| 17 | 26 | -0.01em | 400 | respondent body, marketing body |
| 16 | 24 | 0 | 400 | marketing small body, email body |
| 14 | 20 | 0 | 400 | app body, tables |
| 13 | 18 | 0 | 400 | app secondary, captions |
| 12 | 16 | 0 | 400 | labels, mono references, timestamps |

Bases: PM app 14, respondent 17, marketing 17 and 20. Mono for item references, counts,
progress, timestamps and dashboard numerals (tabular figures). Never mono for labels, buttons,
headings or body. Eyebrows in sentence case; no uppercase with wide tracking.

Email stack: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif. Body 16, line
height 24. Mail clients do not load web fonts reliably; Mihai checks Gmail, Outlook web and
Apple Mail (decision 0004).

## Space, shape, layout

- Grid 4 px. Steps 4, 8, 12, 16, 24, 32, 48, 64, 96. Inside a component 4 to 12, between
  components 16 and 24, between sections 48 and 64 in the app, 96 on marketing.
- Radii, four: 6 (PM controls, inputs, rows, menus), 12 (respondent cards and inputs, app
  cards, banners), 20 (marketing cards, panels, product frames), 999 (buttons, pills, avatars).
  The prototypes' 10, 16 and 28 move to the nearest of these as they are touched.
- One shadow: 0 10px 28px rgba(22, 24, 28, 0.08), only on menus, dialogs, toasts and product
  fragments on greige. Toasts on ink use 0.16.
- Borders: hairline 1 px; hairline-strong 1 px on inputs and secondary buttons; ink 1.5 px on
  the one highlighted object on a screen. No left-edge-only borders. No two-tone borders.
- Widths: marketing column 1120 in 1440; app sidebar 240 plus fluid content to 1440; respondent
  390 with 20 px gutters; email 600. Table rows 36, table header 32. Respondent tap targets 48.

## Components

Built on shadcn/ui restyled to these tokens (decision 0001). Every component has rest, hover,
focus, loading and disabled, plus empty and error where they apply (build rules).

- Buttons: primary (ink pill, white text), secondary (white pill, hairline-strong), tertiary
  (underlined text link), destructive (white pill, red #9B2C2C border and text). Height 40 in
  the app, 48 on the respondent side and marketing. Verbs as labels. One primary per screen.
- Hover: primary brightens 18 percent; others fill grey-50. Focus: 2 px teal 700 ring, 2 px
  offset, on every control for keyboard and mouse. Loading: a 14 px ring spinner before the
  label, the label stays. Disabled: the same control at 40 percent opacity, never grey on grey.
- Inputs: 40 high, hairline-strong, radius 6 (12 on the respondent side), placeholder #8A8E96
  (placeholder only, never for real text). Focus as buttons. Error: red border and a message in
  red saying what happened and what to do next.
- Status pills: tint fill, text colour from the table, 12 px weight 500, radius 999.
- Toggle 36 by 20, ink when on, hairline-strong when off. Progress bar 4 px, ink fill, label
  and mono count above. Tabs: 14 px, active ink with a 2 px ink underline.
- Banner (the ambiguity flag): unclear tint and text, a Dismiss pill. Toast: ink, white text,
  teal 300 action, one shadow. Empty state: dashed hairline-strong box, a title and one line
  that says what to do.
- Table: header 32 on grey-50 at 12 px muted; rows 36; hovered row grey-50. Card: radius 12 in
  the app, hairline, 16 padding, title 14 weight 500.

## Data

Follows the dataviz rules: thin marks, 2 px surface gaps between segments, direct labels on at
most four series, a legend whenever there are two or more series, text in ink tokens never in
series colour, never a pie, never two y-axes.

- Agreement strip per item and per area: agree, pushed back, unclear segments; percent is
  agree over answered, printed as mono text; the number matches the CSV to the row.
- Confidence at sign-off: one hue (teal 700), five bins, empty bins a 4 px hairline, average
  printed as text.
- Where groups disagree: two bars on one scale, teal for the share that agreed, any respondent
  field as the split, four largest gaps by default.
- Live update: the changed cell fades over 400 ms. No spinning counters.

## Motion

150 ms ease-out for state changes; 250 ms for page and item transitions and progress fills;
reveal on scroll on marketing only, 750 ms, rises 22 px, once, cards staggered 120 ms. With
prefers-reduced-motion everything is off and the content is visible.

## Respondent theming

The PM's logo and accent come from workspace settings (E2). The accent is used on the progress
bar, the focus ring and links. Buttons stay ink. Neutrals and type never change. An accent under
4.5:1 on white falls back to ink and settings says why. No dark mode on the respondent side.

## Email

600 px, white, one column, system stack, the mark as an inline image at 22 px, one ink button,
hairlines, 28 px side padding. Transactional only: sign-in, invite, reminder, submission receipt.
Footer: company name, registered address placeholder until the lawyer confirms (E11), privacy
policy link.

## Voice

WRITING.md applies to every string. Buttons are verbs. Error messages say what happened and
what to do next. No exclamation marks. Second person, present tense.
