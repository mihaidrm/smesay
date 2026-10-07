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
- The mascot (bought, docs/assets.md row 1): the round-headed robot of the Robot Vector
  Collection, recoloured to the violet, in four poses (hi, idea, reading, analysis) in
  public/assets/mascot/. It stands on a light disc with the card shadow in both modes: 88 px
  on sign-in, 104 on the landing hero, 96 in an empty state. Decorative, empty alt; the
  page text carries the meaning (src/components/app/mascot.tsx, design note 37).

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
| on-violet | #FFFFFF | #16152A | text and the number circle on a violet fill (the stepper's active pill, the avatar): 5.25 and 6.17 |
| coral | #FF6B57, #9E3321, #FFE9E5 | #FF8A78, #FF8A78, #3A2230 | counts, the disagreement view, what needs attention |
| mint | #1F9D7A, #166A52, #E1F5EE | #5FD3B3, #5FD3B3, #15302B | saved, agreed, a done step, the reader version used |
| sun | #F5B740, #8A5A00, #FFF3D6 | #FFD36E, #FFD36E, #3A2F14 | pushed back, the ambiguity dot |

Two gradients and no more: the primary button (135deg #7355F2, #6D4CF5 at 60 percent, #5A3BE0,
with the glow 0 8px 20px rgba(109,76,245,0.35); white text reads at 4.87 on the start and 6.69
on the end, so the button keeps white text in both modes) and the marketing hero's aurora (violet, coral
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
soft 6.31, mint on its soft 7.69, sun on its soft 9.27, danger on surface 7.16, on-violet (the
dark ground) on the violet 6.17. Hairline-strong is never text (1.58).

Modes: the PM app and the admin area follow the system setting with a toggle at the bottom of
the sidebar (src/components/app/mode-toggle.tsx; the choice is kept in the browser). The
landing page has a dark hero and pricing with light sections between. The respondent side
follows the phone's setting until the respondent presses the switch at the right end of its
header (a 36 px round button with the moon, or the sun on dark, in a 48 px tap target; the
same stored choice; design note 97); the PM's accent still marks the selected answer, the active
chapter and the progress bar (decision 0016), and from E7-7 the confidence picked and the
header's initials, lifted two steps on dark. With no accent set the
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
- Dropdowns: Lucide's chevron-down, 16 px, 16 px from the right edge; the open list is a menu
  (12 radius, card shadow) with 8 px options inside its 4 px inset, where the browser allows it
  (design note 96).
- Shadows: the card, 0 12px 32px rgba(45,32,110,0.10) on light and rgba(0,0,0,0.45) on dark,
  on every card, the active segment and menus; the glow under the primary button; the toast at
  0 12px 32px rgba(0,0,0,0.45). A hovered card lifts 2 px with the deeper shadow (marketing:
  3 px).
- Borders: hairline 1 px on cards and rows; hairline-strong 1 px on inputs, secondary buttons
  and dashed frames; violet 1.5 px on the one highlighted object on a screen (a card being
  dropped on, the selected item). No left-edge-only borders. No two-tone borders.
- Widths: marketing column 1120 in 1440; app sidebar 248 plus fluid content to 1440; respondent
  390 with 20 px gutters; email 600. Table header 36, rows 40 (the project list 52). Respondent
  tap targets 48 for buttons, inputs and the chapter pills; the rating pills are 38 (decision
  0018 item 4 said 36 and left Mihai free to change it; the design system took 38 on
  2026-10-01 so five or six fit the card's width with their captions; design note 99 dropped
  the fixed 260 px height).

## Motion

Design note 33, Motion: cards lift 2 px on hover; buttons lift 2 px over 150 ms, the primary's
glow deepens, the secondary fills violet soft, pressed drops back in 60 ms; the live dot pulses
every 2.2 s; the stepper's active pill and the mode toggle's thumb slide over 150 to 250 ms;
progress bars fill over 250 ms; a changed dashboard cell fades over 400 ms; the mode toggle
sweeps the new mode in over 1,800 ms behind a soft diagonal edge at a steady speed, on the
page from the first frame: from the top left corner going light, from the bottom right
going dark (a view transition, design note 35); on the respondent side a new chapter, item
or the Wrap up slides in 24 px from the side the respondent moved to and fades in over
240 ms (design note 99). On marketing,
sections rise 18 px once, the mascot floats and a light follows the cursor over the dark
sections. Everything stops under prefers-reduced-motion. No counters that spin.

