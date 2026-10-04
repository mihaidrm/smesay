# Design note 56: after Submit, 2026-10-04

Made in the Claude Code cloud session of 2026-10-04 for stories/E7-6, under decision 0044.

## What was decided

- The Done screen carries the summary line, counted from the respondent's answers as the
  Wrap up's tally is, plus the missing item: "[N] agreed, [N] changed, [N] not needed, [N]
  unclear, [N] items added" ("changed" is a higher or lower priority; ", [N] rated" follows
  "changed" when items without a proposal were rated; rate-blind starts with "[N] rated"). The
  missing item counted is the one on the Wrap up now, as the other counts come from the cards
  now.
- A submitted response opened again lands on the Done screen in its welcome-back form:
  "Welcome back, [FIRST NAME]. You submitted on [DATE]. You can change your answers until
  [CLOSE DATE]." Change my answers reopens the Wrap up with the sign-off cleared (note 12,
  finding 10); the rest of the Wrap up shows what the server holds (E7-5 saves it as it is
  written).
- After the close, a submitted personal link shows its own line under "Link closed."; a
  closed public link still shows nothing per device (decision 0031).
- Answers can change after Submit (they save as before); the submitted time moves with the
  next Submit. Any change after a Submit (an answer, the Wrap up, About you details or picks)
  takes the sign-off back on the server until the next Submit (acceptance 6, added from
  E7-5's audit): the sign-off was for the answers as submitted. Done and the Wrap up say "You
  changed answers after submitting. Submit again to send them." The PM gets two functions
  for the tracker (E8-2): changedAfterSubmit (the last save is later than the first Submit;
  a Submit, and a Start that changes nothing, do not move the last save) and
  changedSinceSubmit (submitted, not signed off: changes not submitted again).
- A closed personal link with a submitted response shows its own line and clears what the
  device kept for the link (the audit's first blocking finding: the page had dropped that);
  a revoked link shows nothing of the respondent's, also once its project is archived.
- The answer's time is the request's, as Start's and Submit's are, so the mark compares like
  with like.

## Checks

- src/lib/respondent-submit.test.ts: the words (the rated count, no close date, the closed
  line), the two marks, the sign-off taken back by an answer and by the Wrap up and given by
  a Submit, a Start that changes nothing, the reopened and the closed states, a revoked link
  on an archived project.
- e2e/respondent-after-submit.spec.ts: submit, reopen, welcome back, change with the notice,
  a new time and no notice.
