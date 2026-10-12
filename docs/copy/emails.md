# Emails

The emails the product sends (docs/design-system.md, Email): the four transactional ones
(sign-in, invite, reminder, submission receipt), the deletion confirmation, and since E16 the
emails to the PM about a validation, the workspace invitation and the getting-started series
(decision 0067, design note 132). Emails 7, 8, 9 and 11 end with a Stop line and carry the
List-Unsubscribe headers; each has a switch on Settings, Emails to you. Layout rules are in the design system: 600 px, one column, the mark at
22 px, one violet button, footer with the company name, the registered address and the
privacy policy link. Built in src/lib/mail/templates/ on one frame (layout.ts, stories/E12-3);
filled samples: `npm run email:samples` writes docs/design-notes/prototype-01/email-*.html. Every email also carries the link as plain text under the button, for
clients that strip buttons. Mihai tests them in Gmail, Outlook and Apple Mail (E12).

Placeholders in [CAPS] are filled by the app.

Footer, every email:
SMEsay, by Alerty S.R.L.
[REGISTERED ADDRESS] (COMPANY_ADDRESS, set at the launch gate once the lawyer confirms it; the
line is left out while it is unset)
[Privacy policy]

## 1. Sign-in link

Sent by E2 when someone enters their email on the sign-in page, and to an address an owner
invites from Settings, Members (E2-4). Nothing else is sent to a PM.

From: SMEsay <sign-in@[DOMAIN]>
Subject: Your sign-in link for SMEsay
Preheader: The link works once, for [N] minutes.

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
Preheader: The list has [ITEM COUNT] items and takes about [MINUTES] minutes, on your phone or laptop. (1 item when the list has one)

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
Preheader: You have answered [ANSWERED] of [ITEM COUNT] so far.

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
Preheader: You submitted [ITEM COUNT] items on [DATE AND TIME].

Body:
Hi [RESPONDENT NAME],

Your answers on [PROJECT NAME] for [WORKSPACE NAME] were submitted on
[DATE AND TIME, with time zone].

You answered [ITEM COUNT] items. You gave [PUSHED BACK] a different priority, marked
[DISAGREED] not needed and [UNCLEAR] unclear, and suggested [MISSING] missing items. Your
confidence: [WORD] ([CONFIDENCE] of 5). (The word is the one the slider showed: Guessing, Not
very sure, Fairly sure, Confident, Certain; design note 107. A list that does not show the
proposed priority,
rate-blind: "You rated [RATED]" in place of "You gave [PUSHED BACK] a different priority",
since there was nothing to differ from.)

You can change your answers until the link closes on [CLOSE DATE AND TIME]. Open the same link
and press Change my answers. (A link with no close date: You can change your answers while the
link is open. Open the same link and press Change my answers.) (Built in E7-5:
src/lib/mail/templates/receipt.ts; the subject, the preheader and the counts as here; the date and
time in UTC.)

Button: See your answers

[LINK as plain text]

The receipt lists the counts with the link, not the answers (decision 0031).

## 5. Question from the landing page (E12-5, decision 0049; to SMEsay, not to a user)

Sent to NEXT_PUBLIC_SUPPORT_EMAIL when a visitor sends a question from the landing page's bubble.
Plain text, no design, nothing stored in the app (decision 0046).

From: the app's sender address (EMAIL_FROM), as emails 2 to 4
Reply-To: [VISITOR EMAIL]
Subject: Question from the landing page: [VISITOR EMAIL]

Body:
[THE QUESTION, as written]

The visitor sent this from [PAGE ADDRESS] on [DATE AND TIME UTC]. Reply to this email to answer.

## 6. Workspace deleted (E11-2; to the owner who deleted it, once the removal job has run)

Sent by `npm run jobs:purge` after every row and file of the workspace is gone
(src/lib/mail/templates/deletion.ts). No button: there is nothing to do.

Subject: [WORKSPACE] was deleted

Body:
Hi,

Everything in [WORKSPACE] was deleted on [DATE, HH:MM] UTC.

Its projects, responses, files and members are removed. Nothing in it can be brought back.

[FOOTER]

## 7. Closing summary (E16-1; to every member of the workspace with "About your validations" on)

