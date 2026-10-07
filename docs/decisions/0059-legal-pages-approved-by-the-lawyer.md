# 0059 The lawyer approved the legal pages; version 3 drops the check markers, 2026-10-07

Mihai, 2026-10-07: "lawyer check all items and he approved so you can remove the tags for lawyer
to check".

Decision:
- The 42 "[LAWYER: check L#]" markers of version 2 (decision 0054) are approved as written and
  removed. The privacy policy, the terms, the DPA and the subprocessor list are version 3, dated
  2026-10-07, with the same text minus the markers and the sentence that called the values
  proposed. docs/legal/lawyer-review.md stays as the record of each value's source.
- The three markers that ask for the registered address, the registration number and the fiscal
  code stay: they ask for facts, not a check, and GDPR Art. 13(1)(a) wants the controller's
  identity and contact details on the page. They go in one commit when Mihai sends the values,
  with COMPANY_ADDRESS for the emails' footer.
- A paragraph written after the lawyer's read keeps its marker until he reads it: the identity
  levels of E5-7 (privacy policy, "What we collect from respondents", in the anonymous
  responses pull request).
- The rule stays: legal pages mark every place a lawyer must confirm (CLAUDE.md). The marker
  renderer, `npm run legal:markers` and their tests stay for the markers to come.

Consequences: docs/accounts.md step 12; stories/E11-3 and E12-5; docs/plan-steps.md E11 row and
the launch gate line; src/lib/legal.test.ts and e2e/legal.spec.ts expect version 3 and one
marker on three pages; docs/review-list.md row.
