# E2-5 Workspace settings: name, logo, accent colour

User: the workspace owner making instruments carry the company's name and colour
Status: built
Outcome: logo and colour appear on every instrument of the workspace as soon as they are
saved.

## Acceptance criteria
1. Settings (PM app board): workspace name; logo upload (PNG or SVG, up to 1 MB, stored in the
   S3-compatible bucket, shown at 24 px in the respondent header in place of the mark); accent
   colour as a hex field with a swatch; the Plan card with the usage line (E2-6). The AI
   budget is not on the page (decision 0036): it will be set and seen in the admin area only
   (E14-2, not built yet), default 10.
2. An accent under 4.5:1 on white shows the banner "This colour is too light on white, so the
   respondent page uses the default. Pick a darker one to use yours." and the respondent side
   uses ink (docs/design-system.md, respondent theming; Brand 06). The check uses
   src/lib/contrast.ts.
3. The respondent side uses the accent on the selected answer, the active chapter and the
   progress bar, and from E7-7 on the confidence picked on the Wrap up and the header's
   initials when there is no logo (decision 0016, amended 2026-10-04); buttons stay ink.
   "Powered by SMEsay" stays on the Free plan (design system, Identity).
4. Every field validates on the server (CLAUDE.md, PM side): name 1 to 80 characters, hex
   colour as #RRGGBB, logo type and size by content, not extension. Saving is owner-only through
   `can()` (E2-4, src/lib/permissions.ts: workspace.rename, workspace.accent, workspace.logo);
   a test calls the save as a member and gets 403.
5. Playwright: change the accent and see it saved with its contrast line; the colour on the
   respondent's screens is checked by E7's test (e2e/respondent-a11y.spec.ts), since the
   sample has no preview (decision 0021, item 1; changed 2026-10-04 with E5-6).

## Out of scope
- Billing and plan changes: R3. The AI budget may become credits bought from SMEsay (decision
  0036, point 3).
- Workspace deletion and export: E11-2.

## Open questions
- None.

## Technical notes
Built 2026-10-02, with acceptance 3 and the respondent half of acceptance 5 deferred: the
respondent page and the preview do not exist yet (E7-1, E5-6), so this story ships the
settings, the storage and the rule; the respondent side applies them where each part lives:
the header logo in E7-1, the selected answer in E7-2, the chapter row and the progress bar
with the Playwright check of the colour in E7-4, the fallback in E7-7, the preview in E5-6
(each story carries its criterion). The deferral waits for Mihai's acceptance (raised
2026-10-02). The Playwright test of this story covers the settings page itself: rename, upload,
accent, the contrast line, the banner, the logo served by the route.

- Columns on workspace: accent_hex, logo_object_key, ai_budget_eur (docs/schema.md). The save
  is `saveBrand()` in src/lib/brand.ts: owner-only through can() (workspace.rename,
  workspace.accent, workspace.logo; src/lib/brand.test.ts calls it as a member and gets 403),
  every field validated on the server (name 1 to 80, accent as #RRGGBB or empty, the logo by
  content). The accent is stored as typed, upper-cased; `effectiveAccent()` in
  src/lib/brand-rules.ts gives the respondent side the accent when it reaches 4.5:1 on white
  (src/lib/contrast.ts), violet when none is set (teal before design v2, decision 0041), and ink when it is too light (acceptance 2,
  decision 0016, Brand 06), and Settings shows the banner from docs/copy/errors.md. The brand
  lives on the workspace row, so a save applies to every instrument at once, published ones
  included.
- Uploads go through src/lib/storage.ts: @aws-sdk/client-s3 3.1145.0 (Apache-2.0, released
  2026-10-01; open issue count unverified, the GitHub API outside the project is not reachable
  from the session) against RustFS locally and in CI (a service container in ci.yml) and
  Cloudflare R2 at the launch gate, path-style addressing, the bucket created on first use;
  `S3_ENDPOINT=memory:` keeps objects in the process for the unit tests. Objects are
  logos/<workspace id>/<16 hex>.<png|svg>; the old object is removed after a save.
- The logo is served by a public route, /brand/[workspaceId]/logo (src/app/brand/.../route.ts),
  not a signed URL: the respondent page shows it to people with no session, the route reveals
  nothing but the logo, and an hour of caching with a version in the URL keeps it fast. It is
  served under "default-src 'none'; sandbox" with nosniff, so a file runs and loads nothing
  when opened directly. The alternative, signed URLs from the store, would tie the respondent
  page to the store's signing scheme. E11-1 put the route in the rate-limited set (src/proxy.ts).
- Logo validation (src/lib/logo.ts, tested): the PNG signature; an SVG root element after an
  optional declaration, comments or doctype; an SVG with a script element in any namespace, an
  event handler attribute, a javascript: or data: reference, a foreignObject or an animation
  aimed at an href, after numeric character references are decoded, is refused, not cleaned,
  so the person always gets the file they uploaded. It is a text filter, not a parser; the
  route's policy is what makes the served file inert. Up to 1 MB, checked in the browser before
  the upload and on the server; the server action's body cap is raised to 2 MB in next.config.ts
  so the file reaches the app's own message.
- Settings (src/app/app/(shell)/settings): the brand card with the form for owners (the
  contrast line follows the field as typed) and the values for members, and the Plan card
  with the usage line, above the Members section of E2-4. The AI budget card built with the
  story was removed on 2026-10-03 (decision 0036, design note 31).
- Copy: docs/copy/app.md (Settings, brand and plan) and errors.md. Design note 18 has the
  screenshots.
- Audit of 2026-10-02 (fresh context, 18 findings): the two blocking ones (the fallback was teal
  where every source says ink; a logo over 1 MB hit Next's body cap before the app's message)
  and the should-fix ones (the sample's AI runs counted as spent, closed by E2-6's usage();
  the SVG filter missed namespaced scripts and character references; a failed bucket check
  stayed cached; copy that described E4-1 and a save that only applied to new instruments; the
  deferred criteria had no story) were closed the same day in the pull request after E2-6's.
  Open for Mihai: the deferral itself; the board's 28 px logo against the story's 24 px; whether
  "falls back to ink" and errors.md's "uses the default" should say the same word.