## Components

Built on shadcn/ui restyled to these tokens (decision 0001). Every component has rest, hover,
focus, loading and disabled, plus empty and error where they apply (build rules).

- Buttons: primary (the violet gradient pill with the glow, white text, weight 600), secondary
  (surface pill, hairline-strong, fills violet soft on hover), tertiary (underlined link in
  violet text), destructive (surface pill, danger border and text, coral soft on hover). Height
  40 in the app, 48 on the respondent side and marketing, 32 small. On the respondent side the
  primary is ink with the ground as text (RespondentV2; decision 0016: the PM's accent never
  on buttons). Verbs as labels. One primary per screen.
- Cursor: every control a click acts on shows the hand (buttons, switches, radio pills,
  tabs, options, summaries, selects, checkboxes, sliders, file pickers); a disabled one keeps
  the arrow, a text field keeps the I-beam (design note 101; a base rule in globals.css).
- Focus: 2 px violet ring, 2 px offset, on keyboard focus (focus-visible) on every control.
  Loading: a 14 px ring spinner before the label, the label stays. Disabled: the same control
  at 40 percent opacity, never grey on grey.
- Inputs: 40 high, hairline-strong, radius 12, surface fill, placeholder token (placeholder
  only, never for real text). Focus as buttons. Error: danger border and a message in danger
  saying what happened and what to do next.
- File picker (src/components/app/file-picker.tsx, design note 103): a label drawn as the
  secondary button around the file input, kept off screen with its id, name and accept; the
  file's name beside it at 14 px muted, "No file chosen" before a pick; the ring on the button
  while the input has the focus; the verb "Choose a file" ("Choose an image" for the logo);
  disabled at 40 percent while the form is busy.
- Status pills: tint fill, text colour from the table, 12 px weight 600, height 24, radius 999.
  Neutral pill: tint fill, soft ink. Count badge (nav): coral fill, dark text, 11 px 700.
  Toggle chip (the perspective tags on Shape, design note 44): a pill-shaped button with
  aria-pressed, hairline-strong and muted text when off, violet soft and violet text when
  on, 12 px 600, height 24, radius 999; aria-disabled at 60 percent while a press saves.
- Colour picker (Settings, Brand; design note 104): a 40 by 40 swatch, radius 10, hairline,
  the hand cursor and the focus ring, painted with the colour in the hex field beside it
  (the default violet when the field is empty); it is an input of type color laid over the
  swatch, so a press opens the browser's own picker, and the picked colour writes the hex
  in upper case into the field. A tertiary Clear beside the field empties it. The same in
  both modes; the swatch shows the saved value, not the lift the respondent side draws on
  dark.
