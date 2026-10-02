# E2-2 Sign in with Google

User: a PM whose company runs on Google Workspace
Status: ready
Outcome: one click on "Continue with Google" signs in the same person the magic link would,
matched by verified email. Microsoft and Apple come after launch (decision 0034).

## Acceptance criteria
1. The sign-in page shows "Continue with Google" under the email form. It starts Google's flow
   with state and PKCE and returns to the app signed in (SECURITY.md, Auth).
2. A Google sign-in with an email that already has an account (from the magic link) signs in
   as that account; no second user is created. A test with the magic link and a Google account
   on one email proves one user row.
3. An email Google marks unverified is refused with the message "Sign-in with Google did not
   complete. Try again, or use the email link." (docs/copy/errors.md). The same page appears
   when the person cancels at Google.
4. Google works against localhost:3000 with Mihai's free personal developer account
   (docs/accounts.md step 6; the redirect URI confirmed from the installed better-auth). Missing
   client id or secret: the button is hidden and the server log names the variable; nothing
   crashes.
5. Playwright covers the magic link and, with placeholder values in CI, that the button sends
   the browser to Google with the client id and the redirect URI (decision 0004, Google blocks
   automated sign-in); the real flow is checked by Mihai on his PC and recorded in the
   acceptance note.

## Out of scope
- Sign in with Microsoft or Apple: after launch, one story each (decision 0034).
- Workspace creation and the switcher: E2-3.
- Publishing the Google consent screen for outside users: the launch gate.

## Open questions
- None.

## Technical notes
better-auth social provider for Google (node_modules/better-auth, read when the story starts).
Account linking by verified email only; Google's `email_verified` claim decides. Variables:
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, listed in .env.example without values; Mihai's values
are in his .env.local and in the GitHub repository secrets since 2026-10-02 (the "Secrets
check" workflow reported both set at 16:11).
