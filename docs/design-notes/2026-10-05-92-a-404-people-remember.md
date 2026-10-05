# Design note 92: a 404 people remember, 2026-10-05

Made in the Claude Code cloud session of 2026-10-05 for stories/E11-7, under decisions 0044
and 0050.

## Well-known 404s

Read on 2026-10-05 (sources at the end), four patterns recur:
- The brand's character reacts to the visitor: GitHub's Octocat scene moves in layers with
  the mouse; Pixar shows Sadness from Inside Out; Lego a minifigure with a pun.
- A game: Kualo's Space Invaders clone (a discount at 1,000 points), Carwow's 8 bit car game.
- Something new on each visit: IMDb shows a random film quote.
- A plain way back, sometimes a search box.

## What was decided

- The scene: the page is dark and the pointer is a torch. A big 404 is a faint outline; the
  light round the pointer shows the lit 404 in the landing's gradient (violet, coral, amber).
  The three digits drift at three depths and the robot leans the other way (GitHub's layered
  parallax, on SMEsay's own night and robot). A mono line says the lights are off.
- The twist that is SMEsay's own: the missing page is an item card, rated with the
  respondent's real rating row (MoSCoW, Must proposed). The answer goes through the product's
  own classify(), and the robot answers with a pose and a line per kind: it waves at Must,
  has an idea at Should or Could, shows the numbers at Not needed, reads at Unclear. A
  visitor who came from a broken link learns the core of the product in one click.
- E11-6 stays: the title, the line, "Go to your projects", the 404 status, the same page for a
  refused admin address. "Go back" is added when the browser has a page to go back to.
- Still on a touch screen and under reduced motion: fully lit, nothing moves, no torch line.
- No new image and no new package: the robot is the bought pack (decision 0041), the 404 is
  type, the light a CSS mask.

## Components added

LostPage (src/components/not-found/lost-page.tsx), the scene: the faint and the lit 404, the
robot, the card with the rating row and the robot's line. BackButton (src/components/not-found/
back-button.tsx), "Go back" when the browser has a page to go back to. Both live only on the
404; neither is in docs/design-system.md, as the scene is a one-off.

## After the review

The reviewer's findings of 2026-10-05, fixed the same day: the robot no longer floats on a
touch screen; the lit digits are no longer cut at their right edge (a clipped background stops
at the glyph's box, so the box is padded); the outline became a faint fill, as the stroke drew
the overlaps inside each 4; the pointer line is #C9C4E0 and hidden from screen readers; the
robot's line starts with "You rated it [VALUE]." for screen readers; the light follows a
scroll; the scene follows a change of reduced motion while open; "Go back" reads the
Navigation API's canGoBack where it exists; the card has a stronger edge in dark mode; the
tests check each line and pose, that moving the pointer moves the light, the touch screen and
Go back.

## Left out

- A game with a score: a 404's job is the way back, and a game is a page of its own to keep.
- A random line per visit (IMDb): the four reactions already vary the page by what the
  visitor does.
- A search box: there is nothing public to search before the launch gate.

## Sources

- GitHub's layered mouse parallax, Pixar, Mailchimp and Kualo: ionos.com/digitalguide/
  websites/website-creation/cool-and-creative-404-pages-tips-and-examples
- Carwow's car game, Kualo's Space Invaders, Lego, Blizzard, Amazon, IMDb's random quote:
  digitalsilk.com/web-design/web-trends/best-404-pages
