# E2-2 Sign in with Google and Microsoft

User: a PM whose company runs on Google Workspace or Microsoft 365
Status: ready
Outcome: one click on "Continue with Google" or "Continue with Microsoft" signs in the same
person the magic link would, matched by verified email.

## Acceptance criteria
1. The sign-in page shows the two provider buttons under the email form. Each starts the
   provider's flow with state and PKCE and returns to the app signed in (SECURITY.md, Auth).
2. A provider sign-in with an email that already has an account (from the magic link or the
   other provider) signs in as that account; no second user is created. A test with two
   providers and one email proves one user row.
3. An email the provider marks unverified is refused with the message "Sign-in with [PROVIDER]
   did not complete. Try again, or use the email link." (docs/copy/errors.md). The same page
   appears when the person cancels at the provider.
4. Both providers work against localhost:3000 with Mihai's free personal developer accounts
   (docs/accounts.md steps 6 and 7, redirect URIs confirmed from the better-auth documentation
   when the story starts). Missing client id or secret: the button is hidden and the server
   log names the variable; nothing crashes.
5. Playwright covers the magic link only (decision 0004); the provider flows are checked by
   Mihai on his PC and recorded in the acceptance note.

## Out of scope
- Workspace creation and the switcher: E2-3.
- Publishing the Google consent screen for outside users: the launch gate.

## Open questions
- Whether Mihai creates the two developer accounts now or later. Both are optional for R1
  (docs/plan-steps.md, E2 row); the story can be accepted with the buttons hidden.

## Technical notes
better-auth social providers (better-auth.com/docs/authentication/google and /microsoft; read
when the story starts, unverified until then). Account linking by verified email only; the
provider's `email_verified` claim decides. Variables: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET,
MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET, listed in .env.example without values.
