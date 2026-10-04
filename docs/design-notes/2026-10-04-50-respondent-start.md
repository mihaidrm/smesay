# Design note 50: the respondent's start, 2026-10-04

Made in the Claude Code cloud session of 2026-10-04 for stories/E7-1, under decision 0044.
Files: src/lib/respondent.ts (what a link shows, Start), src/lib/respondent-rules.ts (the
field, perspective and chapter rules, shared with the client), src/db/queries/responses.ts
(forDevice, startPersonal), src/app/r/[token]/page.tsx, start/route.ts and
respondent-app.tsx, src/components/respondent/respondent-header.tsx and chapter-screen.tsx.

## What was decided

- The respondent journey is one client component over the screens (About you, the
  chapters, later the Wrap up and Done), rendered on the server with this device's response
  so the first paint carries the screen. Moving between screens happens in the browser and
  keeps the address in step through the history API (?at=about, ?at=[chapter number]), so
  Back and a reload land on the same screen. The story's "server-rendered cards with client
  islands" is met by the server render of the client component; the cards are not separate
  islands (docs/review-list.md).
- Start posts About you as JSON to /r/[token]/start. The server keeps only the fields the
  PM configured, checks a dropdown against its options and an email field as an address,
  caps each value at 200 characters, and lets a personal invite's carried name and role win
  over anything posted for their keys. The perspectives must come from the instrument's list.
- A personal link has one response, created on the first Start under the invite row's lock
  (two devices starting at once make one row) and found by the invite on any device. A
  public link has one response per device, keyed by a 32-hex device token set on the first
  Start in an httpOnly, SameSite Lax cookie on the link's path; a second Start on the device
  updates the same row. A device token from another link's cookie finds nothing.
- Every write checks the link first, as the page reads it: unknown 404, sample or passcode
  403, not open yet 409, revoked or closed 410. The client reloads on those so the page
  shows the link's state; a 422 shows the server's sentence under Start.
- The sample project's links never collect answers (E8-8, acceptance 2): they show "This
  is a sample link." The story's Playwright paths that name the sample link use a project
  the test publishes, as E6 did.
- A closed personal link whose respondent started shows the closed page with their own
  count ("You answered [N] of [M] items before it closed. They were not submitted ...");
  a closed public link shows none (decision 0031).
- The header is one component for every respondent page: the workspace's logo at 24 px
  when it has one (from the workspace row through the link, never the URL), else its
  initials on the accent, the name, and the note. Items with no area form a last chapter
  named "Other items", in the Build preview too.

## What was not decided

- "Welcome back" with the count answered: E7-4, once answers exist.
- The chapter screen's answers, Saved and Continue: E7-2 to E7-4.