- Toggle 44 by 24, violet when on, ink-muted when off, the thumb white on light and the ground
  on dark, named by its visible label. Progress bar 4 px,
  violet fill (the PM's accent on the respondent side), label and mono count above. Tabs:
  14 px, active ink with a 2 px violet underline. Segmented control: tint track, the active
  option a surface pill with the card shadow.
- Slider (the confidence on the Wrap up, design note 107): a native range input, 48 high as
  its tap target, the thumb and the filled track in the PM's accent through accent-color
  (lifted on dark as the pills were), the word of the value centred under it at 16 px 600,
  the end captions in mono 10 px muted. Until a value is picked the thumb is at 40 percent
  and the word line carries the prompt in muted ink. Focus as buttons. No transition of its
  own.
- Banner (the ambiguity flag): a card on the soft violet gradient with a sun dot, ink text, a
  secondary Dismiss pill. Toast: dark surface, light text, violet 300 action, the toast shadow.
  Empty state: a dashed card with a title at 18 px 700, one line that says what to do and the
  mascot where the screen is a first visit (Projects, Import, Results).
- Unsaved changes guard (stories/E5-9, design note 112): a card of Import, Build or Share
  whose form holds changes not saved, after a click on a stepper pill or a sidebar link,
  turns its hairline danger with an inset line (2 px, nothing moves), shakes once 4 px side
  to side over 400 ms (nothing under reduced motion) and shows "Not saved" at 12 px 600 in
  danger beside its title; under the project header's title row a banner on the surface with
  a danger hairline, 14 px 600 danger text naming the cards, and a small secondary Discard.
  Components in src/components/app/unsaved.tsx.
- Table: header 36 at 12 px muted 600, no fill; rows 40 with a hairline above; hovered row
  tint. Card: radius 16, hairline, the card shadow, 16 padding, title 15 weight 700 with a mono
  count beside it when there is one. Item row (Shape, the respondent cards' list form): raised
  surface, hairline, radius 12, 12 by 14 padding.
- Stat tile: a card with the number at 30 px 800 in mono and a 13 px muted label; the number in
  ink or in violet text, mint text or sun text by what it counts (never a solid).
- Thinking (design note 113; src/components/app/thinking.tsx): while an AI run is pending,
  under the button, the mascot in the analysis pose at 56 px beside one line in soft ink at
  14 px that walks through the steps the screen passes, 1.6 seconds each, stopping on the
  last, with three 6 px violet dots pulsing after it, each 200 ms behind the one before. The
  line is a polite status region. Under prefers-reduced-motion the first line stays and
  nothing pulses. The refusal box beside the same buttons is the danger tint: coral soft,
  danger text, a 16 px alert icon before the sentence.
- Developer menu (design note 113; src/components/app/dev-menu.tsx; local and test builds
  only): a dashed card at the bottom of the sidebar, "Developer" in soft ink, a radio group
  "AI calls" with three choices, the month's usage under it; a neutral pill "AI: stand-in" or
  "AI: off" beside the project header's stepper while the choice is not the real model.
- Sidebar: 248 wide on the surface, pinned to the viewport at its full height so the whole
  menu stays in view however long the page is (only the project list scrolls, inside it);
  the lockup at 17 px; the workspace chip on the tint with
  the initials tile (coral to sun); nav items 40 high, radius 12, icon 18 px (Lucide), the
  current one on violet soft in violet text; the sample card on the soft violet gradient; the
  mode toggle; the signed-in email and Sign out.
- Project header: breadcrumb, title, the stepper and Archive on one row, pinned to the top of
  the viewport on the ground with a hairline under it while the step page scrolls.
- Stepper: pills on a surface track, the current step (the open page) a violet pill with
  on-violet text and an on-violet circle holding a violet number, ringed in violet (2 px) with
  a 2 px surface offset, a done step a mint circle with a dark tick, a coming step muted with a
  hairline-strong circle.
- Tiles: the workspace's initials and a project's colour (one of four gradients picked by the
  name; the sample a dashed outline) are decoration beside the written name, never the only
  mark.

## Respondent columns

Three column widths on the respondent side, decided 2026-10-01 after Mihai's review of the
desktop board; on 2026-10-05 every step became a card (decisions 0051 and 0052). On a desktop
each step is a centered card, 48 px from the top and at least 16 px from the window's sides,
content at 32 px from its sides, its actions centered in the card's bottom band (the dark one
at least 320 px wide, with its line under it; the passcode's Continue centered under its
field instead), focus rings offset on the card's white, and "Powered by" under the card as the
last line of the page. The widths: About you, done, nothing to rate and the link pages (unknown, not yet open,
closed, inactive, the passcode) and the link's error and 404 pages 720 px, the fields filling it; the Wrap up 760 px; a chapter
1000 px with two card columns, because density is the point there. In the chapter and the
Wrap up the content keeps the ground colour inside the card, so the item cards and tiles do
not sit white on white. On a phone the same parts are full width, the actions in the bottom
band and "Powered by" under it. On a phone every column is the screen width and controls span it. The convention behind
it (single column, labels above fields, the primary action under the form) is standard form
guidance; the NN/g and GOV.UK pages on it could not be opened from this environment, so it is
recorded here unverified.

## Rating row (respondent cards)

Decision 0018, kept in v2 (RespondentV2), reworked on 2026-10-05 (design note 99). A card on
the surface with the card shadow, 12 px padding, parts 8 px apart. "Requirement [REF]" at 12/16
weight 600 in muted (no line when the item has no reference), then the summary at 16/23 weight
600, clamped to two lines. When the item has details, View more (12 px, underlined, a 48 px
tap area) opens them in place, above the rating row, on the ground (the raised surface on
dark), 13/18; the summary is then shown whole too, and the button reads View less. One row of
pills, the method's values then Unclear (MoSCoW: Must, Should, Could, Not needed, Unclear; 1 to
5 fit: six pills with "no fit" and "fits fully" captioned under the ends; keep, change, drop:
four), 38 px high, 10 px text at 600, radius 999, 2 px apart, always one row, a long label on
two lines inside its pill. Under it one box at most: the reason box when the answer needs one,
its question as the label ("Could you tell us why you think the priority should be
different?", the fit or "it" for the other methods), or the comment box when "+ comment" is
open (radius 12, 14/20, two lines high). The footer sits at the bottom of the card: "+ comment"
and the status note (Saved in mint text, Not rated yet in muted; nothing while a reason or a
question is missing, since the box asks). The proposed value has a dashed muted border. The
selected pill fills with the PM's accent and white text, and on dark with the lifted accent
and the dark ink. Cards sit in one column on a phone and two on desktop, 12 px apart; the two
cards of a row are always the same height, the shorter one stretched with its footer at the
bottom. Moving to another chapter (or item, on the one-item layout) slides the new content in
24 px from the side the respondent moved to, fading in over 240 ms; not under reduced motion.

## Data

Follows the dataviz rules: thin marks, 2 px surface gaps between segments, direct labels on at
most four series, a legend whenever there are two or more series, text in ink tokens never in
series colour (no number inside a status-coloured segment: white or ink there fails 4.5:1 in
one mode or the other, so a stacked bar's counts are printed in words under it), never two
y-axes. A donut only at the area and list level, never per item, the numbers printed beside it
(design note 40 relaxed the earlier "never a pie"; decision 0044 item 5): five slices for the
kinds (the four and Not answered), six with Rated, and one per value of the scale with Unclear
and Not answered on a rate-blind list (docs/review-list.md). The values picked use one blue
ramp from the missing-item solid, apart in hue from Unclear's violet.

- Agreement per item and per area, three views (E8-3): the stacked bar per item (agree,
  different priority, disagree, unclear, not answered segments; the compact default), the
  aligned bars per kind per area (the readable one), the donut per area and list; percent is
  agree over answered, printed as mono text; the number matches the CSV to the row under the
  same filter. The kinds are named Agree, Different priority, Disagree, Unclear (decision
  0014; the landing page's results fragment uses these names and the status colours since
  2026-10-04, design note 53).
- Values picked where no proposal was shown (rate-blind, E8-3): one blue ramp, a step per
  value of the scale (the missing-item solid at 100, 78, 58, 42 and 28 percent over the
  surface), apart in hue from Unclear's violet but close in lightness (1.05:1), so every value
  is also named: the counts in words under a bar, the label under each aligned bar, the
  legend. The same colour per value in every view; Unclear keeps its status colour, Not
  answered its dashed outline. Built in src/lib/results-agreement.ts and
  src/components/app/charts.tsx (design note 61).
- Confidence at sign-off: one hue (violet), five bins, empty bins a 4 px hairline, average
  printed as text.
- Where groups disagree: a bar per group on one scale, the agree solid for the share that
  agreed on the tint track, a group under 3 answers as a dashed empty track with no number,
  any dropdown respondent field as the split, the four largest gaps above 0 by default
  (design note 63).
- Live update: the changed cell fades over 400 ms. No spinning counters.

## Respondent theming

The PM's logo and accent come from workspace settings (E2). The accent is used on the selected
answer, the active chapter and the progress bar (decision 0016), and from E7-7 on the
confidence picked on the Wrap up and the header's initials when there is no logo (the focus
ring and links stay violet). Buttons stay ink. Neutrals and type never change. An accent under 4.5:1 on white
falls back to ink and settings says why; with none set the accent is violet 600. The
respondent side follows the phone's setting for the mode (until the header's switch is
pressed, design note 97), with the PM's accent lifted two
steps on dark (OKLCH lightness 0.72 with the hue kept: design note 57), drawn with the dark
ink; violet 600 and ink take violet 400 on dark, and so would a lifted accent that read
under 4.5:1 on the dark surface or under the dark ink (note 33).

## Email

600 px, white on the lavender ground, one column, system stack, the mark as a 22 px PNG
(public/assets/brand/mark-44.png, served by the app) beside the wordmark in text, one violet button (#6D4CF5, white
text, radius 999), hairlines, 32 px padding, radius 16. Transactional only: sign-in, invite,
reminder, submission receipt. The landing page's questions reach SMEsay's own inbox as plain
text (E12-5). Footer: company name, the registered address from COMPANY_ADDRESS (left out until the lawyer
confirms it, E11), privacy policy link in violet text. One frame for all of them:
src/lib/mail/templates/layout.ts (E12-3).

## Voice

WRITING.md applies to every string. Buttons are verbs. Error messages say what happened and
what to do next. No exclamation marks. Second person, present tense.

