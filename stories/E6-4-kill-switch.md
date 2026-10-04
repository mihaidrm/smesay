# E6-4 Kill switch: revoke the public link or one personal link

User: a PM whose link reached the wrong people, or one person who should not answer anymore
Status: built
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

Owed from E6-2 (recorded 2026-10-03): the personal links take the public link's dates and
follow them, and sending is refused while the public link is revoked ("The public link is
revoked. Publish again to send invites."). This story decides what revoking the public link
does to the personal links (as built, nothing: they are revoked one by one) and makes
"Publish again" replace the revoked public row, since invites.publish returns the existing
row of an instrument (created: false); docs/review-list.md.

Built 2026-10-04 (design note 49, decision 0044):
- Acceptance 1: "Revoke link" under the public link card's form (share/revoke-link.tsx)
  sets revoked_at under the project row's lock (invites.revokePublic); the card reads
  Revoked with the note, the link row goes, and "Publish again" (the same form, Publish
  mode) makes a new public row with a new token (invites.publish, src/lib/sharing.ts); the
  revoked row stays and its token keeps showing the inactive page.
- Acceptance 2: Revoke on a personal row sets its revoked_at (invites.revokePersonal); the
  row reads Revoked with the date and the link shows the inactive page; "New link" gives
  the same row a fresh token with the public link's dates and sends email 2 to the address
  (invites.renewPersonal, renewInvitee); the old token then reads as unknown.
- Acceptance 3: the inactive page from E6-1 (src/components/respondent/link-page.tsx), a
  page, not data; the state route answers a status and one word.
- Acceptance 4: GET /r/[token]/state (src/app/r/[token]/state/route.ts, linkStatus in
  src/lib/link-access.ts) answers 200 open, 404 unknown, 410 revoked or closed; the open
  page polls it every 60 seconds, and at once when a background tab comes to the front
  (src/app/r/[token]/link-watch.tsx), and refreshes itself on anything but 200 open, so an
  open tab turns inactive without a reload. The autosave route (E7-2, E7-3) refuses to
  write on a link that is not open through openLinkFor in src/lib/respondent.ts, the same
  rule (viewOf), and answers 410 with nothing written (E7-3, acceptance 7);
  src/lib/revoke.test.ts proves the check answers 410 after a revocation and that the
  route handler returns 410 with the state word only (docs/review-list.md).
- Acceptance 5: e2e/revoke.spec.ts opens the public link in a respondent tab, revokes it
  in the PM app, sees the inactive page in that tab within 70 seconds (the 60-second poll),
  publishes again, opens the new link, revokes the personal row and reads the new link's
  email.
