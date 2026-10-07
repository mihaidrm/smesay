version: 3
date: 2026-10-07
---
# Data processing agreement

This agreement applies when an organisation (the customer) uses SMEsay to collect answers from people, and Alerty S.R.L. processes those answers on the customer's behalf. It is part of the terms of service and is accepted with them; a customer who wants a signed copy can ask hello@smesay.app.

## The parties

- The customer, the controller: the organisation that owns the workspace.
- The processor: Alerty S.R.L. [LAWYER: add the registered address and the registration number.]

## What is processed

- Subject matter: running the customer's validations in SMEsay.
- Duration: while the workspace exists, then until the removal job has deleted it after an owner deletes the workspace, and until the backups that hold it have expired.
- Nature and purpose: storing the customer's lists and validations, collecting respondents' answers, showing the results, exporting them, and, when the customer asks, sending the answers to the AI to write actions.
- People concerned: the customer's respondents, and the members and invitees of the workspace.
- Data about respondents: the respondent fields the customer chose to ask for (for example names, roles, emails); for a personal link, the name, email and role hint the customer entered and when the link was sent and reminded; answers, reasons, questions, comments, the perspectives picked, suggested missing items, the closing question's answer, confidence, sign-offs and their times.
- Data about members and invitees: names, emails, roles, and the time each joined.
- Special categories: none are asked for by the product. The customer must not ask for them, nor for national identification numbers.

## What Alerty does

- Processes the data only on the customer's documented instructions, which are the customer's use of the product.
- Keeps it confidential, and has everyone who works on it bound to confidentiality in writing, in their employment or service contract.
- Protects it with the measures listed below.
- Uses only the subprocessors on the subprocessor list (/legal/subprocessors). Before adding or replacing one, Alerty tells the customer by email and on that page at least 30 days ahead. The customer can object within those 30 days on reasonable grounds; if Alerty cannot address the objection, the customer can end the service and delete its workspace, and gets back any fees paid for the time not used.
- Helps the customer answer people who use their rights, and with security, breach notification and impact assessments.
- Tells the customer of a personal data breach without undue delay, and no later than 48 hours after becoming aware of it, with what is known then and the rest as it is learned.
- At the end, deletes the data: an owner deletes the workspace in Settings, and the removal job, which runs every hour, deletes every row and file in it within 24 hours; the backups that hold it expire 7 days later. Before that, Export everything gives the customer a copy.
- Makes available what is needed to show it meets this agreement: first by written answers to the customer's security and privacy questions; then, if those are not enough, by an audit at most once in 12 months, with at least 30 days' notice, during working hours, by the customer or an auditor bound to confidentiality, at the customer's cost; more often after a personal data breach or when a supervisory authority requires it.

## Security measures

- Queries are limited to one workspace: for members, the workspace taken from the signed-in session, never from what a request sends; for respondents, who have no account, the workspace of the link they opened. Tests prove one workspace cannot read another's. Two internal reads span workspaces: the sum of AI spend across the product, and the removal job's list of deleted workspaces with the deleting owner's email. Neither shows one workspace's data to another.
- Data is encrypted in transit (HTTPS) and at rest by the hosting providers (the database, the file storage and the backups).
- Sign-in is by email link or Google; no passwords are kept.
- Respondent links are long random tokens; a link can carry a passcode and can be revoked.
- Respondent pages, the logo address, sign-in, passcode attempts and the landing page's question form have a limit on requests per IP address, as the host's proxy reports it; uploads and imports are checked for type and size.
- Backups: the database is backed up continuously by its provider and can be restored to any point in the last 7 days; a restore is tested before launch and the result written down (docs/runbooks/backup-restore.md).
- Logs: the application logs errors and job counts, with ids and no names, emails or answers; the host keeps request logs, which hold IP addresses, for up to 1 day (up to 30 days if extended logging is turned on).

## Transfers outside the EU

The data is stored in the EU. Some providers process it outside the European Economic Area: Anthropic processes the data the customer sends to the AI in the United States, and Resend keeps email records in the United States. These transfers are protected by the European Commission's standard contractual clauses, and by the EU-US Data Privacy Framework where the provider takes part in it.
