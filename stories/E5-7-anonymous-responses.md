# E5-7 Anonymous responses: the PM chooses Named, Names hidden or Anonymous

User: a PM whose experts answer more freely when they are not named
Status: built
Outcome: on Build the PM picks how far respondents are identified, the respondent is told on
About you, and Results, exports and the AI show nothing that names a person beyond what the
level allows.

Mihai, 2026-10-06: "Do we have the option of making responses annonymous? i mean the PM
setting up should have this option". Asked whether personal invites stay, he picked "Both, PM
picks": two levels besides today's.

## Acceptance criteria
1. Build has a card "Who sees whose answers" with three choices, stored on the validation
   (instrument.anonymity: named, hidden, anonymous; a migration gives every existing row
   named):
   - Named (the default, today's behaviour): Results show each person's name and fields.
   - Names hidden: personal invites and reminders still work, and Share still shows who has
     finished; Results, exports and the AI show answers without names or fields. The card says
     that with few people, the finishing times on Share can still point to someone.
   - Anonymous: the public link only; no personal invites, no name or email fields.
   The choice is checked on the server and locked once published, like the method (E5-2).
   "Build on version N" copies it; the project export and import carry it.
2. Under Names hidden and Anonymous the respondent fields can only be dropdowns. A text or
   email field is refused on save with a message that names the fields to change, and choosing
   either level while such a field exists is refused the same way (the default fields Name
   and Role are text, so the PM removes Name and makes Role a dropdown).
3. About you tells the respondent, above the fields: Anonymous: "Your answers are anonymous.
   Nothing here asks who you are, and the team sees your answers without a name."; Names
   hidden: "The team sees your answers without your name. They can see that you have
   finished." The invite email under Names hidden drops "recorded under your name" and says the
   same as About you. Named pages and emails do not change.
4. Results under Names hidden and Anonymous: every response is "Anonymous [N]", numbered by
   when it started across all its links; the Responses tab has no field columns, no submitted
   time and no sort by field, and no row for an invitee who has not started; the item detail
   and the registers show "Anonymous [N]" and no field column. A dropdown value picked by fewer
   than 3 respondents (MIN_GROUP) is not offered as a filter or a split, and the gaps view
   keeps its rule. The text "contains" filter matches answers and reasons only.
5. Exports under Names hidden and Anonymous: the answers, people and missing-item CSVs use
   "Anonymous [N]" and carry no field columns and no times; the PDF summary names nobody and its
   sign-off record shows "Anonymous [N]"; the project JSON does not let a reader tie a response
   to a personal invite (responses carry no invite id and no fields), and imports back as
   such.
6. Write actions under Names hidden and Anonymous send no respondent fields to the model
   (answers, reasons, comments and missing items only, as today otherwise); citations read
   "Anonymous [N]".
7. Share under Anonymous shows "Anonymous validations use the public link only." in place of
   the personal invites form; the server refuses an invite to an anonymous validation.
8. The privacy policy says what each level hides and what it does not (under Names hidden the
   database still links an answer to its invite, for reminders), marked for the lawyer.
9. Unit tests: the rules per level (fields allowed, labels, the MIN_GROUP filter), the
   queries and the CSVs per level with a workspace A and B test for any new query, the export
   round trip. Playwright: set Anonymous on Build, publish, answer through the public link and
   see the About you line, then see "Anonymous 1" and no field column on Results.

## Out of scope
- Hiding the device cookie or the in-memory IP counts, which hold no name.
- Anonymity from the workspace's own database under Names hidden (the invite link stays).

## Open questions
- None; the calls taken are rows of docs/review-list.md dated 2026-10-06.

## Technical notes
Follow reasonRule (design note 98, drizzle/0035) for the column, the lock and the copy across
Build on version N, the preview, the export and the sample (the sample stays Named).
MIN_GROUP is src/lib/results-agreement.ts. Change INTERFACES.md first.

Built 2026-10-06 (design note 100):
- Acceptance 1: instrument.anonymity (drizzle/0036_anonymity.sql, CHECK
  instrument_anonymity_check, every existing row named); the card "Who sees whose answers" on
  Build above the Respondent fields card (build/anonymity-form.tsx, ANONYMITY_META in
  src/lib/anonymity.ts); saveAnonymity in src/lib/instruments.ts under instruments.updateLocked
  (refused once published); buildOnLatest copies it; the project file carries it
  (src/lib/export/project.ts). Tests: src/db/schema.test.ts (the migration on a row from
  before it, the check), src/lib/instruments.test.ts (save, refuse, copy, lock, another
  workspace), src/lib/export/project.test.ts (round trip, an older file reads named).
- Acceptance 2: fieldsBlocking in src/lib/anonymity.ts; saveFields and saveAnonymity refuse a
  text or email field by name, under the instrument row's lock. Tests: instruments.test.ts.
- Acceptance 3: AboutYou's line above the fields (src/components/respondent/about-you.tsx,
  ABOUT_YOU_COPY.anonymous and namesHidden); carriedFields carries nothing under Names hidden
  and Anonymous; the invite email's namesHidden (src/lib/mail/templates/invite.ts). Tests:
  src/lib/respondent.test.ts (carriedFields, a hidden personal Start stores no name),
  src/lib/mail/templates/templates.test.ts, src/lib/invitees.test.ts.
- Acceptance 4: the SQL in src/db/queries/results.ts head (who null, anon over all links, no
  invite rows, pub_fields and pub_submitted_at for every row returned, reminders null);
  responses-tab.tsx and registers-tab.tsx drop the columns; resultsContext
  (src/lib/results-context.ts) with results.fieldValueCounts offers a value only with
  MIN_GROUP counted respondents; foldSmallGroups for the split; a name never matches the text
  filter. Tests: src/db/queries/results.test.ts ("Names hidden and Anonymous on Results",
  with the workspace A and B test for fieldValueCounts), results-filter.test.ts,
  results-agreement.test.ts.
- Acceptance 5: src/lib/export/files.ts (no field, time, source, reminder or perspective
  column), src/lib/export/summary.ts (sign-off with no time), toFile (no invite id, no
  fields) and importProject (the response on its public invite). Tests: results.test.ts (the
  three headers, the strip reconciled), src/lib/export/summary.test.ts, project.test.ts.
- Acceptance 6: writeActions sends no field (src/lib/insights.ts); the citations' SQL names
  nobody (src/db/queries/insights.ts). Tests: src/lib/insights.test.ts on the fake transport.
- Acceptance 7: InvitesCard's line (share/invites-card.tsx); sendInvites and renewInvitee
  refuse (INVITEES_ERRORS.anonymous). Test: invitees.test.ts.
- Acceptance 8: docs/legal/privacy.md, respondents' section, AI and exports paragraphs, with
  [LAWYER: check L43]; docs/legal/lawyer-review.md L43.
- Acceptance 9: the unit tests above; e2e/anonymous.spec.ts written, run by the main session.
