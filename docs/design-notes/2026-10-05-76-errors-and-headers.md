# Design note 76: error reports, logs and security headers, 2026-10-05

Made in the Claude Code cloud session of 2026-10-04 and 2026-10-05 for stories/E11-5, under
decision 0044.

## What was decided

- Sentry through @sentry/nextjs 11.4.0 (MIT, published 2026-10-02, peer next ^16; the
  getsentry/sentry-javascript repository showed 441 open issues and 84 open pull requests on
  2026-10-05). It loads only when SENTRY_DSN is set: src/instrumentation.ts imports it inside
  register() and onRequestError, so locally and in CI no Sentry module runs (decision 0006).
- Server errors only in R1. The browser SDK, withSentryConfig and source map upload are left
  out: the browser SDK needs a public DSN and a connect-src for Sentry's host, and the wrapper
  changes the build. Sentry's manual setup lists withSentryConfig as a step; whether server
  reports arrive without it is unverified until the launch gate's first test event
  (docs/review-list.md).
- Version 11 collects user identity, cookies, headers, bodies, query values, AI inputs and
  outputs, database query data and local variables by default. Every one is off
  (src/lib/sentry.ts), breadcrumbs are dropped, and beforeSend rebuilds the event from an
  allow-list (src/lib/scrub.ts): the exception's type, its message with emails, quoted text,
  database values, link tokens and long tokens removed, the stack's files and lines, the route
  and the method.
- One logger (src/lib/log.ts): a fixed sentence and only allow-listed fields. no-console in
  src/ outside the seed and the tests.
- The content security policy uses a nonce per request from src/proxy.ts, which now runs on
  every path but Next's static files and /assets. The root layout reads the nonce for its mode
  script, so every page renders per request: the legal pages are no longer built once. The
  fixed headers come from next.config.ts on every response, static files included.
- Styles keep 'unsafe-inline' because the app uses style attributes; a nonce cannot cover them.

## Components added

- None.

## Checks

- src/lib/scrub.test.ts, src/lib/log.test.ts, src/lib/security-headers.test.ts,
  src/proxy.test.ts, e2e/headers.spec.ts (the headers, the nonce on every script tag the
  server sends, no policy violation on the home, legal and sign-in pages), e2e/preview.spec.ts
  (the builder's preview still frames /r/).
