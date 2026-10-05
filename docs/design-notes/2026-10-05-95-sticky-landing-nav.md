# Design note 95: the landing page's nav stays in view, 2026-10-05

Made in the Claude Code cloud session of 2026-10-05, from Mihai's two asks: "I would like the
nav to be sticky so when you scroll down the page you can still see the nav for easy access",
and "when you click on items on the nav, it should not be a snap teleportation of the page, it
should be a smooth scroll to that section".

## What was decided

- The header (the logo, the five section links and Start free) moved out of the hero into its
  own sticky header (src/app/landing-page/sticky-header.tsx) that sits over the hero; the hero
  keeps 76 px under it, so the first screen looks as before.
- At the top of the page the header is transparent. Once the page has scrolled it takes the
  navy at 90 percent with a blur, a hairline and a soft shadow, so the light links read over
  the light sections too.
- A nav link glides to its section: scroll-behavior: smooth on the page's root, only on the
  landing page and only when the visitor has not asked for reduced motion (src/app/globals.css).
  Each section stops 80 px from the top (scroll-mt-20), under the 76 px header.
- On a phone the header shows the logo and Start free, as before, and stays in view.

## Checked

- e2e/landing.spec.ts at 1440 by 900: the header is transparent at the top, Pricing glides (60
  ms after the click the page is on its way and not there), the section stops at 80 px, the
  header is at the top and marked scrolled, and How it works works from down the page.
