# 132 Emails to the PM and the getting-started series, 2026-10-12

Mihai, 2026-10-12: build the four emails Claude recommended and "the free trial emails and
reminders" for people who signed in and did not convert (decision 0067).

## What is sent, to whom, when

| Email | To | When | Switch |
|---|---|---|---|
| 7 Closing summary | every member of the workspace | within the hour after the validation's link closes | validations, on by default |
| 8 Everyone has submitted | every member | on the Submit that completes the personal invites | validations |
| 9 Daily digest | the members who turned it on | once a day, only after a day with a new submission | digest, off by default |
| 10 Workspace invitation | the person invited | at once, in place of the sign-in email | none, transactional |
| 11a to 11d Getting started | the person, 1, 3, 7 and 14 days after sign-up | hourly job, each step once, until a validation is published | getting started, on by default; LIFECYCLE_EMAILS |

"Closed" for email 7: the public link's close date has passed and the link was not revoked,
or there is no public link and every personal invite's close date has passed. A revoke is not
a close: the PM did it and saw it. The job looks 48 hours back, so a validation that closed
before the feature existed sends nothing.

Recipients of 7, 8 and 9 are the workspace's members, not only the person who published: in
R1 a workspace is one to five people working on the same lists, and the invite rows carry no
sender. A member who does not want them has the switch.

## The series

Four steps, one email each, every step keyed on the next thing the person has not done:
- Day 1: no workspace named: name it and open the sample; a workspace but no list: import a
  list, three ways. Subject "Your first validation in ten minutes".
- Day 3, only while no list of theirs is imported: "Three ways to get your list in" (upload an
  xlsx or csv, paste from a sheet, try the sample's).
- Day 7, only while nothing is published: "Send [PROJECT] to three people": what Share does
  (one public link, personal invites by email, Remind with one button, a close date).
- Day 14, only while nothing is published: "What got in the way?", a two-line email with
  reply-to the support address and no button.

A step whose condition has passed is skipped, not sent late: a person who imports on day 2
gets day 7's email, not day 3's. Publishing ends the series. The step ages are Claude's
(docs/review-list.md): the first within a day while the sign-in is fresh, the last at two
weeks, after which an unanswered person is left alone.

Trial emails: there is no trial (decision 0008). When a plan has one, two steps join the
series keyed on the trial's end date: "Your trial ends in 3 days" and "Your trial ended";
their copy is in docs/copy/emails.md under "When a trial exists", marked not sent.

## Stopping

Every email of 7, 8, 9 and 11 ends with "You get this email because [REASON]. Stop these
emails: [LINK]". The link is /email/stop?t=[TOKEN]&k=[KIND]: the token is 32 hex characters
from randomBytes(16), one per person, made the first time an email needs it and kept in
user.email_state; the kind is validations, digest or guide. GET shows one question with one
button, so a mail client that opens links ahead of the reader stops nothing; POST stops the
kind and says so. The same address is in the List-Unsubscribe and List-Unsubscribe-Post
headers (RFC 8058, "List-Unsubscribe=One-Click"), so Gmail's and Apple Mail's own unsubscribe
buttons work with a POST and no page. The Settings card "Emails to you" holds the three
switches for a signed-in person.

## The privacy policy

docs/legal/privacy.md lists what is collected and says nothing about the emails the product
sends. The validation emails and the invitation follow from actions in the person's own
workspace (a service message under GDPR Article 6(1)(b), the contract). The series is a
message about the service to a person who signed up for it; Claude's reading is Article
6(1)(f), legitimate interest, with an easy stop in every email, and the ePrivacy soft opt-in
does not apply since nothing is sold. The lawyer confirms. Proposed paragraph for "What we
collect from users", put to the lawyer as L43 in docs/legal/lawyer-review.md:

"Emails from SMEsay. We send you sign-in links and, if you are invited to a workspace, the
invitation. About your own validations we send one email when a validation's link closes
and one when everyone you invited has submitted; a daily summary only if you turn it on.
In your first two weeks, until you publish a validation, we send up to four short emails
on the next step. Each of these emails has a link that stops that kind of email, and
Settings has a switch for each. We do not send newsletters or offers."

Until the lawyer confirms, LIFECYCLE_EMAILS stays unset and the series is counted, not sent.
Confirmed on 2026-10-12: the paragraph is in docs/legal/privacy.md, version 5; the switch is
set when the product goes live.

## Not changed

Decision 0003's rule against a welcome email, tips and a per-response email stands: the
series is about the next step, not a welcome; the digest is opt-in; nothing goes per response.
