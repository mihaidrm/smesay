# Design note 25: "Continue with Google" on the sign-in page, 2026-10-02

Story E2-2 (decision 0034: Google only until launch). The landing and sign-in boards show the
email form alone, so the button is composed from the design system. Screenshot beside the
boards: sign-in-google-desktop.png (the form, the divider, the button) and
sign-in-google-failed-desktop.png (the refusal page).

## The page

Under the email form, when both Google variables exist: a hairline divider with "or" in muted
13 px between two lines, then a secondary pill "Continue with Google" aligned left like "Send
me a link". No Google logo: the design system shows no third-party marks, and the words are
what Google's own sign-in branding guidance asks for first; the logo can be added at the
launch gate if the consent screen review asks for it. Without the variables the whole block
is absent, so the page is the E2-1 page.

## The refusal page

/sign-in/google-failed, the shape of the link-used page: the lockup, "Sign-in with Google did
not complete." as the title, "Try again, or use the email link." under it, a primary "Back to
sign-in". The error code better-auth appends (?error=email_not_verified, access_denied and
the rest) is not shown.

## Decisions taken here

- One message for every refusal (unverified email, linking refused, cancelled at Google), as
  errors.md has it; the code is logged by better-auth, not shown.
- The button is a secondary pill, not primary: the email link stays the first way in.
