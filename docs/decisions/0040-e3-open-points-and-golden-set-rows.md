# 0040 The seven E3 points and two golden set lines keep their defaults, 2026-10-03

Status: decided by Mihai on 2026-10-03 ("2 and 3 go with your recommendation"), closing the
points asked on 2026-10-02 (stories E3-1, E3-2, E3-3, E3-5; design notes 21 and 23) and the
two source lines of design note 32.

1. Uploads are parsed server-side in the request, within the 5 MB and 2,000-row caps, not in
   a worker. SECURITY.md says so; no worker before launch.
2. Header detection keeps asking for at least two filled cells in the header row
   (MIN_FILLED, src/lib/import/header.ts): a one-column list gets the row picker and the
   mapping, since a single cell cannot be told from a first item. E3-2 acceptance 2 says so.
3. The no-header message stays: "No header row found. Pick the row that holds the column
   names, or tell us which column is the requirement." The mapping card (E3-3) is the control
   it points at.
4. The last mapping role is "Do not import", the board's word; "Ignore" leaves E3-3.
5. Delete sample is a hard delete of the workspace's sample copy, the one exception to
   decision 0028's "the app deletes nothing in R1": the sample is seeded, not the PM's work,
   and the seed puts it back. Decision 0028 points here.
6. (Changed by E6-1 on 2026-10-03: such a project reads Scheduled, docs/review-list.md.) A project whose only links have an open date in the future reads Closed in the list, as
   the status code says (src/lib/project-status.ts): the link is closed to respondents today.
   E6-1's page copy ("This link opens on") is where the date shows; a Scheduled value can
   come with E6 if it reads wrong then.
7. The Results pill of the stepper carries no count. E3-5 acceptance 5 reads: after commit
   the stepper moves to Shape and the project list's Responses cell reads 0 of 0.
8. The two source lines outside the golden set rows stay out: spec 04's "the website must
   not look like the old one (Mihai will do the design)" and spec 08's "the washing
   machines are not part of this, separate contract" are remarks, not requirements.

Consequences: SECURITY.md, stories E3-1, E3-2, E3-3 and E3-5, decision 0028 (a pointer),
design notes 21, 23 and 32, docs/context.md and the Stories board on 2026-10-03.
