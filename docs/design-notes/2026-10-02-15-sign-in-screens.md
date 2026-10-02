# Design note 15: sign-in, link-used and the signed-in shell, 2026-10-02

Story E2-1. Three screens built straight from docs/design-system.md, no board first (the PM app
board has no sign-in page). Nothing external was looked at. Screenshots beside the boards:
sign-in-desktop.png (1440), sign-in-phone.png (390), sign-in-error-desktop.png,
sign-in-link-used-desktop.png.

## Sign-in (/sign-in)

A 448 px column centred on white: the lockup, "Sign in" at 24 px, one line of help, the
Email field (label above, 40 px input, hairline-strong border), the primary button "Send me a
link" sized to its label. The inline message under the field is the danger text from
docs/copy/errors.md ("Enter the email address you signed up with.") and the field gets the
danger border. After sending, the form is replaced by a status box (grey-50, hairline, radius
12) with "Check your email. The link works once and stops working in 15 minutes." The status box
is the one piece not in the design system's component list: it is the plain information
state, not the ambiguity banner (purple) and not a toast; added here as "status box" and used
again wherever a form has a quiet done-state.

## Link used (/sign-in/link-used)

Same column: the lockup, the message as the title ("This sign-in link has already been used or
has expired."), "Ask for a new one." under it, and a primary link-button "Send a new link"
back to the sign-in page.

## The signed-in shell (/app)

The PM app board's frame: a 240 px sidebar on grey-50 with a hairline on the right, the lockup
at the top, the workspace block (placeholder until E2-3), and at the bottom the signed-in email
in muted ink with a small secondary "Sign out" button. The content column is empty but for a
title in this story. Desktop only (decision 0020); the sign-in pages have a phone layout
because a link from a phone's mail client opens them there.

## Checked

Rendered in Chromium at 1440 by 900 and 390 by 844: no horizontal scroll, the column keeps its
16 px gutters on the phone. The flow is run end to end by src/lib/auth.test.ts (through
better-auth's handler) and e2e/sign-in.spec.ts (browser plus Mailpit, in CI).
