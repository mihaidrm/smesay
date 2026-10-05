# Design note 87: the admin People pages, 2026-10-05

Made in the Claude Code cloud session of 2026-10-05 for stories/E14-3, under decision 0044.

## What was decided

- The list shows every account by last sign-in: email, name, whether the email is verified,
  how they sign in, their live workspaces with role, created, last sign-in and open sessions.
  Search is a GET form (?q=) on email or name, % and _ matched as typed. Respondents have no
  account and are not listed; the intro says so.
- "Signs in with": Sign-in link for everyone (a magic-link account has no account row in
  better-auth's tables), plus Google when an account row of that provider exists. Microsoft
  joins when its sign-in does, after launch (decision 0034).
- Last sign-in is a column of its own, user.last_sign_in_at, written by better-auth's
  session.create.after hook: better-auth deletes a session on sign-out, so the newest session
  cannot say it. The migration fills it from the sessions still kept; a person who signed out
  before then shows "never" until the next sign-in.
- Sessions show start, expiry, open or expired, and the browser and system family read from
  the user agent by a few patterns in src/lib/accounts.ts (Edge before Chrome, Chrome before
  Safari, iOS before macOS; an iPad asking for the desktop site reads as macOS). The token and
  the address are never read; the raw user agent is read on the server for its family and never
  sent to the browser.
- The actions, behind the confirm form of design note 86: send a sign-in link (better-auth's
  own sender, so it works once and expires in 15 minutes), sign out everywhere (better-auth's
  internalAdapter.deleteUserSessions), remove from a workspace (src/lib/members.ts, the same
  last-owner rule and messages a PM meets), delete the account. The deletion first forgets the
  address where no foreign key reaches it: every workspace invitation to it, accepted or not
  (an open one would turn a new sign-in with the address into a member again), and its unused
  sign-in links. Then internalAdapter.deleteUser removes the sessions, the accounts and the user
  row, and the schema removes the memberships and sets every "who made it" column (created_by,
  invited_by, imported_by, closed_by, made_by, deleted_by) and the events' user id to null.
- The account functions in src/lib/accounts.ts take the admin proof, and only the admin area
  may import the module that checks it, so a product page cannot call them.
- "Sessions ended" counts the sessions that were open, as the page does; expired rows go too.
- A failed sign-in email is a failed row and a log line, not a refusal.
- A deletion is refused while the person is a workspace's only owner, a deleted workspace
  waiting for removal included, since a restore must not bring one back with no owner (the
  message names the workspaces and says who acts), and for the admin's own account. After a deletion the page is not read again,
  so the done line stays instead of turning into the 404; the audit log then shows the person
  as "deleted", which is the point of the deletion.
- Whether the person is a member of the workspace named in a removal is decided inside the
  audited action, so a refusal is a row (design note 86).

## Why

Story E14-3 asks for what an admin needs when someone cannot get in, and the actions that get
them unstuck, through the product's own code.

## Rejected

- Showing the session's IP address: the story asks for the browser family only, and the
  address is personal data the admin does not need.
- A user-agent library: five patterns cover the families the page names, with no new package.
