# E12-5 A question bubble on the landing page that emails Mihai

User: a visitor with a question before signing up
Status: built
Outcome: a visitor asks a question from the landing page without leaving it, and the
question reaches Mihai's inbox with the visitor's address to reply to.

## Acceptance criteria
1. A round 56 px button sits at the bottom right of the landing page (/landing-page, and /
   once the landing moves there), 16 px from the edges on a phone and 24 px on the desktop,
   above the page and under nothing. Its accessible name is "Ask us a question". At 390 and
   1440 it covers no button or link of the page, at the top and at the bottom of the page. It
   is not shown when NEXT_PUBLIC_SUPPORT_EMAIL is unset, so the app still runs from `docker compose up`.
2. The button opens a panel (360 px wide on the desktop, the full width of the screen on a
   phone, anchored to the bottom): the title, one line saying how and when Mihai replies, the
   fields "Your email" and "Your question", the privacy line with its link, and Send. Focus
   moves to the email field when it opens and back to the button when it closes; Escape and
   the close button close it. Typed text stays when the panel is closed and opened again.
3. Send posts JSON to /api/support (16 KB at most, the media type exactly
   application/json, src/lib/request-json.ts). The server checks the email is an address, the
   question is 1 to 2000 characters, and a hidden field a person never fills is empty (a bot
   that fills it gets the same "Sent" and nothing is mailed). At most 5 messages per address
   per hour, counted in memory as the passcode attempts are (E6-1).
4. The server sends one email to NEXT_PUBLIC_SUPPORT_EMAIL through the mail transport (src/lib/mail.ts)
   with Reply-To set to the visitor's address, so Mihai answers from his inbox
   (docs/copy/emails.md). The message is text only, the question as written; nothing is
   stored in the database, and neither the address nor the question is logged.
5. The panel's states each have their words (docs/copy/landing.md, Question bubble):
   sending, sent (kept until the panel closes), a field missing or too long, the send failed
   (with the plain address to write to instead), and too many messages.
6. Nothing in the bubble calls a model or says "AI" (decision 0046; CLAUDE.md, a feature
   the product does not have is not described).
7. The privacy page (E11-3) names these messages: what is kept (nothing in the app; the
   email in Mihai's inbox), why, and for how long, with a "[LAWYER: confirm ...]" marker.
8. Tests: unit tests for the checks, the hidden field, the limit and the email built with
   Reply-To; one Playwright test at 390 by 844 and 1440 by 900 opens the bubble, sends a
   question and sees the sent line, and Mailpit holds the email with the Reply-To.

## Out of scope
- An assistant that answers: a separate story with its own spend decision (decision 0039).
- The bubble inside the signed-in app or on respondent links.
- A support inbox in /admin: E14, if Mihai wants one.

## Open questions
- None. Answered 2026-10-05 (decision 0049): no "AI" anywhere, "Ask us a question"; the
  questions go to Mihai's own address in .env.local until the launch gate, then
  hello@smesay.app; the panel promises a reply by email within one working day.

## Technical notes
The landing page is a server page with no JavaScript beyond its islands (E12-1); the bubble
is one client island loaded after the page, so the Lighthouse scores of E12-1 hold. The icon
comes from lucide-react, already a dependency (decision 0041 allows free-licensed icons).
NEXT_PUBLIC_SUPPORT_EMAIL is named in E11-6 for the error pages and is already in
.env.example; this story uses the same variable and names it in docs/accounts.md. No table: a table would need a workspace_id
(CLAUDE.md, data rules), and an email is enough to answer.

Built 2026-10-05 (design note 94, decision 0044):
- Acceptance 1: src/app/landing-page/question-bubble.tsx, rendered by the landing page only
  when NEXT_PUBLIC_SUPPORT_EMAIL is set. 56 px, 16 px from the edges under 768 px and 24 px
  from it, z-index above the page. The footer keeps 96 px under its last line on a phone so the
  bubble covers none of its links. e2e/question-bubble.spec.ts checks every visible link and
  button against the bubble at the top and the bottom of the page, at 390 by 844 and 1440 by
  900: none is covered.
- Acceptance 2: a non-modal dialog, 360 px from 768 px and the full width on a phone,
  anchored to the bottom; focus to "Your email" on opening and back to the button on closing;
  Escape and Close close it; the panel stays mounted while hidden, so the text is kept.
- Acceptance 3: POST /api/support (src/app/api/support/route.ts) reads JSON with readJson;
  src/lib/support.ts checks the address (the app's own address check), the question (1 to
  2000 characters after trimming) and the hidden "website" field. Limits: 5 an hour per
  address and, added here, 20 an hour per connection, so typing new addresses cannot fill the
  inbox (docs/review-list.md).
- Acceptance 4: one text-only email 5 to NEXT_PUBLIC_SUPPORT_EMAIL with Reply-To the visitor,
  through sendMail (Mail.html is now optional); nothing stored, nothing logged.
- Acceptance 5: the words are SUPPORT_COPY (src/lib/support-copy.ts) from docs/copy/landing.md;
  the length line reads "2,000" as the app writes numbers.
- Acceptance 6: no model call and no "AI" in the bubble (a unit test checks the words).
- Acceptance 7: docs/legal/privacy.md, "Questions sent from the landing page", with a LAWYER
  marker.
- Acceptance 8: src/lib/support.test.ts (7 tests: fields, hidden field, the page path, both
  limits, email 5 with Reply-To and no HTML, the words); e2e/question-bubble.spec.ts at both
  sizes (Mailpit holds the email; its Reply-To header names the visitor). CI and the
  Playwright server set NEXT_PUBLIC_SUPPORT_EMAIL to hello@smesay.app, the error pages' own
  default, so nothing else changes. docs/accounts.md step 11c names the variable.
