# 0041 Design v2: alive, in dark and light, with bought assets where needed, 2026-10-03

Status: decided by Mihai on 2026-10-03 ("it feels very bland and soulless, i want something
with more life in it"; "you make dark and light mode"; "Color scheme is up to you but it has
to feel good and alive"; placeholders for what Claude cannot draw, a shopping list under
EUR 60 that Mihai buys), with Dripify's feel as the reference and no copying of its screens.

1. The product gets a second design, v2, on every side: landing page, PM app, respondent side
   and the admin area. It replaces v1 (design notes 01 to 10, decision 0001's teal and ink)
   once Mihai approves the boards; until then v1 stays on main.
2. Two modes everywhere. The PM app and the admin area follow the system setting with a
   toggle in the sidebar. The landing page has a dark hero and pricing with light sections
   between. The respondent side follows the phone's setting; the PM's accent still marks the
   selected answer, the active chapter and the progress bar (decision 0016), lifted two steps
   on dark. This replaces "No dark mode on the respondent side" in the design system.
3. The palette is Claude's: a lavender-white or deep navy ground, one violet accent, coral,
   mint and sun as the second colours, status colours unchanged on light and lifted on dark,
   one aurora gradient for the hero and one for the primary button. Every text pair is
   computed against 4.5 to 1 and recorded in docs/design-system.md. Plus Jakarta Sans (SIL
   Open Font License, Google Fonts, self-hosted through next/font) for headings and body;
   Geist Mono stays for references and counts.
4. Illustrations, a mascot and icons beyond Lucide are allowed when they are bought or come
   under a licence that permits commercial use. This amends CLAUDE.md's "Nothing hand-drawn
   or illustrated": Claude draws nothing by hand, places what is bought, and stands in a
   placeholder with the same frame until the asset arrives. Claude searches and lists; Mihai
   pays and hands the files over. The list is docs/assets.md; the budget is EUR 60 for all
   of it.
5. Order of work: the boards first (Brand07, LandingF, PmAppV2, RespondentV2 on the canvas,
   this day), Mihai's review, then the tokens and the six built screens in one pull request
   per side, then every later story is built on v2.

Consequences: design note 33, docs/design-system.md v2, docs/assets.md, CLAUDE.md, the four
boards and the canvas index, docs/context.md, all on 2026-10-03. The code changes nothing
until the boards are approved.
