# 0055 Respondents see sections by number; auto translation on the R3 roadmap, 2026-10-05

Mihai, 2026-10-05, on the About you button:

> "Start with Submitting" seems weird phrasing - because nobody knows what that easy - maybe it should be something like "Section 1 - Submitting" or something like that - make sure you mark everywhere

And in the same session:

> I think we should add a new feature in R3 -- auto translation maybe?

Claude took the wording under decision 0044 and recorded each call in docs/review-list.md.

## Section labels

A button or line that sends the respondent to a chapter names it by its number. The number is
the chapter's position from 1 among the chapters this respondent sees.

- About you's Start: "Start with [FIRST AREA]" became "Start section 1: [FIRST AREA]". With no
  areas, or on the single long page, it stays "Start".
- A chapter's Continue: "Continue to [NEXT AREA]" became "Continue to section [N]: [NEXT
  AREA]". "Continue to Wrap up" stays.
- The Wrap up's gaps box: "Go to [CHAPTER]" became "Go to section [N]: [CHAPTER]". On the single
  long page and for a list with no areas it stays "Go to [CHAPTER]", since nothing there is a
  numbered section.

The separator is a colon, not the dash Mihai typed: WRITING.md allows "periods, commas, colons
or parentheses" and no dashes as punctuation, and `npm run scan:copy` enforces it.

The respondent sees "section" wherever the app spoke to them of chapters, so the button and the
line beside it agree: "All [M] rated in this section." (was "in this chapter"), the server's
"Finish them in the sections, then submit." (was "in the chapters") and the row's name for
screen readers, "Sections" (was "Chapters"). The PM side, the code and the docs keep the word
chapter. These stay as they are: the chapter's heading (the area name), the chapter row's
pills (names with counts), "Item [N] of [M] in [AREA]" on the one-item layout, since none of
them sends the respondent anywhere.

The longer labels must stay readable. Measured in Plus Jakarta Sans bold at 16 px: "Start
section 1: Submitting" is 252 px with its padding and "Continue to section 2: Approving" is
302 px, both inside the 320 px desktop minimum. On a 390 px phone Continue shares the footer
with Back and has about 249 px, and Continue used to cut a label that did not fit with an
ellipsis. Start and Continue now wrap to a second line instead (min-height 48 px, overflow-wrap: break-word;
tailwindcss.com/docs/overflow-wrap).

## R3 auto translation

Auto translation joins Phase 6 (R3) in docs/plan-steps.md: respondents answer in their own
language, the AI translates the items, the help lines and the closing question (on the fly, or
once per language at publish), and the free text (reasons, questions, comments, missing items)
reaches the dashboard in the PM's language with the original beside it. Nothing is built now.
It calls the model on every respondent's text, so its cost is a spend decision for Mihai
(decision 0039) and it belongs with the paid plans.

## Consequences

The strings changed in src/lib/build-copy.ts (ABOUT_YOU_COPY.startSection, was startWith),
src/lib/respondent-rules.ts (continueTo takes the number), src/lib/closing.ts (goTo takes the
number or null), the respondent app and the Wrap up (`numbered`), the styleguide demo,
docs/copy/app.md and errors.md, stories E7-1, E7-4 and E7-7, design note 45, decision 0052's
width line, the prototype-01 respondent generator and its two boards, the PmApp board and the
two prototype checks, the unit test in src/lib/closing.test.ts and the e2e specs
respondent-start, respondent-navigate and build. The screenshots in
docs/design-notes/prototype-01/respondent-built/ show the old labels until the next capture
run (e2e/board-shots.capture.ts).
