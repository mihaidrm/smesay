# Security checklist (reviewer audits against this)

Auth and sessions
- Magic links single-use, 15 minute expiry, bound to the requesting email, stored hashed.
- OAuth state and PKCE verified; providers matched to one user by verified email only.
- Sessions httpOnly, Secure, SameSite=Lax; rotation on privilege change. A production process
  refuses an http base URL other than localhost.
- Every exported server action checks the session itself (requireSession, requireCurrentWorkspace,
  signedIn or the action's own actor helper) before it reads or writes data: the proxy's sign-in
  redirect is optimistic and lets a server action under /app through without a cookie, so the
  action can answer "signed out" (E11-6). The respondent's passcode action needs no session.

Multi-tenancy
- Every query scoped by workspace id from the session, never from the request body. Two reads
  go across workspaces, both in src/db/queries/internal.ts: the product's AI spend sum for its
  monthly cap (decision 0036), and the removal job's list of deleted workspaces with the deleting
  owner's email (E11-2). Outside src/db the lint rule lets only src/lib/workspace.ts (the
  membership check), src/lib/ai/client.ts with its test, src/lib/insights.test.ts (which sets a
  workspace budget, E9-3) and src/lib/workspace-removal.ts (the removal job) import that module. Scripts
  outside src/ read the database directly and never run in the app: scripts/ai-smoke.ts and
  evals/run.ts for their own throwaway rows, and the backup scripts (scripts/backup-tools.ts,
  scripts/backup-check.ts), which read every workspace's rows and objects to copy them. The
  admin area is the one exception in the app (E13-2, E14): src/db/queries/admin.ts reads across
  workspaces behind requireAdmin(), and adminWorkspace() turns the workspace id in an admin
  page's address or form into the WorkspaceId the product's helpers take, so an admin acts on a
  workspace through the same scoped helpers its members use.
- Row ownership tested: a user in workspace A cannot read, write or enumerate workspace B.
- A PM form whose save found the session ended keeps its text in the tab's sessionStorage under
  smesay-draft:[form] (E11-6: context:[project id] for the project context box), only from that
  answer on, until the server saves it or the tab closes. The key is per project, not per
  person: whoever signs in again in the same tab sees the draft. sessionStorage, like
  localStorage, is readable by any script on the origin; the CSP keeps foreign scripts out,
  except Plausible's once its variables are set at the gate (below).
- Visit counts (E13-3): Plausible's script runs only on the landing page, sign-in, the legal
  pages, the workspace step and the signed-in app, with the request's nonce, never on /r, the
  visitors' sample or /admin (a test pins the pages); links into those pages are full page
  loads, and a respondent's links out send no referrer, so a link token never reaches it. It
  sets no cookie and stores no IP address (plausible.io/data-policy). Two goals go from the
  server with the visitor's user agent and address, as the script would send them.

Public links and respondents
- Instrument tokens 128-bit random; respondent tokens separate from instrument tokens.
- A public link's response is found by a device token (128 bits from crypto.randomBytes) in
  an httpOnly, SameSite Lax cookie on the link's path, set on Start (E7-1); a personal
  link's by its invite. Every respondent write checks the link is open for the device first
  (the passcode proof included), and a write that creates a response re-reads the link
  under the invite row's lock, so a revoke committed in between wins. The respondent routes
  take JSON only (the media type exactly application/json) up to 16 KB, so a plain
  cross-site form or a no-preflight request cannot post to them. The sample project's links
  collect nothing. In a rate-blind instrument the proposed value never reaches the page.
- The visitors' sample at /sample (E12-4) calls no server route and writes no database row;
  what a visitor enters stays in the tab's session storage under smesay-sample (details,
  cards, Wrap up, whether it was submitted) and is gone when the tab closes.
