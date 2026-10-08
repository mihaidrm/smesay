version: 4
date: 2026-10-08
---
# Subprocessors

This page lists the companies SMEsay uses to run the service, what each one does, the data it handles and where. A service listed as planned has no data yet. We tell customers at least 30 days before adding or replacing one (/legal/dpa).

## In use

- Anthropic (Anthropic Ireland, Limited, for customers in the EEA; Anthropic, PBC in the United States processes the data) provides the AI behind Shape and Write actions, used only when a user presses the button. It handles the list's items and the project's context, and, for Write actions, the answers that ask for a change, disagree or mark an item unclear with their reasons or comments, the missing items respondents suggested, and the dropdown fields respondents picked except a field named "name". Email addresses are not sent; reasons, comments and missing items go as typed. It may not train its models on this data and deletes it within 30 days. Location: United States, under the standard contractual clauses.

## Planned for launch

- Vercel Inc. hosts the application and handles every request. Location: functions in Frankfurt (fra1); Vercel is a US company, under the EU-US Data Privacy Framework and the standard contractual clauses.
- Databricks, Inc. (Neon) runs the database and handles everything stored in a workspace. Location: AWS Europe (Frankfurt).
- Cloudflare, Inc. provides R2 file storage for logos and imported lists, and the domain's DNS. Location: European Union jurisdiction.
- Resend (Plus Five Five, Inc.) sends the sign-in, invitation, reminder and receipt emails, and the deletion confirmation. It handles email addresses, names and the email's text. Location: emails sent from the EU (Ireland); email records kept in the United States, under the EU-US Data Privacy Framework and the standard contractual clauses.
- Plausible Insights OÜ (Estonia) counts visits on the landing page, sign-in, the legal pages and the signed-in app (from launch, when its two variables are set), never on respondents' pages; it handles the page address, the referrer, the browser's user agent and the IP address, which it hashes with a salt deleted every 24 hours and does not store; it keeps the country, region and city from the IP address and the browser, operating system and device type; it sets no cookies. For two goals SMEsay's server sends the visitor's IP address and user agent. Location: Germany (EU).

## Not subprocessors

- Google, for users who choose Sign-in with Google: Google acts as a separate controller for the Google account (Google Ireland Limited for users in the EEA), under its own terms. It gives SMEsay the user's name, email address and profile picture.

## Not in use

- SMEsay uses no error-report service. This list changes before one is switched on.
