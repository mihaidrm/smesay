# Design note 104: the accent swatch opens a colour picker, 2026-10-07

Made in the Claude Code cloud session of 2026-10-07 under decisions 0044 and 0056, from
Mihai's screenshot of Settings, Brand, "Accent colour": a text field holding "#1F4F7A", the
line "No accent set. The respondent page uses violet." under it, and a small empty square to
its left.

## What Mihai asked

"accent color in brand needs to open a color picker - users wont know it".

## Where the control appears

Decision 0056: every place with the same control gets the same fix. The accent is set in one
place, the Brand form of Settings (src/app/app/(shell)/settings/brand.tsx). The two other
places that show it, the members' read-only view of the same card (settings/page.tsx) and the
admin workspace page (src/app/admin/workspaces/[id]/page.tsx), display the saved value and
have no control, so they are unchanged. The respondent side reads the saved value (E7).

## What was decided

1. The swatch is a real input of type color, which opens the browser's own picker. Its value
   is always a 7-character lowercase hex and is never empty
   (developer.mozilla.org/docs/Web/HTML/Element/input/color). The browser paints its own box
   and border inside such an input, and the vendor pseudo-elements that restyle them have no
   documentation page the session could cite, so the input is laid over the app's own 40 by
   40 swatch at opacity 0: the swatch under it carries the colour, the hairline, radius 10,
   the hand cursor and the 2 px violet focus ring (Tailwind's has-[:focus-visible] variant,
   tailwindcss.com/docs/hover-focus-and-other-states#styling-based-on-descendants), the input
   over it takes the press and the keyboard. The input has no name, so the form posts the hex
   field only and the server validation of E2-5 (acceptance 4) is unchanged.
2. The hex field stays beside the swatch. The two stay in sync both ways: a valid hex typed
   in the field updates the swatch; a picked colour writes the hex in upper case, as the
   server stores it; an invalid or partial hex leaves the swatch on the last valid colour.
   Helper: pickerValue() and pickedHex() in src/lib/brand-rules.ts, five unit tests in
   src/lib/brand-rules.test.ts.
3. "No accent" stays possible. A colour input cannot be empty, so when the hex field is empty
   the swatch shows the default violet (DEFAULT_ACCENT, violet 600 #6D4CF5, the colour the
   respondent page then uses) and the line under the field says "No accent set. The
   respondent page uses violet.", as before. A tertiary Clear beside the field empties it; it
   stays on screen, disabled while the field is empty, so the row never shifts.
4. The same in light and dark: the swatch shows the saved colour, not the lifted one the
   respondent side draws on dark (design note 57), because the field beside it shows the
   saved hex and the two must read as one value.
5. The screen reader name of the picker is "Pick a colour" (docs/copy/app.md), so the
   existing locator "Accent colour" still names the hex field alone and e2e/settings.spec.ts
   is unchanged; data-testid accent-swatch and accent-line stay, accent-picker and
   accent-clear are new.

## Rejected

- Styling the colour input itself through ::-webkit-color-swatch and ::-moz-color-swatch:
  no documentation page could be cited for them, and the rendering differs by browser.
- A custom picker component (a hue wheel or a palette): the browser's picker is native on
  every platform, needs no new dependency and already knows the system's eyedropper.
- Hiding the hex field behind the picker: a PM pasting a brand colour from a guideline types
  it; both ways of entry stay.

## Not checked here

No Playwright run in this session (the dev server port was held by another session); CI
runs e2e/settings.spec.ts. Mihai checks the picker in Chrome, Safari and Firefox, in both
modes (docs/review-list.md, 2026-10-07).