- The respondent page keeps answers the server has not confirmed in the browser's
  localStorage under smesay-answers:[link token] (E7-3): the response id, and per item the
  pick, the reason, the comment, the answer's version the change was made on, and the
  random id of the page that made it with its number for the save, and the saves of other
  pages it was made on top of (page ids and numbers); nothing else. Entries leave when the
  server holds that save or a later one of the same page, when the server answers that
  another window or device changed the answer, when it refuses the answer (422), or on a
  reset (a lost response: that response's queue); a page that opens writes back only what
  it took, so entries the server already matches, of items not on the page or of another
  response go; a closed, revoked or unknown link's page removes the key; entries have no
  expiry otherwise. A queue of another response is never sent, and a
  write names the response the page answers for, so an open window's changes never land in a
  response started since in another window. From E7-5 the page also keeps the Wrap up's
  answers under smesay-wrap:[link token]: the response id, confidence, the closing answer
  and the missing item (text, area, value), the version it was made on, the page and number
  that wrote it and the saves of other pages it was made on top of (their random page ids
  and numbers), never the sign-off, until the server holds them (they save as they
  are written, PUT /r/[link token]/wrap, named for the response like every save, and Submit
  names it too); removed then and by a closed, revoked or unknown link's page. A kept change
  goes to the server only when the server holds nothing newer (the version rule), so an old
  one never replaces a later answer, a submitted one included. A respondent's action sends
  mail only to an address the PM chose (a personal invite's, the receipt on its first
  Submit), never to one typed on a public link. localStorage is per origin, so any script
  running on an SMEsay page can read it; the CSP with nonces (Headers and transport, E11-5) is
  what keeps foreign scripts out.
- Revoked and closed instruments return a page, not data; the state route (E6-4) answers a
  status and one word (open, notOpen, passcode, unknown, revoked, closed), nothing else.
  Passcode attempts rate-limited.
- A personal link (E6-2) is its own 128-bit token, sent to one address; the address is the
  proof, so the public link's passcode does not apply to it. The token never reaches the
  PM's browser: the Share page carries a 16-character hash of it for the stale-tab check on
  Revoke (E6-4, src/lib/invitees.ts linkMark). One personal invite per address
  on an instrument (partial unique index). The provider's failure reason is stored on the
  row and shown to the PM only, cut to 200 characters with every word that could carry a
  host or a credential (an @, a scheme, an IPv4 or IPv6 address, a dotted host name, a
  host:port, anywhere in the word) replaced by "[server]" first.
  At most 500 personal invites per workspace in 24 hours (src/lib/invitees.ts), since the
  PM names the sender and three lines of the body. Reminders (E6-3) go at most once per
  person every 72 hours, only on a press, over those invites; no limit of their own
  (docs/review-list.md).
- The passcode is stored as a salted scrypt hash with its parameters (src/lib/passcode.ts)
  and remembered per device by a cookie scoped to the link's path that holds an HMAC under a
  key derived from the app's secret, never the passcode (src/lib/link-access.ts). Wrong
  attempts are limited in the process, counted as a post starts and given back on a right
  passcode: 60 per link and 5 per link and address in 15 minutes (E6-1, unchanged by E11-1,
  which added the per-address limit on every respondent route).
- Rate limits (E11-1, src/lib/ratelimit.ts, in the process's memory): respondent routes and the
  logo route 100/min/IP (src/proxy.ts); sign-in 5 attempts per email and per IP in 15 minutes,
  then a wait doubling from one minute up to an hour (src/lib/auth.ts hooks); passcodes 5 wrong
  per link and IP and 60 per link in 15 minutes (src/lib/link-access.ts). The IP is the last
  X-Forwarded-For entry, the one the host's proxy appends. Without the header the respondent
  routes and sign-in do not limit by IP (sign-in still limits by email); passcodes count such
  requests as one address, under the per-link limit.
- The landing page's question bubble, POST /api/support (E12-5): the only public route that
  sends mail on a visitor's word. JSON only (the media type exactly application/json) up to
  16 KB; 20 posts per IP an hour, counted before the body is read, and 5 questions per typed
  address an hour, both in the process's memory and both given back when the mail fails;
  without the header no IP limit, as above. A hidden field a person never fills makes the
  route answer "Sent" and mail nothing. The address must have no character an email header
  reads as syntax and no control character, so the Reply-To is what was typed; the mail goes
  only to NEXT_PUBLIC_SUPPORT_EMAIL. Nothing is stored and nothing is logged; the address and
  the IP stay in memory as counts until their key is counted again after the hour, the server
  restarts or the store fills.

Data
- Uploads validated by type and size (5 MB, 2,000 rows); parsed server-side in the request,
  within those caps (decision 0040).
- Exports and deletion per workspace; deletion removes rows and objects within 24 hours.
- A project file import (E10-2) reads at most 5 MB, checks every field and JSON column, and
  never logs a refused row's values.
- A CSV export writes a text cell that starts with =, +, -, @, a tab or a line break with a
  single quote in front, so a spreadsheet does not run it as a formula (OWASP, CSV Injection).
- No personal data in logs, Sentry events or analytics (Plausible receives the visitor's
  address and user agent to count a visit and keeps neither, see Visit counts above). Logs go through src/lib/log.ts, which
  prints a fixed sentence and only the fields on its allow-list (ids, counts, codes); the lint
  rule no-console keeps src/ on it (E11-5). Sentry, when SENTRY_DSN is set, has every data
  collection off and its beforeSend rebuilds each event from an allow-list with emails, quoted
  text, database values and link tokens removed (src/lib/sentry.ts, src/lib/scrub.ts).
- Product events (E13-1) are written only by track() (src/lib/analytics.ts): a name from the
  catalogue and properties that are counts, uuids, short keys or values from fixed lists, so
  an email, a name or typed text cannot be stored; respondent events carry no user id. A
  workspace's events go with it.

AI
- Anthropic key server-side only; one product spend cap (ANTHROPIC_MONTHLY_BUDGET_EUR),
  per-workspace and per-request token budgets enforced (decision 0036).
- Uploaded text passed as data, separated from instructions; output validated against a JSON
  schema before display; model may not add items, additions flagged as suggestions.

Admin area (E13-2, E14)
- /admin served only to ADMIN_EMAILS; everyone else gets 404. The admin queries live in one
  module, src/db/queries/admin.ts, which lint lets only the admin pages and three library files
  import: src/lib/accounts.ts (the account actions, E14-3), src/lib/view-as.ts (the admin's view,
  E14-4, which every PM page reaches through src/lib/current-workspace.ts) and the tests. Every
  function there takes the AdminProof, made only by src/lib/admin.ts (requireAdmin, and
  adminProofFor for the view check), from a session whose verified email is in ADMIN_EMAILS.
- Every admin action writes its audit row before it runs, by the admin of the session, and the
  action runs only when the row is in; the row then records done, refused or failed. The
  admin_audit table is the one application table without workspace_id besides the auth tables:
  its target is a column with no foreign key, so a row outlives the workspace or person it
  names (E14-1); "view as" (E14-4) lives on the admin's session row, counts only while the
  email is an admin's, serves the workspace through the admin module, and every server action
  and writing route takes its workspace from requireWritableWorkspace, which refuses during a
  view (a unit test checks every action file); "view as" is read-only,
  shows a banner, expires after 60 minutes and is audited at start and stop.
- No respondent names or answers in the admin area except through "view as".

Headers and transport
- HSTS, CSP with nonces, X-Content-Type-Options, Referrer-Policy, Permissions-Policy (E11-5).
  src/proxy.ts sets the policy on every page with a nonce made per request (16 random bytes);
  next.config.ts sets the fixed headers on every response (src/lib/security-headers.ts).
  Scripts run only with the nonce ('strict-dynamic'); styles keep 'unsafe-inline' for style
  attributes; frame-ancestors 'self' for the builder's preview; every page renders per request.
- securityheaders.com grade A on the production domain.

Dependencies and backups
- `npm audit` clean of high and critical at release; lockfile committed.
- Nightly backups; one restore into a fresh database performed and documented before launch
  (E11-4: `npm run backup`, `npm run restore`, docs/runbooks/backup-restore.md; CI backs up,
  restores into an empty database and compares every table's row count on every push).

Mode script
- src/app/layout.tsx puts one inline script in the head to set the dark class before paint.
  It is a fixed string, reads one localStorage key and compares it with one word. It carries
  the request's nonce (E11-5), read from the x-nonce header src/proxy.ts sets
  (node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md, "Reading the nonce").

