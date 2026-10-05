version: 1
date: 2026-10-04
---
# Privacy policy

This policy says what SMEsay collects, why, where it is kept, for how long, and what you can ask for. It covers two groups of people: those who use SMEsay to run a validation (users), and those who answer one (respondents).

[LAWYER: confirm this policy as a whole against the GDPR (Regulation (EU) 2016/679) and Romanian law 190/2018.]

## Who we are

SMEsay is run by Alerty S.R.L. [LAWYER: add the registered address, the company registration number and the fiscal code.]

Write to hello@smesay.app about anything in this policy. [LAWYER: this address works once the domain is bought; confirm it, and whether Alerty must name a data protection officer.]

## Who decides what happens to the data

For your account (your name, your email, your workspaces), Alerty is the controller.

For what respondents give in a workspace, the organisation that owns the workspace is the controller, and Alerty processes it on their behalf under the data processing agreement (/legal/dpa). [LAWYER: confirm the controller and processor split for respondents' answers.]

## What we collect from users

- Your name and email address, from the sign-in link, or from Google if you sign in with Google. With Google we also keep the address of your Google profile picture and the access, refresh and ID tokens Google returns.
- Your workspaces: their names, logo and accent colour, the members and their roles, and the invitations sent.
- What you put in: the lists you import (the rows and the original file), the projects and their context, the instruments, the personal invites you send (each person's name, email and role hint, when the invite was sent and reminded, and the email provider's error text if a send failed), and the actions written from the answers, with who closed each one.
- Records the product keeps to work: each AI run (what it was for, the tokens used and the cost), and each export (who made it, when, which file and the filter used; a text filter is kept without what was typed).
- When you ask for a sign-in link: your email address (and your name, if you gave one), kept with the link until it is used, or after it expires until the link records are next cleared.
- Each signed-in session: the IP address and the browser's user agent at sign-in, kept with the session's record. The record is deleted when you sign out, or when the session is next used after it has ended; a session nobody returns to stays in the database. [LAWYER: SMEsay does not yet delete ended sessions on a schedule; confirm the retention to promise.]
- A session cookie that keeps you signed in. It lasts 30 days and is renewed at most once a day while you use SMEsay, so it ends between 29 and 30 days after you last used it. Signing in with Google also sets a cookie that lasts at most 10 minutes.
- To slow down repeated sign-in attempts, your email address and IP address are counted in the server's memory. They are not written to the database. They stay in memory until the server restarts or the count store fills up (50,000 entries), whichever comes first. [LAWYER: confirm whether a fixed maximum is needed.]
- On your device, the browser's storage keeps your light or dark mode choice (smesay-mode).

## What we collect from respondents

- The fields the person running the validation chose to ask for (for example a name, a role or an email).
- If you were sent a personal link: the name, email and role hint the person running the validation entered for you, when the link was sent and reminded, and the email provider's error text if a send failed.
- Your answers: each rating, the reason or question you wrote, your comments, the perspectives you picked, any missing item you suggested, your answer to the closing question, your confidence and your sign-off, with the times they were saved.
- A cookie named smesay-device that lets you come back to your answers on the same device, kept for one year, with a matching record in the database. If the link has a passcode, a cookie named smesay-passcode remembers that you entered it, kept for one year.
- On your device, the browser's storage keeps the answers and the Wrap up you have not yet saved (smesay-answers and smesay-wrap), so a closed tab loses nothing. They are removed once they are saved, or when you open the link after it has closed.
- Your IP address, as the host reports it, is counted in the server's memory to limit how many requests one address can make on the answer pages and the logo address (100 a minute) and how many passcodes it can try (counted over 15 minutes). It is not written to the database. It stays in memory until the server restarts or the count store fills up, whichever comes first. [LAWYER: confirm whether a fixed maximum is needed, and whether the hosting provider's own request logs, which hold IP addresses, need a line here and their retention.]

## What the AI sees

SMEsay uses Anthropic's Claude models through Anthropic's API for two things, and only when a user presses the button for them:

- Shape: the list's items, their areas and the project's context, to suggest clearer wording and group the items into areas.
- Write actions: the items' text and how many respondents gave each rating; for each answer that asks for a change, disagrees or marks an item unclear, the rating and the reason (or the comment when there is no reason); the missing items respondents suggested; the project's context; and the dropdown fields respondents picked (for example a role), except a field named "name". Respondents are told apart by an internal number. Email addresses and text fields such as a name are not sent, but reasons, comments and missing items go as they were typed, so a name written in them is sent too.

[LAWYER: confirm Anthropic's commercial terms on retention and on training with API data, where Anthropic processes it, and the transfer mechanism.]

## Where the data is kept

SMEsay is not hosted yet. The plan for launch is below; the subprocessor list (/legal/subprocessors) is updated when each one is in use.

- The database: Neon, in AWS Europe (Frankfurt).
- The application: Vercel, in Frankfurt.
- Files (logos and imported lists): Cloudflare R2, in the European Union jurisdiction.
- Email: Resend, in the EU (Ireland).
- The AI: Anthropic.
- Sign-in with Google, for users who choose it: Google.

[LAWYER: confirm the providers before launch, and the transfer mechanism for data that leaves the EU (Anthropic, Google, and the providers' US parent companies), for example the standard contractual clauses.]

## How long it is kept

- Your account (your name, email, Google sign-in details and sessions) is kept until you ask for it to be deleted; SMEsay has no button for that yet, so write to hello@smesay.app. [LAWYER: confirm the account retention and the deletion process.]
- Everything in a workspace is kept while the workspace exists. Archiving a project hides it; it does not delete it.
- An owner can delete a workspace in Settings. Every member loses access at once. The removal job then deletes every row and file in it and sends the owner who deleted it one email. [LAWYER: the removal job runs every hour from launch, so removal takes under 24 hours; until then it is started by hand. Confirm the period to promise.]
- Backups: [LAWYER: confirm the backup retention period once it is set for the host.]
- Respondents' answers are kept until the workspace is deleted. [LAWYER: confirm whether a maximum retention period is needed.]

## Exports you make

Users can download what a workspace holds: the CSV files of answers, items, people and missing items, a project as one JSON file, a PDF summary, and Export everything (one zip, which also holds members.csv). These files hold respondents' names, emails and free text, the values of every respondent field the workspace asked for, invite role hints and send and reminder times, members' names, emails, roles and join dates, and the email of the member who closed an action. Once downloaded, a file is under the control of the person who downloaded it.

## Error reports and visit counts

SMEsay sends no error reports to another company and counts no visits. [LAWYER: this section changes before either is switched on.]

## Your rights

You can ask to see the data held about you, to correct it, to delete it, to limit its use, to receive it in a portable form, and to object to its use. If you answered a validation, ask the organisation that sent you the link first; they control your answers. Write to hello@smesay.app for anything else.

You can complain to the Romanian data protection authority, ANSPDCP (www.dataprotection.ro). [LAWYER: confirm the authority's details and the response time Alerty commits to.]

## Changes

Each version of this policy has a number and a date at the top. A change makes a new version.
