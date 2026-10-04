version: 1
date: 2026-10-04
---
# Privacy policy

This policy says what SMEsay collects, why, where it is kept, for how long, and what you can ask for. It covers two groups of people: those who use SMEsay to run a validation (users), and those who answer one (respondents).

[LAWYER: confirm this policy as a whole against the GDPR (Regulation (EU) 2016/679) and Romanian law 190/2018.]

## Who we are

SMEsay is run by Alerty S.R.L., [REGISTERED ADDRESS]. [LAWYER: confirm the registered address, the company registration number and the fiscal code.]

Write to hello@smesay.app about anything in this policy. [LAWYER: confirm whether Alerty must name a data protection officer.]

## Who decides what happens to the data

For your account (your name, your email, your workspaces), Alerty is the controller.

For what respondents give in a workspace, the organisation that owns the workspace is the controller, and Alerty processes it on their behalf under the data processing agreement (/legal/dpa). [LAWYER: confirm the controller and processor split for respondents' answers.]

## What we collect from users

- Your name and email address, from the sign-in link or from Google if you sign in with Google.
- Your workspaces: their names, logo and accent colour, the members and their roles, and the invitations sent.
- What you put in: the lists you import (the rows and the original file), the projects and their context, the instruments, the invites you send (each person's name, email and role hint), and the actions written from the answers.
- Records the product keeps to work: each AI run (what it was for, the tokens used and the cost), and each export (who made it, when, which file and the filter used; a text filter is kept without what was typed).
- A session cookie that keeps you signed in until 30 days after you last used SMEsay.

## What we collect from respondents

- Only the fields the person running the validation chose to ask for (for example a name, a role or an email). Nothing else about you is asked or stored.
- Your answers: each rating, the reason or question you wrote, your comments, any missing item you suggested, your confidence and your sign-off, with the times they were saved.
- A cookie named smesay-device that lets you come back to your answers on the same device, kept for one year, and, if the link has a passcode, a cookie named smesay-passcode that remembers you entered it, kept for one year.
- Your connection's address (IP) is used for a minute at a time to limit how many requests one connection can make. It is held in memory and not stored. [LAWYER: confirm whether the hosting provider's own request logs, which hold IP addresses, need a line here and their retention.]

## What the AI sees

SMEsay uses Anthropic's Claude models through Anthropic's API for two things, and only when a user presses the button for them:

- Shape: the list's items and the project's context, to suggest clearer wording and group the items into areas.
- Write actions: the answers to the items (each rating, value, reason or question and comment), the items' text, and the dropdown fields respondents picked (for example a role). It does not send names, email addresses or other text fields.

[LAWYER: confirm Anthropic's commercial terms on retention and on training with API data, and where Anthropic processes it.]

## Where the data is kept

- The database: Neon, in AWS Europe (Frankfurt).
- The application: Vercel, in Frankfurt.
- Files (logos and imported lists): Cloudflare R2, in the European Union jurisdiction.
- Email: Resend, in the EU (Ireland).
- The AI: Anthropic. [LAWYER: confirm the transfer mechanism for data that leaves the EU, for example the standard contractual clauses.]

The full list is the subprocessor list (/legal/subprocessors).

## How long it is kept

- Everything in a workspace is kept while the workspace exists. Archiving a project hides it; it does not delete it.
- An owner can delete a workspace in Settings. Every member loses access at once, every row and file in it is removed within 24 hours, and the owner who deleted it gets one email when it is done.
- Backups: [LAWYER: confirm the backup retention period once E11-4 sets it.]
- Respondents' answers are kept until the workspace is deleted. [LAWYER: confirm whether a maximum retention period is needed.]

## Exports you make

Users can download what a workspace holds: the CSV files of answers, items, people and missing items, a project as one JSON file, a PDF summary, and Export everything (one zip). These files hold respondents' names, emails and free text, the values of every respondent field the workspace asked for, invite role hints, and the email of the member who closed an action. Once downloaded, a file is under the control of the person who downloaded it.

## Questions from the landing page

A question sent from the landing page's form is emailed to SMEsay with your email address so we can reply. Nothing of it is kept in the application.

## Error reports and visit counts

Neither is switched on yet. When error reports are switched on, they go to Sentry in the EU with emails, names, respondents' field values and free text removed before they leave the application. [LAWYER: confirm this paragraph when error reports are switched on.]

## Your rights

You can ask to see the data held about you, to correct it, to delete it, to limit its use, to receive it in a portable form, and to object to its use. If you answered a validation, ask the organisation that sent you the link first; they control your answers. Write to hello@smesay.app for anything else.

You can complain to the Romanian data protection authority, ANSPDCP (www.dataprotection.ro). [LAWYER: confirm the authority's details and the response time Alerty commits to.]

## Changes

Each version of this policy has a number and a date at the top. A change makes a new version.
