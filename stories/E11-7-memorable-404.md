# E11-7 A 404 page people remember

User: anyone who follows a broken or mistyped link
Status: built
Outcome: the 404 still says what happened and how to get back (E11-6), and the visit is worth
it: the page shows how SMEsay works while the visitor is lost.

## Acceptance criteria
1. The 404 keeps E11-6's title, line and "Go to your projects" (to /app), the 404 status and
   the same page for an unknown address and for a refused admin address (E14-1); a "Go back"
   button shows when the browser has a page to go back to.
2. The page is dark whatever the app's mode (the landing hero's navy, aurora and dot grid). A
   big 404 is drawn as a faint outline; with a pointer, a circle of light round the pointer
   shows the lit 404 under it, the three digits drift at three depths against the pointer and
   the robot leans the other way. A line under the 404 says the lights are off and to move the
   pointer.
3. On a touch screen and under reduced motion the 404 is fully lit, nothing moves and the
   pointer line is not shown; the page rendered on the server is that still page.
4. A card titled "The page at this address" (reference 404) carries the respondent's own
   rating row, MoSCoW with Must proposed. A rating is classified as the product classifies it
   (agree, different priority, disagree, unclear); the robot changes pose and says the line
   for that answer (docs/copy/errors.md, The 404 page), read out politely to screen readers.
   Nothing is sent or stored, and the card says so.
5. The digits and the lights are decoration (hidden from screen readers); the title is the
   page's heading; keyboard users reach the rating row, "Go to your projects" and "Go back".
6. Desktop 1440 and phone 390 in one pass: two columns on desktop, one on the phone.
7. Tests: unit, each rating's answer kind, pose and line, and every line in
   docs/copy/errors.md; Playwright, the pointer moves the light, a rating gets its line and
   pose, reduced motion shows the still page (e2e/error-pages.spec.ts).

## Out of scope
- A game with scores (Kualo's Space Invaders, Carwow's car game): more code than a 404 needs,
  and it competes with the way back.
- The respondent link's 404 (E11-6, acceptance 2): it stays in the respondent frame.

## Open questions
- None (decision 0050).

## Technical notes
src/app/not-found.tsx, src/components/not-found/lost-page.tsx and back-button.tsx; the lines
in src/lib/error-pages-copy.ts (NOT_FOUND_SCENE). The light is a CSS mask on the lit copy, its
centre in CSS variables written in requestAnimationFrame, so moving the pointer re-renders
nothing. The robot is the bought pack's (decision 0041), no image drawn for the page. Built
2026-10-05 (design note 92).

Built 2026-10-05 (decision 0050, design note 92):
- Acceptance 1: src/app/not-found.tsx keeps ERROR_PAGE_COPY's title, line and "Go to your
  projects"; e2e/error-pages.spec.ts checks the 404 status, the heading and the link;
  e2e/admin.spec.ts still finds the refused admin address the same as an unknown one.
  BackButton shows with navigation.canGoBack (history.length over 1 without the Navigation
  API); the spec goes back to /sign-in with it.
- Acceptance 2 and 3: src/components/not-found/lost-page.tsx; the spec moves the pointer and
  sees the light move, and under reduced motion and on a touch screen (390 px, hasTouch) sees
  the still page with no float and no pointer line.
- Acceptance 4: robotFor and reactionFor, unit-tested per rating in
  src/lib/error-pages-copy.test.ts; the spec rates Not needed, Should, Unclear and Must and
  reads each line and pose.
- Acceptance 5: the 404 block, the pointer line, the aurora and the lights are aria-hidden;
  the robot's line is aria-live polite with "You rated it [VALUE]." first.
- Acceptance 6: screenshots at 1440 (light and dark app mode) and 390 taken in the session.

