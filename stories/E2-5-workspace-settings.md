# E2-5 Workspace settings: name, logo, accent colour, AI budget

User: the workspace owner making instruments carry the company's name and colour
Status: built
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
   colour as #RRGGBB, logo type and size by content, not extension. Saving is owner-only through
   `can()` (E2-4, src/lib/permissions.ts: workspace.rename, workspace.accent, workspace.logo,
   workspace.budget); a test calls the save as a member and gets 403.
5. Playwright: change the accent, open the sample instrument preview, see the colour on the
   chapter row.

## Out of scope
- Billing and plan changes: R3. The AI budget becomes editable with paid plans.
- Workspace deletion and export: E11-2.

## Open questions
- None.

## Technical notes
Built 2026-10-02, with acceptance 3 and the respondent half of acceptance 5 deferred: the
respondent page and the preview do not exist yet (E7-1, E5-6), so this story ships the
settings, the storage and the rule, and E7-1 applies the accent and the logo on the respondent
side (its story names `effectiveAccent()` and the logo route). The Playwright test of this
story covers the settings page itself: rename, upload, accent, the contrast line, the banner,
the logo served by the route.

- Columns on workspace: accent_hex, logo_object_key, ai_budget_eur (docs/schema.md). The save
  is `saveBrand()` in src/lib/brand.ts: owner-only through can() (workspace.rename,
  workspace.accent, workspace.logo; src/lib/brand.test.ts calls it as a member and gets 403),
  every field validated on the server (name 1 to 80, accent as #RRGGBB or empty, the logo by
  content). The accent is stored as typed; `effectiveAccent()` in src/lib/brand-rules.ts gives
  the respondent side the accent when it reaches 4.5:1 on white (src/lib/contrast.ts) and the
  design system's teal otherwise, and Settings shows the banner from docs/copy/errors.md.
- Uploads go through src/lib/storage.ts: @aws-sdk/client-s3 3.1145.0 (Apache-2.0, released
  2026-10-01; open issue count unverified, the GitHub API outside the project is not reachable
  from the session) against RustFS locally and in CI (a service container in ci.yml) and
  Cloudflare R2 at the launch gate, path-style addressing, the bucket created on first use;
  `S3_ENDPOINT=memory:` keeps objects in the process for the unit tests. Objects are
  logos/<workspace id>/<16 hex>.<png|svg>; the old object is removed after a save.
- The logo is served by a public route, /brand/[workspaceId]/logo (src/app/brand/.../route.ts),
  not a signed URL: the respondent page shows it to people with no session, the route reveals
  nothing but the logo, and a day of caching with a version in the URL keeps it fast. The
  alternative, signed URLs from the store, would tie the respondent page to the store's
  signing scheme.
- Logo validation (src/lib/logo.ts, tested): the PNG signature; an SVG root element after an
  optional declaration, comments or doctype; an SVG with a script element, an event handler
  attribute, a javascript: reference or a foreignObject is refused, not cleaned, so the person
  always gets the file they uploaded. Up to 1 MB.
- Settings (src/app/app/(shell)/settings): the brand card with the form for owners (the
  contrast line follows the field as typed) and the values for members, the AI budget card
  ("EUR 50.00 per month, EUR [SPENT] used this month" from ai_run.cost_eur_cents this month,
  aiRuns.costThisMonthCents) and the Plan card, above the Members section of E2-4.
- Copy: docs/copy/app.md (Settings, brand and budget) and errors.md. Design note 18 has the
  screenshots.
