version: 1
date: 2026-10-04
---
# Subprocessors

The companies SMEsay uses to run the service, what each one does, the data it handles and where. A service listed as planned has no data yet. [LAWYER: confirm each provider's legal name and data processing terms before launch.]

## In use

- Anthropic. The AI behind Shape and Write actions, used only when a user presses the button. Handles the list's items and the project's context, and, for Write actions, the answers that ask for a change, disagree or mark an item unclear with their reasons or comments, the missing items respondents suggested, and the dropdown fields respondents picked except a field named "name". Email addresses are not sent; reasons, comments and missing items go as typed. Location: [LAWYER: confirm where Anthropic processes API data and the transfer mechanism.]

## Planned for launch

- Vercel. Hosts the application. Handles every request. Location: Frankfurt (fra1).
- Neon. The database. Handles everything stored in a workspace. Location: AWS Europe (Frankfurt).
- Cloudflare. R2 file storage for logos and imported lists, and the domain's DNS. Location: European Union jurisdiction.
- Resend. Sends the sign-in, invitation, reminder and receipt emails, and the deletion confirmation. Handles email addresses, names and the email's text. Location: EU (Ireland).
- Plausible Analytics (from launch, when its two variables are set). Visit counts on the landing page, sign-in, the legal pages and the signed-in app; never on respondents' pages. Handles the page address, the referrer, the browser's user agent and the IP address, which it hashes with a salt deleted every 24 hours and does not store; keeps the country, region and city from the IP address and the browser, operating system and device type; no cookies. For two goals SMEsay's server sends the visitor's IP address and user agent. Location: [LAWYER: confirm Plausible's legal entity and where it processes data.]
- Google. Sign-in with Google, for users who choose it. Handles the user's name, email address and profile picture. Location: [LAWYER: confirm where Google processes sign-in data and the transfer mechanism.]

## Not in use

- Error reports: none. This list changes before they are switched on.
