# E6-4 Kill switch: revoke the public link or one personal link

User: a PM whose link reached the wrong people, or one person who should not answer anymore
Status: ready
Outcome: a revoked link shows the inactive page within one minute; answers already given are
kept.

## Acceptance criteria
1. "Revoke link" on the public link card sets revoked_at; the card shows Revoked with "The
   link now shows a page saying it was withdrawn. Answers already given are kept." and
   "Publish again", which creates a new token (the old one stays dead).
2. A revoked personal link shows the same page; the row shows Revoked and a "New link" action
   that creates a fresh token and offers to send it.
3. The revoked page is the respondent board's: "Link inactive. The project team at [WORKSPACE]
   withdrew this link. If you were asked to answer, ask them for a new one. Nothing was saved
   from this visit." It returns a page, not data (SECURITY.md).
4. Within one minute: the respondent app checks the link state on every autosave and on a
   60-second poll, so an open tab turns inactive without a reload; a test proves an autosave
   after revocation is refused with 410 and nothing written.
5. Playwright: open the public link, revoke it in the PM app, see the inactive page in the
   respondent tab within 60 seconds.

## Out of scope
- Deleting answers given through a revoked link: not in R1; the PM can see which invite they
  came from in the tracker.

## Open questions
- None.

## Technical notes
invite.revoked_at (docs/schema.md). The respondent app's state check is one route,
/r/[token]/state, also used by E7-3's offline recovery.
