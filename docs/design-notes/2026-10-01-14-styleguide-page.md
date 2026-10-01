# Design note 14: the styleguide page, 2026-10-01

Plan step 2.3. docs/design-system.md rendered inside the app with the components the app will
use, at /styleguide (src/app/styleguide/page.tsx and demos.tsx). Not linked from the product.
Screenshots: docs/design-notes/prototype-01/styleguide-desktop.png (1440) and
styleguide-phone.png (390; no horizontal scroll, measured).

## Where the tokens live

Three twins, changed together (decision 0017):

- docs/design-system.md, the text.
- src/lib/tokens.ts, the values for code (the styleguide, later charts, exports, emails).
- src/app/globals.css, the Tailwind theme: named colour tokens (ink, ink-muted, greige,
  hairline, teal-50 to teal-900, agree, pushed, unclear, missing, disagree with -tint and
  -text), the four radii (shadcn's radius steps collapse onto 6, 12 and 20), the one shadow,
  and shadcn's own variables mapped onto the tokens (primary ink, secondary and muted grey-50,
  border hairline, input hairline-strong, ring teal 700, destructive #9B2C2C).

src/lib/contrast.ts computes WCAG 2.1 contrast; src/lib/contrast.test.ts checks the figures
printed in the design system (ink on white 17.77, teal 300 on ink 10.02, every status text on
its tint, and so on). If a token changes, the test fails until the text is updated.

## Components

shadcn/ui 4.21 (style base-nova, on Base UI) restyled:

- Button: rewritten variants primary (ink pill), secondary (white pill, hairline-strong),
  tertiary (underlined text), destructive (white pill, danger border and text); sizes app 40,
  respondent 48, small 32, icon; a `loading` prop that keeps the label and adds a 14 px ring;
  disabled at 40 percent; focus ring 2 px teal 700 with 2 px offset on focus-visible.
- Input, Textarea, Label, Switch, Tabs (line variant for the ink underline), Table, Card,
  Separator, Select, Progress: shadcn's files as generated, styled through the mapped
  variables; the styleguide passes the heights the design system asks for (input 40, switch
  36 by 20) as classes. If a second screen needs the same override, it moves into the
  component file.
- New, from the design system's Components section: StatusPill and NotAnsweredPill
  (status-pill.tsx), SegmentedControl (segmented-control.tsx), Banner, EmptyState and Toast
  (banner.tsx), Mark, Wordmark and Lockup (components/brand/mark.tsx).

## Deviations and open points

- Fonts come from next/font/google in the layout for now. The design system says the app
  self-hosts Geist (E1). The font variables sit on the html element so every element inherits
  them.
- Dark mode is defined in globals.css as the design system's mapping and not shipped: no
  toggle, no class.
- The progress bar on the styleguide is a plain div with role progressbar, not shadcn's
  Progress, which renders label and value slots the design does not use.
- The tabs underline is shadcn's line variant; its exact thickness is Base UI's, not measured
  against the 2 px in the design system. To check on Mihai's click-through.
