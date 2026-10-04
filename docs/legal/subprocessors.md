version: 1
date: 2026-10-04
---
# Subprocessors

The companies SMEsay uses to run the service, what each one does, the data it handles and where. A service marked "not in use yet" is planned and has no data. [LAWYER: confirm each provider's legal name and data processing terms before launch.]

## In use

- Anthropic. The AI behind Shape and Write actions. Handles the list's items and project context, and, for Write actions, answers and dropdown fields (never names or emails). Location: [LAWYER: confirm where Anthropic processes API data and the transfer mechanism.]

## Planned for launch

- Vercel. Hosts the application. Handles every request. Location: Frankfurt (fra1).
- Neon. The database. Handles everything stored in a workspace. Location: AWS Europe (Frankfurt).
- Cloudflare. R2 file storage for logos and imported lists, and the domain's DNS. Location: European Union jurisdiction.
- Resend. Sends the sign-in, invitation, reminder and receipt emails, and the deletion confirmation. Handles email addresses, names and the email's text. Location: EU (Ireland).
- Google. Sign-in with Google, for users who choose it. Handles the user's name and email address.

## Not in use yet

- Sentry. Error reports, in the EU, with personal data removed before sending. Not in use yet.
- Plausible. Visit counts on the public pages without cookies. Not in use yet.
