# E16-2 The getting-started series for people who signed up and have not published

User: a person who signed in to SMEsay, maybe named a workspace, and then stopped before a
validation went out
Status: built
Outcome: four short emails over two weeks, each pointing at the next step the person has not
taken, stopping the moment they publish a validation, turn the emails off or stop them from
an email.

## Acceptance criteria
1. The series (emails 11a to 11d in docs/copy/emails.md), one per step, each once, sent by
   `npm run jobs:emails` to a person whose sign-up is older than the step's age and who has
   not published: 1 day, "Your first validation in ten minutes" (name the workspace if none,
   else import a list, or open the sample); 3 days, "Three ways to get your list in", only
   while no list of theirs is imported; 7 days, "Send [PROJECT] to three people" (their newest
   project, else "your list"), only while nothing is published; 14 days, "What got in the
   way?", reply-to the support address. A step whose condition no longer holds is skipped, not
   sent later.
2. "Published" is any invite row (public or personal) in a workspace the person belongs to.
   From then on nothing in the series is sent to them.
3. Every email of the series has the Stop link and headers of E16-1 (kind: guide) and is
   not sent when the person's "Getting started" switch is off.
4. The series is sent only when LIFECYCLE_EMAILS=on (a server variable, unset locally and
   until the lawyer confirms the privacy policy's new paragraph, design note 132); with it
   unset the job counts the due emails and sends none.
5. A person who typed an email on the sign-in page and never opened the link has no account
   and gets nothing (the sign-in link's row is deleted within an hour, docs/legal/privacy.md).
6. Tests: unit tests for the step logic (which step is due for a person at a given age and
   stage, once each, none after publishing, none with the switch off), the templates (no
   placeholder left), and the gate.

## Out of scope
- Trial emails ("your trial ends in 3 days", "your trial ended"): no plan has a trial and no
  row holds a trial's end (decision 0008, free while validating). The series is written so
  those two join it as steps keyed on the trial's end date when a trial exists; their copy is
  drafted in docs/copy/emails.md under "When a trial exists" and not sent.
- Emails to people who never signed in (acceptance 5).
- A/B variants, open tracking, click tracking: none; Plausible counts the sign-ins the emails
  bring through the link's source parameter only.

## Open questions
- None for the build. The lawyer confirms the privacy policy's paragraph before
  LIFECYCLE_EMAILS is set (docs/legal/lawyer-review.md, L31).

## Built
Built 2026-10-12 (decision 0067, design note 132), behind LIFECYCLE_EMAILS. Tests:
src/lib/notifications.test.ts (the series), src/lib/mail/templates/templates.test.ts.

## Technical notes
- The steps are pure: seriesStep(person, now) in src/lib/notifications.ts, given the sign-up
  date, the furthest stage (none, workspace, list, published) and the steps already sent.
- The sign-up date is user.created_at; the stage comes from the person's memberships
  (src/db/queries/internal.ts: has a workspace, has an item set, has an invite).
- Links carry ?from=email-[step] so Plausible's sign-in goal can be read per step (E13-3).
