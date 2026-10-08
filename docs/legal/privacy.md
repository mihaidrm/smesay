version: 4
date: 2026-10-08
---
# Privacy policy

This policy says what SMEsay collects, why, where it is kept, for how long, and what you can ask for. It covers two groups of people: those who use SMEsay to run a validation (users), and those who answer one (respondents).

## Who we are

SMEsay is run by Alerty S.R.L., Șoseaua Virtuții 22D, Bl. B1, Et. 4, Ap. 29, Sector 6, Bucharest, Romania, trade register number J2024022790002, fiscal code 50556917.

Write to hello@smesay.app about anything in this policy. Alerty has not appointed a data protection officer: SMEsay does not monitor people on a large scale or process special categories of data, so the GDPR does not require one (Article 37), and the address above reaches the person responsible for privacy.

## Who decides what happens to the data

For your account (your name, your email, your workspaces), Alerty is the controller.

For what respondents give in a workspace, the organisation that owns the workspace is the controller, and Alerty processes it on their behalf under the data processing agreement (/legal/dpa).

## What we collect from users

- Your name and email address, from the sign-in link, or from Google if you sign in with Google. With Google we also keep the address of your Google profile picture and the access, refresh and ID tokens Google returns.
- Your workspaces: their names, logo and accent colour, the members and their roles, and the invitations sent.
- What you put in: the lists you import (the rows and the original file), the projects and their context, the validations, the personal invites you send (each person's name, email and role hint, when the invite was sent and reminded, and the email provider's error text if a send failed), and the actions written from the answers, with who closed each one.
- Records the product keeps to work: each AI run (what it was for, the tokens used and the cost), and each export (who made it, when, which file and the filter used; a text filter is kept without what was typed).
- A record of the steps you take in the product, so we can see which parts are used and improve them: the step's name (for example "project created" or "export downloaded"), when, your user id and workspace, and counts or fixed values such as the number of rows imported or the file type. It never holds your name, your email or anything you typed. For respondents the record holds the link's kind and the validation, never anything about the person; on a personal link its time is close to the time of the person's answers, so the two could be matched by someone with access to both. We use it on the basis of our legitimate interest in improving SMEsay, and delete each entry 13 months after it was made.
- When you ask for a sign-in link: your email address (and your name, if you gave one), kept with the link until it is used or expires, and deleted within an hour after it expires.
- Each signed-in session: the IP address and the browser's user agent at sign-in, kept with the session's record. The record is deleted when you sign out, or within an hour after the session ends.
- A session cookie that keeps you signed in. It lasts 30 days and is renewed at most once a day while you use SMEsay, so it ends between 29 and 30 days after you last used it. Signing in with Google also sets a cookie that lasts at most 10 minutes.
- To slow down repeated sign-in attempts, your email address and IP address are counted in the server's memory, on the basis of our legitimate interest in keeping the service secure. They are not written to the database or to disk. A count is removed at most 24 hours and 10 minutes after the last attempt it counted, or when the server restarts.
- On your device, the browser's storage keeps your light or dark mode choice (smesay-mode).

## What we collect from respondents

- The fields the person running the validation chose to ask for (for example a name, a role or an email).
- If you were sent a personal link: the name, email and role hint the person running the validation entered for you, when the link was sent and reminded, and the email provider's error text if a send failed.
- Your answers: each rating, the reason or question you wrote, your comments, the perspectives you picked, any missing item you suggested, your answer to the closing question, your confidence and your sign-off, with the times they were saved.
- A cookie named smesay-device that lets you come back to your answers on the same device, kept for one year, with a matching record in the database. If the link has a passcode, a cookie named smesay-passcode remembers that you entered it, kept for one year.
- On your device, the browser's storage keeps the answers and the Wrap up you have not yet saved (smesay-answers and smesay-wrap), so a closed tab loses nothing. They are removed once they are saved, or when you open the link after it has closed.
- If you press the Dark mode switch at the top of the page, the browser's storage on your device keeps that choice (smesay-mode), on the answer pages and on the sample alike. It is never sent to us.
- On the sample validation at /sample, what you enter stays in the browser tab only (smesay-sample) and is gone when you close the tab. Nothing is sent to us.
- Your IP address, as the host reports it, is counted in the server's memory to limit how many requests one address can make on the answer pages and the logo address (100 a minute) and how many passcodes it can try (counted over 15 minutes), on the basis of our legitimate interest in keeping the service secure. It is not written to the database or to disk. A count is removed at most 10 minutes after its minute or its 15 minutes end, or when the server restarts.

## Questions sent from the landing page

