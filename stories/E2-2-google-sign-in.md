# E2-2 Sign in with Google

User: a PM whose company runs on Google Workspace
Status: built
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
Built 2026-10-02.

- src/lib/auth.ts: socialProviders.google from GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
  (node_modules/@better-auth/core/src/social-providers/google.ts, GoogleOptions); state and
  PKCE are better-auth's own (callback.mjs, parseState). readGoogleEnv() returns null and logs
  the missing name when either variable is absent; the page then renders no button
  (acceptance 4). accountLinking is on with requireLocalEmailVerified, so a Google sign-in
  with an email that the magic link already verified joins that user row and never makes a
  second one (acceptance 2; the magic link marks the email verified). The full Google round
  trip cannot run in a test (Google's token endpoint), so acceptance 2 is proven by better-auth's
  linking rule and checked by Mihai on his PC; auth.test.ts proves the start of the flow: the
  authorisation URL carries the client id, the callback URI
  (/api/auth/callback/google), a state and a PKCE challenge, and the provider is absent
  without the variables.
- src/app/sign-in/google-button.tsx calls authClient.signIn.social with callbackURL (the
  safe next path) and errorCallbackURL /sign-in/google-failed; that page (design note 25)
  shows the one message of docs/copy/errors.md for every ?error code (acceptance 3).
- CI runs with placeholder values (GOOGLE_CLIENT_ID=ci-placeholder) so e2e/sign-in.spec.ts
  sees the button and follows it to accounts.google.com with the client id and the redirect
  URI in the URL (acceptance 5); Google then shows its own error page, which the test does
  not read. Mihai's real values are in his .env.local and in the GitHub repository secrets
  (reported set by the Secrets check at 16:11 on 2026-10-02); CI does not use the secrets.
- Mihai checks the real flow on his PC: sign in with the magic link, sign out, "Continue with
  Google" with the same Gmail, one user row (Settings, Members shows one person); then with
  a second Google account, a new user. The acceptance note records it.