Sent by `npm run jobs:emails` within the hour after a validation's link closes: the public
link's close date passes without a revoke, or, with no public link, the last personal invite's.
Once per validation; a close older than 48 hours when the job first sees it sends nothing.
Built in src/lib/mail/templates/closing.ts.

From: SMEsay <[EMAIL_FROM address]>
Subject: [PROJECT NAME] closed: [SUBMITTED] of [INVITED] submitted (no personal invites: [PROJECT NAME] closed: [N] responses)
Preheader: The link closed on [DATE AND TIME, UTC].

Body:
Hi [MEMBER NAME], (Hi, when the person has no name)

The link for [PROJECT NAME] closed on [DATE AND TIME, UTC].

[SUBMITTED] of the [INVITED] people you invited submitted. [PUBLIC] more answered through the
public link. (no personal invites: [PUBLIC] people answered through the public link; no public
link: the second sentence is left out)

The items with the most disagreement: (left out when every answered item has 100% agreement)
1. [ITEM TEXT, cut at 90 characters] ([X]% agree)
2. ...
3. ...

Button: See the results

[RESULTS LINK as plain text]

Write actions on the Actions tab turns the disagreements into a list of things to decide.

You get this email because you are a member of [WORKSPACE NAME]. Stop these emails: [STOP LINK]

## 8. Everyone has submitted (E16-1; the same members)

Sent after the reply to the Submit that completes the personal invites of a validation (every
invite not revoked has a submitted response; at least one invite). Once per validation; a
failed send never undoes the Submit. Built in src/lib/mail/templates/complete.ts.

Subject: Everyone has submitted on [PROJECT NAME]
Preheader: All [N] people you invited have submitted.

Body:
Hi [MEMBER NAME],

All [N] people you invited to [PROJECT NAME] have submitted. The link closes on [DATE AND TIME,
UTC]; you can close it now from Share, or leave it open for changes until then. (no close date:
The link stays open for changes until you close it from Share.) (a public link still open: The
public link stays open until then.)

Button: See the results

[RESULTS LINK as plain text]

You get this email because you are a member of [PROJECT NAME]'s workspace. Stop these emails: [STOP LINK]

## 9. Daily digest (E16-1; only to a member who turned "Daily digest" on)

Sent by the job at 06:00 UTC, at most once a day, only after a day with at least one new
submission on an open validation of the person's workspaces. Built in
src/lib/mail/templates/digest.ts.

Subject: [N] new responses since yesterday on [PROJECT NAME] (several: [N] new responses since yesterday across [K] validations)
Preheader: the first line below

Body:
Hi [MEMBER NAME],

In the last day:
[PROJECT NAME] ([WORKSPACE NAME]): [NEW] new, [SUBMITTED] of [INVITED] submitted, closes on
[DATE AND TIME, UTC]. (no personal invites: [SUBMITTED] submitted; no close date: no close date)
(one line per validation)

