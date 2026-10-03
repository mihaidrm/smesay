# Transactional emails

The four emails the product sends (docs/design-system.md, Email: sign-in, invite, reminder,
submission receipt). Layout rules are in the design system: 600 px, one column, the mark at
22 px, one violet button, footer with the company name, the registered address placeholder and the
privacy policy link. Every email also carries the link as plain text under the button, for
clients that strip buttons. Mihai tests them in Gmail, Outlook and Apple Mail (E12).

Placeholders in [CAPS] are filled by the app.

Footer, all four emails:
SMEsay, by Alerty S.R.L. [REGISTERED ADDRESS, lawyer confirms in E11]
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

From: [PM NAME] via SMEsay <invites@[DOMAIN]>
Reply-to: [PM EMAIL]
Subject: [PM NAME] asks for your view on [PROJECT NAME]
Preheader: [ITEM COUNT] items, about [MINUTES] minutes, on your phone or laptop.

Body:
Hi [RESPONDENT NAME],

[PM NAME] at [WORKSPACE NAME] is checking a list of [ITEM COUNT] requirements for
[PROJECT NAME] and wants your view.

[PM INTRO, the text from Build, up to three lines]

For each item you say whether you agree with the proposed priority, or what it should be and
why. It takes about [MINUTES] minutes. You can stop and come back; your answers are saved as
you go. No account is needed.

Button: Open your link

[PERSONAL LINK as plain text]

This link is yours. Do not forward it; answers sent through it are recorded under your name.
It closes on [CLOSE DATE AND TIME, with time zone].

Reply-to is the PM's own address, so questions go to the person who knows, and the sender
name is the PM's (decision 0031).

## 3. Reminder

Sent by E6 when the PM presses Remind on a personal invite that is not submitted. At most one
every three days per person (PM app board, Share step). Never sent automatically.

From: [PM NAME] via SMEsay <invites@[DOMAIN]>
Reply-to: [PM EMAIL]
Subject: Reminder: [PROJECT NAME] closes on [CLOSE DATE]
Preheader: [ANSWERED] of [ITEM COUNT] answered so far.

Body:
Hi [RESPONDENT NAME],

[PM NAME] is still waiting for your answers on [PROJECT NAME]. The link closes on
[CLOSE DATE AND TIME, with time zone].

[One of:]
You have not started yet.
You answered [ANSWERED] of [ITEM COUNT] items. Your answers are saved; pick up where you left
off.

Button: Carry on

[PERSONAL LINK as plain text]

If you cannot take part, reply to this email and say so, and [PM NAME] will stop reminding you.

## 4. Submission receipt

Sent by E7 when a respondent submits, only when their email is known: a personal invite, or an
email field the PM asked for in Build. On a public link with no email field, nothing is sent;
the submitted screen is the receipt.

From: SMEsay <no-reply@[DOMAIN]>
Subject: Your answers on [PROJECT NAME] were submitted
Preheader: [ITEM COUNT] items, submitted [DATE AND TIME].

Body:
Hi [RESPONDENT NAME],

Your answers on [PROJECT NAME] for [WORKSPACE NAME] were submitted on
[DATE AND TIME, with time zone].

[ITEM COUNT] items answered. [PUSHED BACK] with a different priority, [DISAGREED] not needed,
[UNCLEAR] marked unclear, [MISSING] missing items suggested. Confidence [CONFIDENCE] of 5.

You can change your answers until the link closes on [CLOSE DATE AND TIME]. Open the same link
and press Change.

Button: See your answers

[LINK as plain text]

The receipt lists the counts with the link, not the answers (decision 0031).

## Not sent

- No welcome email, no tips, no digest, no "your link was opened" notices. Decision 0003 and the
  design system limit email to the four above.
- No email to the PM when a response arrives; the dashboard is live (E8).
- No email when the link closes. The PM set the date; the dashboard shows it.
