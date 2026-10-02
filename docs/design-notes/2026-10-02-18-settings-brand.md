# Design note 18: Settings, brand and budget, 2026-10-02

Story E2-5. Built from the PM app board (Settings: the brand block, the AI budget and Plan
cards) and docs/design-system.md. Screenshots beside the boards: settings-brand-empty-desktop.png
(a new workspace, nothing set), settings-brand-desktop.png (name, logo and accent saved),
settings-brand-light-desktop.png (an accent under 4.5:1 with the banner). The dark circle bottom
left is Next's dev tools badge, dev server only.

## The page (/app/settings)

Two columns above the Members card: the brand card on the left (fluid), the AI budget and Plan
cards on the right (320 px). Each card: hairline, radius 6, a 44 px title row.

Brand on the respondent side, for an owner: the "Workspace name" field (36 px); the logo row
with the current logo at 40 px (or the name's initial on an ink square), the "Logo" label, the
line "PNG or SVG, up to 1 MB. Shown at 24 px in the respondent header in place of the mark.",
the file input and, once a logo exists, a "Remove logo" checkbox; the accent row with a 40 px
swatch that follows the field, the "Accent colour" field (mono, 160 px) and the contrast line
under it, which reads "Contrast on white [RATIO]:1. Used on the selected answer, the active
chapter, the progress bar, the focus ring and links. Buttons stay ink." in muted ink, turns
danger red under 4.5:1, and "No accent set. The respondent page uses teal." when empty; the
primary "Save" on the right. After a save the green line "Saved. Instruments created from now
on carry the new name, logo and accent." appears at the top, or the banner from errors.md when
the accent is too light (the colour is kept; the respondent side falls back to teal). A member
sees the three values as a list, no form.

AI budget: the mono line "EUR 50.00 per month, EUR [SPENT] used this month", a 6 px greige
bar with an ink fill for the share used, and the note that the budget is not editable on the
Free plan. Plan: "Free" with the teal pill "While we build it with the first users" and one
line.

The board's logo line says 28 px; the story and the design system say 24, so 24 it is.

## Checked

Rendered in Chromium at 1440 by 900. The flow is run by e2e/settings.spec.ts (rename, upload
a PNG, accent, the contrast line, the saved line, the logo served by /brand/[workspaceId]/logo,
the light-accent banner, a refused hex; in CI against RustFS); the same steps were run against
the dev server with the memory store (screenshots above).
