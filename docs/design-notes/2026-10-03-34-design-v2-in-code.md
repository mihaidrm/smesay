# Design note 34: design v2 in the code, 2026-10-03

Mihai approved the boards of design note 33 ("Yeah looks good") and asked for the design on
everything built so far. This note records what the pull request changes, what was added to
the design system and where the code departs from the boards, with the reason.

## What changed

- Tokens: src/app/globals.css holds every colour as a variable on `:root` (light) and `.dark`;
  the Tailwind names read the variables, so `bg-surface` or `text-violet-text` is one class
  in both modes. src/lib/tokens.ts carries the same values as light and dark objects; the
  status colours gained their dark solid, tint and text. docs/design-system.md is rewritten
  for v2. Teal, grey-50, grey-100, greige, ink-raised and white-as-a-token are gone; the
  v1 names that stayed (ink, ink-muted, ink-soft, hairline, hairline-strong, danger) now
  switch with the mode.
- Type: Plus Jakarta Sans 400 to 800 through next/font/google, Geist Mono kept. Body 15 on
  24 in the app. Page titles 30 at 800, project titles 24 at 800, section titles 20 at 700,
  card titles 15 at 700.
- Mode: the html class `dark` is set before the first paint by an inline script in
  src/app/layout.tsx from localStorage ("smesay-mode") or the system setting; the toggle at
  the bottom of the sidebar flips it and stores the choice. `suppressHydrationWarning` on the
  html element covers the class the server did not know.
- Components restyled: Button (gradient primary with the glow and the hover lift, secondary
  fills violet soft, tertiary in violet text, destructive on coral soft), StatusPill (height
  24, weight 600), NeutralPill, NotAnsweredPill, Banner (soft violet gradient, sun dot,
  secondary Dismiss), EmptyState (dashed card, optional mascot), Toast, SegmentedControl,
  Stepper (violet active pill, mint tick on done steps), Mark and Wordmark (violet, radius 9,
  no baseline, weight 800), the email template's colours and button.
- Components added: ModeToggle (src/components/app/mode-toggle.tsx), NavLink
  (src/components/app/nav-link.tsx), MascotPlaceholder (src/components/app/mascot.tsx),
  WorkspaceTile, ProjectTile and StatTile (src/components/app/tiles.tsx). Two utilities in
  globals.css: `card` (surface, hairline, radius 16, the shadow) and `item-row` (raised,
  hairline, radius 12), plus `bg-aurora-button` and `auth-frame`.
- Screens: the shell (248 px sidebar: lockup, workspace chip with the initials tile, Projects
  and Settings nav with Lucide icons, the project list, the sample card, the toggle, the
  email and Sign out), Projects (four stat tiles from the usage counts and the open links,
  the table as a card with a colour tile per project, Show archived as a button), the project
  frame (title at 24, the new stepper), Import (every section a card), Shape (areas as cards
  with the count in mono and the rationale on the right, items as rows on the raised surface,
  Suggested in violet, Reader version used in mint), Settings (cards, the Plan chip in violet
  soft), sign-in (a card on the ground with two aurora blobs and the mascot placeholder at
  its corner), the styleguide (every swatch in both modes, a toggle at the top), the small
  pages (not found, errors, name the workspace, choose a workspace) through the shared
  `auth-frame` column.
- Default accent on the respondent side: violet 600 #6D4CF5 (was teal 700); the fallback ink
  is #15131F. docs/copy/app.md: the "none set" line says violet; rows for the sample card,
  the toggle, the stat tiles and the archive buttons.

## Departures from the boards, with reasons

- Icons are Lucide, not Phosphor duotone. The boards' nav icons are 2 px strokes, which
  Lucide has; @phosphor-icons/react's last release is 2025-05-22 (npm, read 2026-10-03) and
  adding a second icon set for three icons is not worth a dependency. docs/assets.md row 3
  says so. Phosphor comes back if a duotone look is wanted for the stat tiles.
- The sidebar has no Results item. The product has no Results page until E6, and the copy
  rule is not to describe a feature the product does not have; the item and its coral count
  arrive with E6-1.
- The stat tiles count what exists: projects, open links, responses this month, AI runs this
  month (src/db/queries/usage.ts and the project summaries). The board's agreement percent
  and to-do count come with E6 and E7.
- The mark lost its baseline (the boards draw it without one; the v1 Identity text said "on a
  shared baseline"). docs/design-system.md and the two placeholder SVGs follow the boards.
- The ambiguity banner on light is a surface card on the soft violet gradient with the sun
  dot, since the board only drew it on dark; on dark it is the same card on the dark gradient
  through the tokens.
- The mode toggle has two states, light and dark, and no "follow the system" position; the
  system setting applies until the first press. A reset would be a third control for a
  choice that is made once; it can be added if asked.

## Checks

Recorded in the pull request: lint, typecheck, the unit tests (contrast figures for both
modes, the brand default), the copy scan, the status check, the build and the bundle check.
Playwright on the main paths runs in CI; the screenshots of the six screens in both modes are
in the pull request's reply to Mihai. No model call was made.
