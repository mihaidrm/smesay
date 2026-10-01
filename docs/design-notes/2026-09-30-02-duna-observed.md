# Design note 02: duna.com observed in a browser, 2026-09-30

Viewed at 1568 px wide on Windows Chrome, home page top to bottom. Cookie banner rejected.
This note corrects note 01 where the text-only reading was wrong.

## What Duna actually looks like

Hero. Full-bleed painted landscape (impressionist: peach sky, violet mountains, green meadow,
still water). Small grey pill above the headline with a customer proof point. Headline in two
lines, one sentence below in mid grey, one black pill button. Nav: small asterisk mark and
wordmark left, four links centred, black pill "Schedule a demo" right.

Type. One neutral grotesk for everything. Headlines at regular weight (not light, not bold),
about 56 px, leading around 1.05, slightly tight tracking. Body about 17 px in mid grey. Small
text about 13 px. No serif anywhere. No italics.

Colour. Pure white body background. Two section backgrounds: very light grey (about #F7F7F6)
and warm greige for cards holding product fragments (about #EBE9E4). Text near-black and mid
grey. No brand accent colour on the page: buttons are black, secondary buttons are white pills
with a hairline. Colour arrives only from the paintings and from small coloured icons inside
product fragments. Certification badges in grey.

Layout. Content column about 1120 px. Product sections repeat one pattern: small label pill,
headline left with a pill "Explore" link right, one grey sentence, then two columns: a greige
card containing a floating stack of UI rows with one row raised in white, and a feature list
where one item is expanded on a light background and three are collapsed with a line icon each.
Stats row: three very large light-grey numerals with a short label under each. Three-column
feature row with line icons, separated by vertical hairlines. Testimonial: two-column card,
quote large on light grey, portrait on greige. Trust section on light grey with three badges.
Large empty space between sections, more than a typical SaaS page.

Painted backdrops appear twice: the hero landscape and a blue sky with clouds behind the AI
section. They are what makes the page feel like Duna; everything else is restraint.

## Corrections to note 01

1. Headlines: grotesk, not serif. Drop Instrument Serif. One family for the whole product:
   Geist Sans at regular weight for headlines, tight leading, and for UI and body. Geist Mono
   for numbers.
2. Backgrounds: white body, light grey (#F6F6F4) sections, warm greige (#ECEAE5) cards.
   The warm paper page background from note 01 is dropped.
3. Accent: primary buttons black pills, secondary white pills with a hairline, exactly as Duna.
   Teal (#0E6B63) stays only for links, focus rings and the mark. Data colours unchanged.
4. Imagery: Duna's identity depends on two commissioned paintings. R1 ships without them: the
   hero uses a greige card with a real product fragment, the same device Duna uses in its
   product sections. If the landing page feels flat at First users, commission one painting for
   the hero (freelance illustrator, roughly EUR 300 to 800) rather than generating one.
5. Patterns adopted for the landing page, in this order: label pill plus headline plus
   Explore link; greige card with a raised UI row next to an accordion feature list; stats
   row; hairline three-column row; two-column quote card; trust badges; footer.

## What is not copied

Duna's typeface, paintings, wordmark, copy and section text. The patterns above are common to
current B2B sites (Linear, Vercel, Attio use most of them); the combination and the content are
ours.

## For step 2

Build the styleguide page with the corrected tokens. Check Geist at 56 px regular on a 375 px
phone (expect 36 to 40 px there). Check the greige card against white for a visible but quiet
edge (aim for a 1 px hairline at #E3E1DC plus the fill).