Button: See the results (the first validation's)

[RESULTS LINK as plain text]

You get this email because you turned on the daily digest in Settings. Stop these emails: [STOP LINK]

## 10. Workspace invitation (E16-1; transactional, no switch)

Sent in place of email 1 when a member invites a person from Settings, Members (E2-4); the
link is the same magic link. A person asking for their own sign-in link keeps email 1. Built
in src/lib/mail/templates/invitation.ts; the inviter is the member who pressed Send invite
(their name, or their email with no name), or the workspace's name on an admin's resend of an
old invitation.

From: SMEsay <sign-in@[DOMAIN]>
Subject: [INVITER NAME] invited you to [WORKSPACE NAME] on SMEsay
Preheader: The link works once, for [N] minutes.

Body:
Hi,

[INVITER NAME] ([INVITER EMAIL]) added you to [WORKSPACE NAME], a workspace on SMEsay. SMEsay
checks a list of requirements with the people who will use it: the list goes out as a link,
and the answers come back as a dashboard.

Here is your link to sign in. It works once and stops working in [N] minutes.

Button: Join [WORKSPACE NAME]

[SIGN-IN LINK as plain text]

If you do not know [INVITER NAME], ignore this email. Nobody can sign in without the link.

## 11. The getting-started series (E16-2; to a person with "Getting started" on, until they publish; only with LIFECYCLE_EMAILS=on)

Four emails, one per step, sent by the job at 1, 3, 7 and 14 days after sign-up, each once;
a step whose condition has passed is skipped; publishing a validation ends the series; a
sign-up older than 21 days when the job first sees it gets none. Built in
src/lib/mail/templates/series.ts. Links carry from=email-[STEP]. Every step ends with:
You get this email because you signed up for SMEsay on [DATE]. Stop these emails: [STOP LINK]

11a, day 1. Subject: Your first validation in ten minutes. Preheader: The sample on your
Projects page shows what comes back.
Hi [NAME],
You signed in to SMEsay yesterday. Your workspace, [WORKSPACE NAME], is ready for its first
list. (no workspace: The first step is to name your workspace; it takes a minute.)
The quickest way to see what you get back is the sample: a list of seven expense-tool
requirements with answers from seven people, on your Projects page. Open it, look at the
Results tab, then import a list of your own.
Button: Open SMEsay
Import takes an xlsx or csv, or rows pasted from a sheet. Shape groups and rewrites the
items, Build sets the questions, Share sends the link.

11b, day 3, only while no list of theirs is imported. Subject: Three ways to get your list
in. Preheader: Upload a file, paste from a sheet, or start from the sample.
Hi [NAME],
Your list can come into SMEsay three ways: upload an xlsx or csv and pick the header row and
the columns on screen; paste rows straight from a sheet; or open the sample's seven items and
replace them with yours. Up to 2,000 rows and 5 MB.
Once the list is in, Shape groups it into areas and rewrites each item in plain words, with
the original kept beside it.
Button: Import your list (the newest project's Import step, else New project)

11c, day 7, only while nothing is published. Subject: Send [PROJECT NAME] to three people
(no project: Send your list to three people). Preheader: One public link, or personal links
by email, and a close date.
Hi [NAME],
[PROJECT NAME] (no project: Your list) is in SMEsay and nobody has answered yet. Share sends
it out: one public link for anyone, or personal links by email so you see who has submitted.
Remind sends a reminder with one button, at most once every three days, and a close date
ends it.
Three people are enough to see where the list is unclear.
Button: Share it (the project's Share step, else Projects)

11d, day 14, only while nothing is published. Subject: What got in the way? Preheader: Reply
to this email; it reaches the people who build SMEsay. Reply-to: the support address
(NEXT_PUBLIC_SUPPORT_EMAIL). No button.
Hi [NAME],
Two weeks ago you signed in to SMEsay and no validation went out. If something got in the
way, reply to this email and say what; it reaches the people who build SMEsay.
If SMEsay is not for you, ignore this. It is the last email of this kind.

## When a trial exists (drafted, not sent)

No plan has a trial (decision 0008). When one does, two steps join the series, keyed on the
trial's end date, and the drafts below become templates:

Your trial ends in 3 days. Subject: Your [PLAN] trial ends on [DATE]. Body: Hi [NAME], your
[PLAN] trial of [WORKSPACE NAME] ends on [DATE]. Until then everything stays as it is. After
that, [WHAT THE FREE PLAN KEEPS AND WHAT STOPS, from the plan table]. Nothing you built is
deleted. Button: Choose a plan.

Your trial ended. Subject: Your [PLAN] trial ended. Body: Hi [NAME], the [PLAN] trial of
[WORKSPACE NAME] ended on [DATE]. [WHAT STOPPED]. Your projects, validations and responses
are kept; choose a plan to carry on. Button: Choose a plan.

## Not sent

- No welcome email, no tips beyond the four steps of email 11 (which end at the first
  published validation), no newsletter, no offers, no "your link was opened" notice.
  Decision 0003 limited email to the four transactional ones; decision 0067 adds 7 to 11 as
  above, each with a switch and a stop link.
- No email to the PM when a response arrives; the dashboard is live (E8). The digest (9) is
  the one summary, and only when turned on.
- No email to respondents beyond 2, 3 and 4.
- No email to a person who typed an address on the sign-in page and never opened the link:
  they have no account.
