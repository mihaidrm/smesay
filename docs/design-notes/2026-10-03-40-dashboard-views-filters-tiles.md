# Design note 40: the dashboard reads the way the PM asks, 2026-10-03

Made in the Claude Code cloud session of 2026-10-03 from Mihai's message: "would be cool if
user could change from the bars view to pie chart and maybe other types of visualizations;
user must have ability to sort and filter results (a certain department, only the ones that
pushed back, only the ones that left comments); the pushed back needs to be split into
something to show the user proposed different prio, and disagree which are very different;
the tallies at the top need to be configurable as well." Stories E8-1 to E8-4 and E10-1
amended; nothing is built yet.

## What the stories already had, and what was missing

- The split Mihai asks for exists in the data since decision 0014 (answer kinds `change`
  and `disagree`) and in E8-1's strip (pushed back and disagreed are two numbers) and E8-4
  (two registers). It was hidden by the word: "pushed back" named the `change` kind on the
  strip and the tab, and the legend on the landing page and in docs/design-system.md still
  showed three segments (agree, pushed back, unclear) from before decision 0014. The fix is
  one name per kind everywhere: Agree, Different priority, Disagree, Unclear.
- Filters existed on the Responses tab only (E8-2) and the registers shared them (E8-4); the
  strip, the agreement table and the exports did not take them. Now one filter bar at the
  top of Results applies to every tab, every number and the CSV (E10-1), so a filtered
  screen still reconciles to the row.
- Sort existed on the tracker and the registers; now on every table.
- The strip was fixed at six numbers; now the PM picks up to six tiles from a catalogue.
- One chart, the stacked bar per item; now a view switch on the Agreement tab.

## The research behind the chart choice

- Cleveland and McGill, "Graphical Perception and Graphical Methods for Analyzing
  Scientific Data" (1984), as read through Robert Kosara, "Stacked bars are the worst",
  eagereyes.org, 25 August 2016: people judge lengths on a common baseline best, angles
  and areas worse, and segments of a stacked bar worst of all. Kosara's ranking from the
  paper: aligned bars, then pie charts, then stacked bars. Quote from the paper: "The
  results show that these are the most difficult, producing the highest error."
- So the stacked bar per item (the current default) is the compact view, not the readable
  one, and a pie is not the worst choice for a part-of-whole question about one area or the
  whole list. The design system's "never a pie" (docs/design-system.md, Data; from the
  brand proposal of 2026-10-01) was a taste rule; against this research and Mihai's ask it
  is relaxed to: a donut only at the area and list level, never per item, always with the
  numbers printed beside it, never more than five slices (the four kinds and not answered).
- Dashboard filtering practice (help pages of SmartSurvey, Apteco Orbit, Retently, Checkbox
  and Sogolytics, read 2026-10-03): survey dashboards filter either the whole dashboard or
  one tile; the respondent-attribute filter (department, role, country) is the standard
  first filter; the filter travels in the URL so a view can be shared. SMEsay takes the
  whole-dashboard filter in R1; a per-tile filter is a candidate for R2.

## What was decided (the defaults in the stories; Mihai confirms or changes)

- One filter bar over Results (E8-1): respondent fields, answer kind, "with a reason or
  comment", perspective, status; in the URL; every tab, number, chart and export honours it;
  a line under the strip says what is filtered and how many responses are in.
- Names: Agree, Different priority, Disagree, Unclear, Not answered; the tab "Pushed back"
  becomes "Different priority and Disagree" with the count of both; the strip's default
  tiles use the new names; the design system's Data section and the landing page legend
  follow when E8 is built (the landing claims list, decision 0042).
- Views on the Agreement tab (E8-3): Table (stacked bar per item, compact, default);
  Columns (aligned bars per answer kind, per area, the readable one); Share (a donut per
  area and one for the list, numbers beside). The choice is kept per PM.
- Group comparison on the Agreement tab (E8-3, next to E8-6's gaps): "Split by [field]"
  turns every item's bar into one bar per group, the small-group rule of E8-6 applying.
- Tiles (E8-1): a catalogue of twelve, six on by default, up to six shown, chosen per PM
  per instrument; every tile is one SQL number that honours the filter.

## Questions for Mihai, decided by Claude under decision 0044 (the recommendations below)

1. The donut at area and list level, as above, or no pie at all (the rule as written)?
   Recommended: the donut as above.
2. The name for the `change` kind: "Different priority" (recommended), "Changed priority",
   or "Other priority". It appears on the strip, the tab, the legend, the registers, the
   CSV header and the landing page.
3. Tile choice kept per PM (recommended: each PM sees what matters to them) or per
   workspace (one view for the team)?
4. The tile catalogue in E8-1: anything missing that you look at first?
