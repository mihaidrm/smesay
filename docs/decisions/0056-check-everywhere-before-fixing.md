# 0056 A change Mihai points at is checked everywhere before it is fixed, 2026-10-05

Mihai, 2026-10-05, with a screenshot of the About you dropdown: "the dropdown arrow looks a bit
weird on this design like its not from the same set like the box, or maybe its a bit too close
to the border not sure, and also the dropdown rectangle square that contains the list is square
while the box above it is rounded corners, also looks a bit weird - When i suggest changes from
now on, make sure you check everywhere in the app before fixing".

Decision: when Mihai points at one thing, Claude first finds every place in the app with the
same thing (every screen on the PM side, the respondent side, the admin pages, the landing
page and /sample, in light and dark, and every canvas board) and fixes them all in the same
pull request. The pull request lists the places found. This adds to decision 0017, which
covers the wording of one change; this one covers the places the same problem shows up.

Consequences: CLAUDE.md has the rule beside decision 0017. The first change made under it is
design note 96 (every native dropdown in the app, 12 files and 3 boards).
