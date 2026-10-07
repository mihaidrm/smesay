# 0062 A different priority and not needed are two numbers, never one, 2026-10-07

Mihai, 2026-10-07: "In the results, there are 2 types of agreements we should show: There is a
difference if the user thinks the priority is different, compared to the user thinking this is
not a valid requirement. So we need to show and track both of these stats independently."

Decision:
- The rule: a different priority (the `change` kind) and not needed (the `disagree` kind,
  decision 0014) are never added into one number anywhere a person reads: no tile, tab name,
  figure, line, column, chart label or email sums them. Each place that showed one merged
  number shows two.
- Results: the tile "Items with a different priority or disagree" is two tiles, "Items with a
  different priority" (items with at least one change) and "Items marked not needed" (items
  with at least one disagree); a PM whose saved choice held the merged tile gets neither until
  they choose again. The tab reads "Different priority [N] · Disagree [N]". Beside every
  agreement figure sit two shares, Different priority (change over answered) and Not needed
  (disagree over answered), with the agreement's rounding, on the Agreement tab, in the gap
  lines, in the items CSV (two columns after Agreement %) and in the PDF (per area and per
  item).
- Copy: "pushed back" leaves every user-facing place (the quickstart, the landing page, the
  styleguide's tab names). The code keeps the `pushedBack` pill status and the `--pushed`
  colour token, which no person reads.
- The sample: Lukas Berg marks CL-05 not needed, so the two item counts differ (5 and 3), no
  single person or role holds every disagree, and the totals are 18 agree, 7 different
  priority, 3 disagree, 2 unclear of 30 (60 percent agree), no item fully agreed. The landing
  demo mirrors these numbers.

Consequences: design note 114; INTERFACES.md (ResultsNumbers, ItemCounts, GapGroup);
stories E1-4, E8-1, E8-3, E8-4, E10-1, E10-3; docs/copy/app.md, landing.md, quickstart.md;
docs/review-list.md rows; the boards PmApp and PmAppV2 stay as records of the earlier
merged tile. Decision 0033's numbers (19 of 30, 63 percent) are the sample's history.
