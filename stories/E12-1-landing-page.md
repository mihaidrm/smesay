# E12-1 Landing page E as real code, desktop and phone

User: a visitor who has never heard of the product
Status: ready
Outcome: the landing page from the canvas, built as the product's own pages, scoring over 90
on Lighthouse performance and accessibility on mobile.

## Acceptance criteria
1. / renders landing page E (docs/design-notes/prototype-01/LandingE.dc.html and
   LandingEPhone.dc.html; copy from docs/copy/landing.md): nav, hero with the answers-arriving
   panel (9 second cycle, the 2026-10-01 canvas comment), the three pictures, how it works,
   what you get back, the reasons band, use cases, pricing (free line, decision 0008), closing,
   footer with SME expanded once. Desktop 1440 and phone 390 (decision 0015).
2. Motion as designed (design notes 05 and 08): reveal on scroll once, the hero loop, the
   auto-advancing steps with click to select; everything off under `prefers-reduced-motion`.
3. Lighthouse mobile: performance and accessibility over 90, measured with the Lighthouse CLI
   in CI on the built page and the numbers recorded in the story on acceptance.
4. Every product fragment on the page is a real component from the app rendered with the
   Marlow seed data, not a drawing (decision 0004, nothing hand-drawn); Geist self-hosted.
5. Buttons: "Start free" to the sign-in page; "Try the sample as a respondent" to E12-4's
   sample instrument. Placeholders (customer logos, quotes) stay out as the copy file says.
6. Playwright: the home page loads with the headline and no horizontal scroll at 390.

## Out of scope
- Rewriting the copy after first users: Phase 4.

## Open questions
- None. Primary actions and selection stay ink (decision 0031).

## Technical notes
src/app/(marketing)/page.tsx with sections as components; the fragments import the dashboard
and respondent components with a static data prop. Lighthouse through `lhci` or `lighthouse`
CLI after the research check.
