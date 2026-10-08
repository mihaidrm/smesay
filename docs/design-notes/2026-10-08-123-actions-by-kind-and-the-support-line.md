# 123 Actions by kind, and the people an action needs behind it, 2026-10-08

Mihai, 2026-10-08, on a screenshot of the Actions tab: "should group up the actions into
categories with tabs (Follow up, Rewrite etc) and these decisions should be based also on
number of respondends. (If 100 ppl answer and just 1 doesnt agree with something doesnt mean
we make it as an action item) Think really hard about how this system should asses when an
action item is created based on how many people responded. and for the user to be easier
maybe explain this process somehwere in the actions page".

Decided:
- One tab per kind on the Actions tab, in the order Follow up, Rewrite, Groups disagree,
  Coverage (KIND_ORDER in src/lib/insights.ts), each with its open count in mono. The first
  tab with an open action is selected on load (the first with any action when none is open,
  Follow up when there are none). A tab holds the kind's open actions, then its Done and
  Dismissed sections; a kind with nothing open says "None open." and what the kind is ("A
  question respondents asked that someone should answer."). The four panels stay in the page,
  hidden, so Mark done and Dismiss keep working after a tab change and the Results tab's
  count ("Actions (N)") stays the open ones over every kind.
- The tabs are a new component, src/components/app/tabs.tsx: the ARIA tabs pattern
  (w3.org/WAI/ARIA/apg/patterns/tabs/; role tablist, tab, tabpanel, aria-selected,
  aria-controls, one tab stop, the arrow keys, Home and End), drawn in the segmented
  control's look (the tint track, the active tab a surface pill), since the Results page's
  own tab row (the underlined links) is the level above. The count is part of the tab's name
  ("Follow up 2").
- The support line, the rule Mihai asked for: an action needs at least one in ten of the
  people who answered the item it is about, and one person when ten or fewer answered
  (peopleNeeded in src/lib/insights.ts: the number is max(1, ceil(answered / 10))). A
  missing item is weighed against everyone who submitted. A groups-disagree action needs
  both groups above the line. So one person out of a hundred makes no action; one of six
  does; three of thirty do. The number 10 is one constant (SUPPORT_SHARE).
  Why one in ten and not a count: a fixed count (say three people) would silence a team of
  four, where one voice is a quarter of the room, and would let three of three hundred
  through. Why no second floor ("at least two people above five answers"): it would drop a
  missing item suggested by one of six, which a six-person validation should see, and the
  evals' fixtures (six and five respondents) show exactly that case. Why ten and not twenty:
  the list is the top eight, ranked by the model; the line only has to keep lone voices out,
  and three of thirty with reasons is something a PM wants to look at.
- Applied twice. In the prompt (src/lib/ai/prompts/insights.ts): the instructions carry the
  rule, every item line ends with "An action needs N people behind it." from its answered
  count, and the MISSING ITEMS heading says how many submitted and the number a missing
  item needs. In the app (supportedActions): after the citation check, an action whose
  distinct cited respondents are fewer than the line of the most-answered item it cites
  (of everyone who submitted when it cites a missing item) is dropped, and the drop is
  logged with its count. The evals runner (evals/insights.ts) applies the same line from
  the fixture's counts, so a pass there means the same as in the app.
- "How actions are chosen" under the Write actions button: a details element, closed, whose
  summary is a 13 px violet line, with three short paragraphs: what the AI reads and that
  every action names its people; the support line in words, and that a lone answer stays
  on the Different priority and Disagree tab and the Questions and gaps tab; that Groups
  disagree needs both groups above the line and that done and dismissed actions stay out of
  a new run. Shown on the sample too, since the sample is where people learn the tab.

Rejected: an "All" tab (the kinds are the point, and the Results tab's count already sums
them); the tabs in the address (the main tabs are, a second level there would make Back
walk through kinds); a fixed count or a percentage with a second floor (above); hiding a
kind's tab while it has no action (the four names teach what the AI looks for); a per-action
"N of M people" badge (the citations already name them; a later note can add it if the
names get long).

Tests: src/lib/insights.test.ts (peopleNeeded at eight sizes, supportedActions over seven
cases, the prompt's per-item and missing-items lines and the instruction); e2e/actions.spec.ts
asserts the four tabs with their counts and Follow up selected, the hidden panels, the
details with the rule, the Rewrite tab's citation link to the detail, Dismiss and Mark done
inside their tabs with the count going to 0 and the kind's empty line, and the sample's
four actions across the tabs.
