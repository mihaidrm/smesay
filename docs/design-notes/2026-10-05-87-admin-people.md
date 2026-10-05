# Design note 87: the admin People pages, 2026-10-05

Made in the Claude Code cloud session of 2026-10-05 for stories/E14-3, under decision 0044.

## What was decided

- The list shows every account by last sign-in: email, name, whether the email is verified,
  how they sign in, their live workspaces with role, created, last sign-in and open sessions.
  Search is a GET form (?q=) on email or name, % and _ matched as typed. Respondents have no
  account and are not listed; the intro says so.
- "Signs in with": Sign-in link for everyone (a magic-link account has no account row in
  better-auth's tables), plus Google or Microsoft when an account row of that provider exists.
- Last sign-in is the newest session's start: better-auth keeps no sign-in time of its own,
  and E13-1 records sign-ups only.
- Sessions show start, expiry, open or expired, and the browser and system family read from
  the user agent by a few patterns in src/lib/accounts.ts (Edge before Chrome, Chrome before
  Safari, iOS before macOS). The token, the address and the raw user agent are never read into
  the page.
- The actions, behind the confirm form of design note 86: send a sign-in link (better-auth's
  own sender, so it works once and expires in 15 minutes), sign out everywhere (better-auth's
  internalAdapter.deleteUserSessions), remove from a workspace (src/lib/members.ts, the same
  last-owner rule and messages a PM meets), delete the account (internalAdapter.deleteUser,
  which removes the sessions, the accounts and the user row; the schema then removes the
  memberships and sets created_by, invited_by, deleted_by and the events' user id to null).
- A deletion is refused while the person is a workspace's only owner (the message names the
  workspaces), and for the admin's own account. After a deletion the page is not read again,
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
