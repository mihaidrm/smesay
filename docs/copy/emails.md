# Transactional emails

The four emails the product sends (docs/design-system.md, Email: sign-in, invite, reminder,
submission receipt). Layout rules are in the design system: 600 px, one column, the mark at
22 px, one violet button, footer with the company name, the registered address and the
privacy policy link. Built in src/lib/mail/templates/ on one frame (layout.ts, stories/E12-3);
filled samples: `npm run email:samples` writes docs/design-notes/prototype-01/email-*.html. Every email also carries the link as plain text under the button, for
clients that strip buttons. Mihai tests them in Gmail, Outlook and Apple Mail (E12).

Placeholders in [CAPS] are filled by the app.

Footer, all four emails:
SMEsay, by Alerty S.R.L.
[REGISTERED ADDRESS] (COMPANY_ADDRESS, set at the launch gate once the lawyer confirms it; the
line is left out while it is unset)
[Privacy policy]

## 1. Sign-in link

Sent by E2 when someone enters their email on the sign-in page, and to an address an owner
invites from Settings, Members (E2-4). Nothing else is sent to a PM.

From: SMEsay <sign-in@[DOMAIN]>
Subject: Your sign-in link for SMEsay
Preheader: Works once, for [N] minutes.

Body:
Hi,

Here is your link to sign in to SMEsay. It works once and stops working in [N] minutes.

Button: Sign in

[SIGN-IN LINK as plain text]

If you did not ask for this link, ignore this email. Nobody can sign in without it.

[N] is 15 minutes (stories/E2-1). The value is set in E2 and the email reads the same value,
so they cannot drift.

## 2. Personal invite

Sent by E6 when the PM adds a person to the personal invites and presses Send. One email per
person. The link resumes on any device.

From: [PM NAME] via SMEsay <[EMAIL_FROM address]> (one sender address for the app, docs/review-list.md; [PM NAME] is the PM's name, or their email when no name is set)
Reply-to: [PM EMAIL]
Subject: [PM NAME] asks for your view on [PROJECT NAME]
Preheader: [ITEM COUNT] items, about [MINUTES] minutes, on your phone or laptop. (1 item when the list has one)

Body:
Hi [RESPONDENT NAME], (Hi, when the invite has no name)

[PM NAME] at [WORKSPACE NAME] is checking a list of [ITEM COUNT] requirements for
[PROJECT NAME] and wants your view. (a list of 1 requirement when the list has one)

[PM INTRO, the text from Build, up to three lines]

For each item you say whether you agree with the proposed priority, or what it should be and
why. It takes about [MINUTES] minutes. You can stop and come back; your answers are saved as
you go. No account is needed.

Button: Open your link

[PERSONAL LINK as plain text]

This link is yours. Do not forward it; answers sent through it are recorded under your name.
It opens on [OPEN DATE AND TIME, with time zone]. (only when the link opens after the send)
It closes on [CLOSE DATE AND TIME, with time zone].

Reply-to is the PM's own address, so questions go to the person who knows, and the sender
name is the PM's (decision 0031).

## 3. Reminder

Sent by E6 when the PM presses Remind on a personal invite that is not submitted. At most one
every three days per person (PM app board, Share step). Never sent automatically.

From: [PM NAME] via SMEsay <[EMAIL_FROM address]> (as email 2)
Reply-to: [PM EMAIL]
Subject: Reminder: [PROJECT NAME] closes on [CLOSE DATE]
Preheader: [ANSWERED] of [ITEM COUNT] answered so far.

Body:
Hi [RESPONDENT NAME], (Hi, when the invite has no name)

[PM NAME] is still waiting for your answers on [PROJECT NAME]. The link closes on
[CLOSE DATE AND TIME, with time zone]. (the clause and the subject's "closes on" are dropped
when the link has no close date, which Publish does not allow)

[One of:]
You have not started yet.
You answered [ANSWERED] of [ITEM COUNT] items. Your answers are saved; pick up where you left
off. (1 item in the singular)

Button: Carry on

[PERSONAL LINK as plain text]

If you cannot take part, reply to this email and say so, and [PM NAME] will stop reminding you.

## 4. Submission receipt

Sent by E7-5 on a personal invite's first Submit, to the invite's address (the one the PM
chose). Never to an address typed on a public link, an email field included: anyone could
type any address and send mail through SMEsay (docs/review-list.md). A later Submit sends
none; there, and on a public link, the Done screen is the receipt. It goes after the Submit's
reply; one that fails to send does not undo the Submit.

From: SMEsay <[EMAIL_FROM address]> (the app's one sender address, as email 2)
Subject: Your answers on [PROJECT NAME] were submitted
Preheader: [ITEM COUNT] items, submitted [DATE AND TIME].

Body:
Hi [RESPONDENT NAME],

Your answers on [PROJECT NAME] for [WORKSPACE NAME] were submitted on
[DATE AND TIME, with time zone].

[ITEM COUNT] items answered. [PUSHED BACK] with a different priority, [DISAGREED] not needed,
[UNCLEAR] marked unclear, [MISSING] missing items suggested. Confidence [CONFIDENCE] of 5.
(A list that does not show the proposed priority, rate-blind: [RATED] rated in place of
"[PUSHED BACK] with a different priority", since there was nothing to differ from.)

You can change your answers until the link closes on [CLOSE DATE AND TIME]. Open the same link
and press Change my answers. (A link with no close date: You can change your answers while the
link is open. Open the same link and press Change my answers.) (Built in E7-5:
src/lib/mail/templates/receipt.ts; the subject, the preheader and the counts as here; the date and
time in UTC.)

Button: See your answers

[LINK as plain text]

The receipt lists the counts with the link, not the answers (decision 0031).

## 5. Question from the landing page (E12-5, proposed; to SMEsay, not to a user)

Sent to SUPPORT_EMAIL when a visitor sends a question from the landing page's bubble.
Plain text, no design, nothing stored in the app (decision 0046).

From: SMEsay <no-reply@[DOMAIN]>
Reply-To: [VISITOR EMAIL]
Subject: Question from the landing page: [VISITOR EMAIL]

Body:
[THE QUESTION, as written]

Sent from [PAGE ADDRESS] on [DATE AND TIME UTC]. Reply to this email to answer.

## 6. Workspace deleted (E11-2; to the owner who deleted it, once the removal job has run)

Sent by `npm run jobs:purge` after every row and file of the workspace is gone
(src/lib/mail/templates/deletion.ts). No button: there is nothing to do.

Subject: [WORKSPACE] was deleted

Body:
Hi,

Everything in [WORKSPACE] was deleted on [DATE, HH:MM] UTC.

Its projects, responses, files and members are removed. Nothing in it can be brought back.

[FOOTER]

## Not sent

- No welcome email, no tips, no digest, no "your link was opened" notices. Decision 0003 and the
  design system limit email to users to the four above, and E11-2 adds email 6, the deletion
  confirmation its acceptance 3 asks for; email 5 goes to SMEsay's own inbox.
- No email to the PM when a response arrives; the dashboard is live (E8).
- No email when the link closes. The PM set the date; the dashboard shows it.
