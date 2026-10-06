# Design note 100: who sees whose answers, 2026-10-06

Made in the Claude Code cloud session of 2026-10-06, under decision 0044, for stories/E5-7.
Mihai: "Do we have the option of making responses annonymous? i mean the PM setting up should
have this option". Asked whether personal invites stay, he picked "Both, PM picks".

## What was decided

- Build gets a card "Who sees whose answers" with three radio cards drawn like the method's:
  Named (the default, the product before this note), Names hidden and Anonymous. It sits
  directly above the Respondent fields card, not with the scoring: its rule is a rule on the
  fields (dropdowns only under the two levels that hide names), so the refusal it can give and
  the card that fixes it are next to each other. No new component: the radio cards are the
  Scoring card's (docs/design-system.md, the method cards).
- Stored as instrument.anonymity (migration 0036, default `named`, a check constraint),
  checked on the server, locked once published like the method: a level changed mid-run would
  show names a respondent was told were hidden. Build on version N copies it; the project file
  carries it; the visitors' sample and the preview of a project with no validation are Named.
- Under Names hidden and Anonymous the respondent fields can only be dropdowns. The check runs
  on both saves (the level and the fields), each under the instrument row's lock, so two tabs
  cannot end with a text field under a hidden level. The message names the fields to change.
  At least one field is still required (E5-1); a dropdown Role is the usual one.
- About you says, in bold above the fields, "Your answers are anonymous. Nothing here asks who
  you are, and the team sees your answers without a name." or "The team sees your answers
  without your name. They can see that you have finished." The Names hidden invite email
  drops "recorded under your name" and says the same. A personal invite carries no name or
  role into the response under either level: the PM typed them about one person, so the role
  hint would put that person's own words back on Results.
- The rule lives in the SQL. results.ts head reads the level: under the two levels who is
  null, every response is numbered by start across all the validation's links (anon), the
  invitees who have not started are not people, and every row the queries return carries
  pub_fields ({}) and pub_submitted_at (null) and no reminders. The filters, the split and
  the gaps still read the stored dropdown values. insights.ts's citations follow the same
  rule. A page, a CSV or the PDF cannot show what the query does not return.
- The Responses tab shows Respondent, Status, Progress and With a reason or comment. Submitted,
  Source and Reminders go too, not only the fields: Share lists the invitees with their
  reminders and their last save, so any of the three could match a row to a name.
- A dropdown value picked by fewer than 3 counted respondents (MIN_GROUP, decision 0031) is
  not offered as a filter: resultsContext counts the values (results.fieldValueCounts, under
  the page's switch) and reads the URL again against the values offered, for the page and the
  export route alike. A field with none offered is not shown; a line under the bar says why.
  In a split those values are summed into one group, "Groups under 3 people"; Not given stays
  apart. The gaps view keeps its rule (groups under 3 answers are drawn with no numbers).
- The CSV files drop the field columns, Submitted at, Source, Reminders and Perspectives. The
  People file keeps Minutes to submit: a duration, not a time, and the median tile reconciles
  with it. The PDF's sign-off record reads Submitted with no time, in the order of the numbers.
  The project file writes no invite id and no fields on those responses; the import puts each
  on its validation's public invite. The Export tab says what the files leave out.
- Write actions sends no respondent field at all under the two levels: each respondent is a
  bare R ref. The prompt's text and its input shape are unchanged, so no eval is owed
  (decision 0039).
- Share under Anonymous shows one line in the personal invites card, "Anonymous validations
  use the public link only.", and the server refuses a send or a New link. Under Names hidden
  the card's line says Results show the answers without names.
- The privacy policy says what each level hides and what it does not (the invite link in the
  database under Names hidden, the device cookie, the save times, free text, small groups),
  marked L43 for the lawyer.

## Rejected

- A free-text search over answers and reasons for the "contains" filter (acceptance 4's last
  line): no such filter exists today, and under the two levels there is no text field, so the
  contains box does not show and a name can match nothing. Recorded in docs/review-list.md.
- Hiding the perspectives the respondent picked from the filter, as the dropdown values are:
  the perspective select is unchanged; the per-answer Perspectives column of the CSV goes.
  Recorded in docs/review-list.md.
- Dropping Minutes to submit from the People file: it would break the reconciliation of the
  median tile, and a duration does not match Share's finishing times.

## Where

drizzle/0036_anonymity.sql; Anonymity in INTERFACES.md and src/db/types.ts; ANONYMITY_LEVELS in
src/db/schema.ts; src/lib/anonymity.ts; src/lib/instruments.ts saveAnonymity and saveFields;
build/anonymity-form.tsx and build/page.tsx; src/lib/respondent-rules.ts carriedFields;
src/components/respondent/about-you.tsx; src/lib/mail/templates/invite.ts; src/lib/invitees.ts;
share/invites-card.tsx; src/db/queries/results.ts; src/db/queries/insights.ts;
src/lib/results-context.ts; src/lib/results-filter.ts optionsFor; src/lib/results-agreement.ts
foldSmallGroups; results/filter-bar.tsx, responses-tab.tsx, registers-tab.tsx,
agreement-tab.tsx, export-tab.tsx; src/lib/export/files.ts, summary.ts, project.ts;
src/lib/insights.ts. Board: PmApp draws the card on Build.

## Checked

Unit tests on the test database: the migration on a row from before it; save, refuse, copy and
lock on Build; every Results query under Names hidden on the sample (names, fields, times,
reminders, invitee rows, numbering, sorts, the name filter); the three CSV headers and the strip
reconciled; fieldValueCounts and resultsContext, with another workspace reading nothing; the
PDF; the project file's round trip; Write actions on the fake transport; a refused invite and
the Names hidden email; a hidden personal Start storing no name. e2e/anonymous.spec.ts is
written and not run in this session; the main session runs e2e.
