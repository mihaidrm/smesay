# 0058 Under the two levels that hide names, breakdowns stay and the risk left is disclosed, 2026-10-06

Mihai, 2026-10-06, asked after the second audit of stories/E5-7 whether Results under Names
hidden and Anonymous should keep filters and splits by dropdown fields and perspectives. He
picked "Breakdowns, risk disclosed" over the alternative "No breakdowns".

Decision: under Names hidden (`hidden`) and Anonymous (`anonymous`) Results keep the filters
and splits by dropdown fields and perspectives, with the groups of 3 or more already built
(MIN_GROUP, decision 0031; design note 100). The risk that remains is said plainly, not
engineered away: comparing views (a filtered view against an unfiltered one, two splits, a
group's median or counts against a list of people) can still single out someone in a small
group, as can, under Names hidden, the times Share shows (finishing and last-save times, live
updates) and the fact that Write actions cites only people who submitted. The Build hints, the
lines on Results, the privacy policy (L43) and SECURITY.md say so.

Rejected: "No breakdowns", which would drop the field and perspective filters, the split and
the gaps view under both levels. It removes the comparison risk, and with it the views a PM
uses to see where groups disagree (E8-6), which is the reason most validations ask for a role.

Fixed with it, from the same audit (each with a test; story E5-7, amended criteria):

- The "Anonymous [N]" numbers under the two levels follow a fixed order, md5 of the response id
  and the instrument id, not the start that Share shows, everywhere a number appears: Results,
  the CSV files, the PDF, the Actions citations and the project file's order.
- Under Names hidden no list says who has not finished: the "Not answered" kind is not offered,
  a list of people never follows it, and the item detail lists no one without an answer.
- The project file under the two levels writes the responses in the order of their numbers,
  under Names hidden the submitted ones only, and no answer on an item fewer than 3 of them
  could see.
- Under Anonymous, as under Names hidden, the Responses tab has no sort by progress.
- With a field or perspective filter under the two levels, the tiles count the people the
  filter keeps while the lists and the Answers, People and Missing items files list everyone.
  This is an exception to the CLAUDE.md rule that every number reconciles with the CSV export
  to the row, recorded in docs/review-list.md; the Items with totals file still adds up to the
  tiles under any filter, and the Export tab says which file does.

Consequences: stories/E5-7 criteria amended ("Amended 2026-10-06, decision 0058"); design note
100, INTERFACES.md (Anonymity, Results), docs/copy/app.md and errors.md, docs/legal/privacy.md
with lawyer-review.md L43, and SECURITY.md updated.
