# 0042 The copy rule about features applies when the product is live, 2026-10-03

The audit of the landing page (design note 36) found that the page describes the R1 product
as planned (the public link, the respondent instrument, the live dashboard, the CSV export,
the legal pages), which the CLAUDE.md rule "Do not describe a feature the product does not
have" forbids as written. Mihai: "that rule is for when the project is live; now it's just in
progress."

Decision: the rule is about the live product. While the product is being built, the landing
page (and later marketing material) describes R1 as planned. Every line that is not true on
the day is listed in docs/copy/landing.md under "Claims to check before launch" and is
checked at the launch gate before the page moves to /; a line that is still not true then is
cut. Product screens, emails and the app itself keep the rule as it was: they say only what
exists.

Consequences: CLAUDE.md, the open question in stories/E12-1 closed, docs/copy/landing.md and
design note 36 point here. The page stays at /landing-page, linked from nowhere, until Mihai
moves it.
