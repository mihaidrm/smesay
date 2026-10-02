# E2-5 Workspace settings: name, logo, accent colour, AI budget

User: the workspace owner making instruments carry the company's name and colour
Status: ready
Outcome: logo and colour appear on every instrument created after saving; the AI budget is
visible.

## Acceptance criteria
1. Settings (PM app board): workspace name; logo upload (PNG or SVG, up to 1 MB, stored in the
   S3-compatible bucket, shown at 24 px in the respondent header in place of the mark); accent
   colour as a hex field with a swatch; AI budget shown as "EUR [BUDGET] per month, EUR [SPENT]
   used this month" (not editable in R1; default 50, decision 0011).
2. An accent under 4.5:1 on white shows the banner "This colour is too light on white, so the
   respondent page uses the default. Pick a darker one to use yours." and the respondent side
   uses ink (docs/design-system.md, respondent theming; Brand 06). The check uses
   src/lib/contrast.ts.
3. The respondent side uses the accent on the selected answer, the active chapter and the
   progress bar only; buttons stay ink (decision 0016). "Powered by SMEsay" stays on the Free
   plan (design system, Identity).
4. Every field validates on the server (CLAUDE.md, PM side): name 1 to 80 characters, hex
   colour as #RRGGBB, logo type and size by content, not extension.
5. Playwright: change the accent, open the sample instrument preview, see the colour on the
   chapter row.

## Out of scope
- Billing and plan changes: R3. The AI budget becomes editable with paid plans.
- Workspace deletion and export: E11-2.

## Open questions
- None.

## Technical notes
Columns on workspace: accent_hex, logo_object_key, ai_budget_eur (docs/schema.md). Uploads go
through src/lib/storage.ts (S3 client against RustFS locally, decision 0025); the logo is
served through a signed URL or a proxy route, decided in the story's first session and
recorded here. Logo validation reads the file header (PNG signature, SVG root element) and
strips scripts from SVG or refuses SVG with script elements.
