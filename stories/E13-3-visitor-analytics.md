# E13-3 Visitor analytics on the landing page and the PM app, no cookies

User: Mihai, seeing who comes to the page and what they click
Status: ready
Outcome: page views, referrers and the clicks that matter on the landing page and in the PM
app, without cookies or personal data, switched on only when the account exists.

## Acceptance criteria
1. Plausible's script in the marketing and PM app layouts only when PLAUSIBLE_DOMAIN is set
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
   workspace (`first_source` text, migration 0002 or later) so the admin page (E13-2) can
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
