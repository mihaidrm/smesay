version: 1
date: 2026-10-04
---
# Data processing agreement

This agreement applies when an organisation (the customer) uses SMEsay to collect answers from people, and Alerty S.R.L. processes those answers on the customer's behalf. It is part of the terms of service. [LAWYER: confirm this agreement against Article 28 of the GDPR and whether it needs a signed form.]

## The parties

- The customer, the controller: the organisation that owns the workspace.
- The processor: Alerty S.R.L. [LAWYER: add the registered address and the registration number.]

## What is processed

- Subject matter: running the customer's validations in SMEsay.
- Duration: while the workspace exists, then until the removal job has deleted it after an owner deletes the workspace.
- Nature and purpose: storing the customer's lists and instruments, collecting respondents' answers, showing the results, exporting them, and, when the customer asks, sending the answers to the AI to write actions.
- People concerned: the customer's respondents, and the members and invitees of the workspace.
- Data about respondents: the respondent fields the customer chose to ask for (for example names, roles, emails); for a personal link, the name, email and role hint the customer entered and when the link was sent and reminded; answers, reasons, questions, comments, the perspectives picked, suggested missing items, the closing question's answer, confidence, sign-offs and their times.
- Data about members and invitees: names, emails, roles, and the time each joined.
- Special categories: none are asked for by the product. The customer must not ask for them. [LAWYER: confirm.]

## What Alerty does

- Processes the data only on the customer's documented instructions, which are the customer's use of the product.
- Keeps it confidential, and has everyone who works on it bound to confidentiality. [LAWYER: confirm how Alerty binds its staff and contractors.]
- Protects it with the measures listed below.
- Uses only the subprocessors on the subprocessor list (/legal/subprocessors), and tells customers in advance before adding one, so they can object. [LAWYER: set the notice period and the objection process.]
- Helps the customer answer people who use their rights, and with security, breach notification and impact assessments.
- Tells the customer of a personal data breach without undue delay. [LAWYER: set the time limit in hours.]
- At the end, deletes the data: an owner deletes the workspace in Settings, and the removal job deletes every row and file in it. Before that, Export everything gives the customer a copy. [LAWYER: confirm the removal period to promise (the job runs every hour from launch).]
- Makes available what is needed to show it meets this agreement, and allows audits. [LAWYER: confirm the audit terms.]

## Security measures

- Queries are limited to one workspace: for members, the workspace taken from the signed-in session, never from what a request sends; for respondents, who have no account, the workspace of the link they opened. Tests prove one workspace cannot read another's. Two internal reads span workspaces: the sum of AI spend across the product, and the removal job's list of deleted workspaces with the deleting owner's email. Neither shows one workspace's data to another.
- Data is to be encrypted in transit (HTTPS) once SMEsay is hosted, and at rest by the providers. [LAWYER: confirm both at launch, the providers' encryption at rest from their documents.]
- Sign-in is by email link or Google; no passwords are kept.
- Respondent links are long random tokens; a link can carry a passcode and can be revoked.
- Respondent pages, the logo address, sign-in and passcode attempts have a limit on requests per IP address, as the host's proxy reports it; uploads and imports are checked for type and size.
- Backups: [LAWYER: confirm the backup schedule, the retention and the restore test once backups are set up for the host.]
- Logs: [LAWYER: confirm before launch what the application's and the hosting provider's logs hold, including the IP addresses in request logs, and how long they are kept.]

## Transfers outside the EU

The data is planned to be stored in the EU. The AI provider, Anthropic, may process the data the customer sends to the AI outside the EU, and Google handles the name and email of users who sign in with Google. [LAWYER: confirm the transfer mechanism, for example the standard contractual clauses, for Anthropic, Google and the providers' US parent companies.]
