# E7-1 Open a link, fill the mandatory fields, start

User: an expert who got a link on their phone
Status: built
Outcome: the link opens without an account on any current browser, About you takes the
fields the PM asked for, and Start lands on the first chapter.

## Acceptance criteria
1. /r/[token] renders the About you page (respondent board, note 12): the PM's logo and name
   in the header with the note "Closes [DATE]", the intro, the fields from the instrument
   (E5-1), the perspectives question when defined (E5-4), Start, and "Powered by SMEsay".
   Public link first visit asks the fields; a personal link shows "Welcome back, [NAME]" with
   name and role already set (E6-2 already shows "Answering as [NAME], [ROLE]" above the
   fields and does not ask them; "Welcome back" waits for answers to exist).
2. Start is disabled at 40 percent with "Fill in your name and role to start." (or "Fill in
   the required fields to start." when the mandatory fields are not exactly Name and Role,
   decision 0043) until every mandatory field is filled; mandatory is per field (E5-1). Dropdown fields render as a
   native select at 48 px.
3. Link states each have a page (CLAUDE.md, respondent side): not yet open, closed, revoked,
   unknown token, passcode required, passcode attempts exceeded (E11-1), all with the copy in
   docs/copy/errors.md. A closed public link shows no per-device state; a closed personal link
   shows the respondent's own state (note 12, finding 33).
4. Works without an account on iOS Safari, Android Chrome, desktop Chrome, Edge and Firefox:
   Mihai checks iOS and Android on his devices (decision 0004); Playwright runs Chromium at
   390 by 844 and 1440 by 900.
5. The desktop layout is the same flow in a centered card on every step: 720 px for About
   you, done, closed and inactive, 1000 px for a chapter and 760 px for the Wrap up, with the
   actions centered in its bottom band and "Powered by" under the card (decisions 0051 and
   0052; docs/design-system.md, Respondent columns).
6. Playwright: open the sample link, fill name and role, start, see the first chapter.

## Out of scope
- Rating: E7-2. Autosave: E7-3. Theming details beyond logo and accent: E7-7.

## Open questions
- None. A closed public link shows no per-device state (decision 0031); unsubmitted answers
  reach the dashboard marked as not submitted, with a PM switch to exclude them (decision
  0030).

## Technical notes
The header's logo comes from E2-5: `workspaces.publicBrand()` and the logo at
/brand/[workspaceId]/logo (24 px). The accent is `effectiveAccent()` in src/lib/brand-rules.ts
(ink under 4.5:1 on white); where it is painted is E7-2, E7-4 and E7-7.
Every workspace's sample project (E2-3) carries working invite tokens and an instrument with
fixed dates (src/db/seed/sample.ts); this story must not let those links collect answers from
outsiders: the sample instrument is treated as not published to the public (E8-8, acceptance 2).
The respondent app lives under src/app/r/[token]/ and never imports the PM app's session
helpers: access is by token (E1-3, out of scope note). The device token for a public link is
created on Start and stored in a cookie scoped to /r/[token] (E7-3).

Built 2026-10-04 (design note 50, decision 0044):
- Acceptance 1: /r/[token] renders About you with the header (the workspace's logo at 24 px
  or its initials, the name, "Closes [DATE]"), the intro, the PM's fields, the perspectives
  question, Start and "Powered by SMEsay" (src/app/r/[token]/page.tsx, respondent-app.tsx,
  src/components/respondent/about-you.tsx and respondent-header.tsx). A personal link shows
  "Answering as" and does not ask the carried fields; "Welcome back" with the count is E7-4's.
- Acceptance 2: Start disabled at 40 percent with the hint until the mandatory fields are
  filled (E5-1, decision 0043); the server checks the same and more
  (src/lib/respondent-rules.ts parseFieldValues); dropdowns are native selects at 48 px.
- Acceptance 3: every link state has its page (unknown, not yet open, closed, revoked,
  passcode, attempts exceeded, and the sample's own page); a closed public link shows no
  per-device state; a closed personal link whose respondent answered at least one item and
  did not submit shows the respondent's own count.
- Acceptance 4: Playwright runs Chromium at 390 by 844 and 1440 by 900
  (e2e/respondent-start.spec.ts); Mihai checks iOS and Android on his devices.
- Acceptance 5: About you sits in a 560 px column on the desktop; a chapter in 1000 px with
  two card columns. Since 2026-10-05 (decision 0051) the short pages are a centered 720 px card
  (src/components/respondent/frame.ts) with Start centered in its footer and "Powered by" last.
- Acceptance 6: e2e/respondent-start.spec.ts opens a published project's link (the sample's
  link collects nothing, docs/review-list.md), fills Name and Role, starts, sees the first
  chapter with its cards, reloads onto the same chapter, and sees the sample link's page.
- Start: POST /r/[token]/start (start/route.ts) creates the response (one per personal
  invite, under the invite row's lock; one per device on the public link, keyed by the
  device cookie) or updates its fields; src/lib/respondent.test.ts covers the rules, the
  race on a personal link, the cookie, and the refusals on passcode, sample, not-yet-open,
  closed and revoked links.
