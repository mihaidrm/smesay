# 107 The confidence slider on the Wrap up, 2026-10-07

Mihai, 2026-10-07, with a screenshot of the Wrap up's "How confident are you in these
answers?" row of five pills 1 to 5 with Guessing and Certain under the ends: "Maybe instead of
5 pills, make a slider on a bar and the user can drag it and the text below it changes
depending of where it stops, and instead of numbers he can see text saying extremely
confident, somewhat, moderately etc you figure it, 5 levels".

## What was decided

- The five pills become one native range input, `<input type="range" min="1" max="5"
  step="1">` (developer.mozilla.org/docs/Web/HTML/Element/input/range), that fills the row.
  The stored value stays the integer 1 to 5 (INTERFACES.md); the dashboard, the PDF
  histogram and the CSV keep the numbers and are not touched.
- The word of the value shows under the slider, centred, 16 px 600, and changes as the thumb
  moves. The small Guessing and Certain captions stay at the two ends, as before.
- The five words, 1 to 5: Guessing, Not very sure, Fairly sure, Confident, Certain. 1 and 5
  keep the two captions that were already under the pills, so the scale reads the same at its
  ends on the board, the dashboard's legend and the slider. The three middle words were chosen
  so each is one or two short words a respondent reads on a phone in a glance, and so they
  climb in one direction: unsure, mostly sure, sure. "Extremely confident" and "moderately
  confident" (Mihai's examples) were not taken because the five would then share the word
  "confident" and differ only by their adverb, which reads slower on a 390 px screen; the
  list is Claude's reading and is on docs/review-list.md for Mihai to overturn.
- Colour: the thumb and the filled part of the track take the PM's accent through the CSS
  accent-color property (developer.mozilla.org/docs/Web/CSS/accent-color: it applies to
  range inputs), with the same custom properties the pills used (accentVars in
  src/lib/brand-rules.ts: the accent on light, the lifted one on dark). The utility is
  Tailwind's accent-color class with a custom property (tailwindcss.com/docs/accent-color).
- Size: the input is 48 px tall, the respondent tap target (docs/design-system.md); the
  browser centres the track in that box.
- Unanswered: a range input always has a value, so the form's confidence stays null until the
  respondent picks. The input renders at 3 meanwhile, marked `data-unset`, its thumb at 40
  percent (an opacity on the ::-webkit-slider-thumb and ::-moz-range-thumb pseudo-elements,
  developer.mozilla.org/docs/Web/CSS/::-webkit-slider-thumb and
  developer.mozilla.org/docs/Web/CSS/::-moz-range-thumb; that opacity applies to them with
  the native appearance kept is Claude's reading, unverified against a documentation line,
  so Mihai checks it on his devices), and the line under it reads "Drag to say how sure you
  are" in muted ink. Submit stays off until a value is picked (the existing `needed` logic).
- What picks a value: a change event (a drag, a tap on the track, and the keys the browser
  handles on a range input: the arrows, Home, End, Page Up and Page Down, per the MDN page
  above); a tap or click that does not move the thumb (pointerup on the input while the
  confidence is null); and Enter or Space while it has the focus. So a respondent who agrees
  with the middle can pick it without moving it.
- Screen readers: aria-valuetext carries the word of the value
  (developer.mozilla.org/docs/Web/Accessibility/ARIA/Attributes/aria-valuetext),
  aria-labelledby the question, aria-describedby the line under the slider (the prompt until
  a pick, then the word). While nothing is picked the valuetext names the word under the
  resting thumb and the description carries the prompt; docs/review-list.md records it.
- Motion: no transition on the thumb beyond the browser's own, so prefers-reduced-motion has
  nothing to stop.
- Copy changed: the server's refusal and the line under Submit when only the confidence is
  left, "Move the slider to say how sure you are before you submit."; the Closing card's line,
  "Respondents always answer it, on a slider from Guessing to Certain. The dashboard shows the
  spread as 1 to 5."; the receipt email, "Your confidence: Confident (4 of 5)." (the word with
  the number). docs/copy/app.md, docs/copy/errors.md and docs/copy/emails.md say the same.
- The design system gets a Slider line under Components (docs/design-system.md).

## Where it lives

- src/lib/closing.ts: CONFIDENCE_WORDS, confidenceWord(n), CONFIDENCE_UNSET, the prompt.
- src/components/respondent/wrap-up.tsx: the input, data-testid="confidence-slider" in the
  block data-testid="wrap-up-confidence", the word line data-testid="confidence-word".
- src/lib/respondent-rules.ts RESPONDENT_ERRORS.confidence; src/lib/mail/templates/receipt.ts
  and the regenerated sample docs/design-notes/prototype-01/email-receipt.html.
- Tests: src/lib/closing.test.ts (the word mapping, 2 tests); the Playwright specs move the
  slider with the keyboard (playwright.dev/docs/api/class-locator#locator-press): ArrowRight
  from the unset 3 for 4, End for 5, Enter for the current value, Home for 1, ArrowLeft one
  step down from a stored value (e2e/respondent-submit.spec.ts, which also reads "Confident"
  under it; e2e/actions.spec.ts; e2e/respondent-a11y.spec.ts;
  e2e/respondent-after-submit.spec.ts; e2e/sample-instrument.spec.ts;
  e2e/board-shots.capture.ts).

## The respondent board

docs/design-notes/prototype-01/respondent-generator.py draws the same slider in place of the
five pills (the word under it, Guessing and Certain at the ends, the whole input at 40
percent until moved since an inline style cannot reach the thumb pseudo-element), and
respondent-sim.js checks the resting value, the prompt, and the word after a move. The board
HTML (Respondent.dc.html, RespondentDesktop.dc.html) is not regenerated here: the generator
needs Python 3.12 and this session has 3.11. Mihai runs `python3.13 respondent-generator.py`
on his PC, then `node respondent-sim.js`. The simulator's 50 checks passed in this session
against the generator's JS lifted from the Python source into a stand-in page; against the
committed HTML they fail until the regeneration.

## Not done

- No transition, no custom track drawing: the browser's own range control, so it looks a
  little different per browser. A drawn track in the tokens is a later step if Mihai wants
  the same look everywhere.
- No Playwright drag: the specs use the keyboard, which the browser documents and which is
  deterministic. Mihai tests the drag on real devices.