- When you send a question with "Ask us a question" on the landing page, your email address and your question go to us as one email, so we can reply to you. SMEsay itself stores neither, and neither is written to its logs. The email also says which page you sent it from and when. We use them because you asked us to answer, and keep the email for 24 months after our last message to you, then delete it.
- To limit repeated messages, your email address and your IP address are counted in the server's memory (5 questions per email address and 20 messages per connection in an hour). They are not written to the database or to disk. A count is removed at most an hour and 10 minutes after the first message it counted, or when the server restarts.

## What the AI sees

SMEsay uses Anthropic's Claude models through Anthropic's API for two things, and only when a user presses the button for them:

- Shape: the list's items, their areas and the project's context, to suggest clearer wording and group the items into areas.
- Write actions: the items' text and how many respondents gave each rating; for each answer that asks for a change, disagrees or marks an item unclear, the rating and the reason (or the comment when there is no reason); the missing items respondents suggested; the project's context; and the dropdown fields respondents picked (for example a role), except a field named "name". Respondents are told apart by an internal number. Email addresses and text fields such as a name are not sent, but reasons, comments and missing items go as they were typed, so a name written in them is sent too.

Anthropic processes this data for us under its commercial terms and data processing addendum. Under those terms Anthropic may not train its models on it, and deletes it within 30 days, except data flagged for a breach of its usage policy, which it may keep longer. Anthropic processes it in the United States, under the European Commission's standard contractual clauses.

## Where the data is kept

SMEsay is not hosted yet. The plan for launch is below; the subprocessor list (/legal/subprocessors) is updated when each one is in use.

- The database: Neon (Databricks), in AWS Europe (Frankfurt).
- The application: Vercel, with its functions in Frankfurt.
- Files (logos and imported lists): Cloudflare R2, in the European Union jurisdiction.
- Email: Resend. Emails are sent from the EU (Ireland); Resend keeps the email records (addresses, subjects, delivery logs) in the United States.
- The AI: Anthropic, in the United States.
- Sign-in with Google, for users who choose it: Google, which acts as a separate controller for your Google account.

Where data leaves the European Economic Area (Anthropic, Resend, and the US parent companies of the other providers), it is protected by the EU-US Data Privacy Framework where the provider takes part in it, and by the European Commission's standard contractual clauses.

Our host keeps request logs, which hold IP addresses, for up to 1 day (up to 30 days if we turn on its extended logging), to run and secure the service.

## How long it is kept

- Your account (your name, email, Google sign-in details and sessions) is kept until you ask for it to be deleted; SMEsay has no button for that yet, so write to hello@smesay.app. An administrator then deletes the account within one month of your request: your sessions, sign-in details and memberships go, invitations to your address and unused sign-in links go, and what you made in workspaces stays there without your name. If you are the only owner of a workspace, another member is made owner or the workspace is deleted first.
- Everything in a workspace is kept while the workspace exists. Archiving a project hides it; it does not delete it.
- An owner can delete a workspace in Settings. Every member loses access at once. The removal job, which runs every hour, then deletes every row and file in it within 24 hours and sends the owner who deleted it one email.
- Backups of the database are kept for 7 days, so anything deleted is gone from them 7 days after it was deleted.
- Respondents' answers are kept until the organisation that owns the workspace deletes them, the project or the workspace; that organisation decides how long it needs them.
- The log of what SMEsay's administrators did (for example changing a plan or sending a sign-in link) keeps the id of the workspace or account it concerned, with no name or email, and each entry is deleted 12 months after it was made.
- The usage record of a workspace goes when the workspace is deleted. The record of a sign-up and of a workspace deletion holds no workspace; if your account is deleted, your user id is removed from it, and each entry is deleted 13 months after it was made.

## Exports you make

Users can download what a workspace holds: the CSV files of answers, items, people and missing items, a project as one JSON file, a PDF summary, and Export everything (one zip, which also holds members.csv). These files hold respondents' names, emails and free text, the values of every respondent field the workspace asked for, invite role hints and send and reminder times, members' names, emails, roles and join dates, and the email of the member who closed an action. Once downloaded, a file is under the control of the person who downloaded it.

## Error reports and visit counts

SMEsay sends no error reports to another company and counts no visits yet. This section changes before either is switched on.

## Your rights

You can ask to see the data held about you, to correct it, to delete it, to limit its use, to receive it in a portable form, and to object to its use. If you answered a validation, ask the organisation that sent you the link first; they control your answers. Write to hello@smesay.app for anything else. We answer within one month of your request; if a request is complex or there are many, we may take up to two more months and will tell you why within the first month.

You can complain to the Romanian data protection authority: Autoritatea Naţională de Supraveghere a Prelucrării Datelor cu Caracter Personal (ANSPDCP), B-dul G-ral. Gheorghe Magheru 28-30, Sector 1, 010336 București, România; anspdcp@dataprotection.ro; www.dataprotection.ro.

## Changes

Each version of this policy has a number and a date at the top. A change makes a new version. We tell users about a change that affects them by email at least 30 days before it takes effect, unless the law or security requires it sooner.
