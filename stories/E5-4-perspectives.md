# E5-4 Perspective filter: tag items, respondents pick perspectives, see tagged items only

User: a PM whose list mixes Finance items with Sales items
Status: ready
Outcome: each respondent sees the items tagged for the perspectives they picked; untagged
items go to everyone; the dashboard shows coverage per perspective.

## Acceptance criteria
1. Build has a Perspectives card: a list of names (up to 10, 1 to 30 characters each). Each
   item on Shape and Build can carry any number of perspectives; an item with none is shown
   to everyone.
2. With at least one perspective defined, About you asks "Which of these describe you?" with
   checkboxes (multi-select); the respondent sees the union of their perspectives' items plus
   the untagged ones. With none defined, the question is not shown.
3. Progress and the Wrap up count only the items the respondent can see; "[N] of [M]" uses
   their M. The dashboard's tracker filters by perspective and the agreement table shows
   coverage per perspective: how many of the respondents who could see an item answered it
   (E8-2, E8-3).
4. A unit test builds an instrument with three perspectives and proves the visible set for
   four respondent combinations, including none.
5. Playwright: tag two items, pick one perspective as a respondent, see the right count.

## Out of scope
- Routing by respondent field (Role = Finance picks the Finance perspective automatically):
  R2 candidate.

## Open questions
- None.

## Technical notes
Schema v1 has no perspectives: migration 0002 adds item.perspectives text[] (default empty)
and response.perspectives text[]; INTERFACES.md records both. The visible-set function lives in
src/lib/perspectives.ts and is used by E7 and E8.
