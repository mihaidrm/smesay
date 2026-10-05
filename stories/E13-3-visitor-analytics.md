# E13-3 Visitor analytics on the landing page and the PM app, no cookies

User: Mihai, seeing who comes to the page and what they click
Status: built
Outcome: page views, referrers and the clicks that matter on the landing page and in the PM
app, without cookies or personal data, switched on only when the account exists.

## Acceptance criteria
1. Plausible's script in the marketing and PM app layouts only when PLAUSIBLE_DOMAIN and
   PLAUSIBLE_SCRIPT_SRC are set
   (docs/accounts.md step 11, at the launch gate); never on respondent pages or the sample
   instrument (the respondent side carries the PM's brand, not ours, and respondents did not
   choose us). Locally nothing loads and the app runs unchanged (decision 0006).
2. Goals sent as custom events: landing "Start free" click, "Try the sample" click,
   sign-up completed, first project created, first instrument published; the Plausible
   documentation on custom events is read when the story starts and cited here (unverified
   until then).
3. No cookie banner: Plausible sets no cookies (plausible.io documentation, read and cited
   when the story starts). The privacy policy (E11-3) names Plausible as a subprocessor and
   says what it collects.
4. UTM parameters on links Mihai posts (Phase 4 content) show up in Plausible's sources; the
   sign-up page keeps the UTM through the magic link flow and stores the first source on the
   workspace (`first_source` text, migration 0029) so the admin page (E13-2) can
   show where paying workspaces came from.
5. A Playwright test checks the script tag is absent when the variable is unset and present
   when set.

## Out of scope
- Session recordings, heatmaps: not in R1.
- Analytics on respondent pages: the first-party events of E13-1 only.

## Open questions
- None.

## Technical notes
Plausible is the plan's choice (docs/business-plan.pdf page 8, EUR 9 per month); a
self-hosted alternative is not needed while the account is personal. The script loads from
plausible.io, so the CSP (E11-5) allows that host.

Built 2026-10-05 (design note 84, decision 0044). Plausible's documentation read the same day
and cited in src/lib/plausible.ts: plausible.io/docs/plausible-script (the snippet is shown in
the site's settings), plausible.io/docs/custom-event-goals (plausible(name)),
plausible.io/docs/events-api (POST /api/event with domain, name, url, the visitor's
User-Agent and X-Forwarded-For) and plausible.io/data-policy (no cookies, a daily salted hash,
no stored IP address).
- Acceptance 1: src/components/analytics/plausible-script.tsx on the landing page, sign-in,
  the legal pages, the workspace step and the app shell; not on /r, /sample or /admin. It
  renders only when both variables are set and the script is on plausible.io
  (src/lib/plausible.ts); the policy then allows plausible.io in connect-src (src/proxy.ts).
  The snippet's exact form (a second tag or an init line) is checked at the gate
  (docs/accounts.md step 11, docs/review-list.md).
- Acceptance 2: Start free and Try the sample are click goals (GoalLink); Sign up shows on
  the workspace step (GoalOnOpen); First project and First instrument published go from the
  server to the Events API when the workspace's first project_created or instrument_published
  event (E13-1) is written, after the response.
- Acceptance 3: no cookie from Plausible (its data policy); docs/legal/privacy.md and
  subprocessors.md name it with lawyer markers, as planned for launch.
- Acceptance 4: utm_source from the landing page to /sign-in, through the magic link's
  callback (/app/new?source=...) to the workspace step's hidden field, cleaned to a short
  token (src/lib/utm.ts) and stored as workspace.first_source; the admin page shows it
  ("direct" without one).
- Acceptance 5: e2e/visitor-analytics.spec.ts checks the script is absent with the variables
  unset and follows a source to the admin page; "present when set" is a unit test
  (src/lib/plausible.test.ts), because the e2e server's variables are fixed for the run.
