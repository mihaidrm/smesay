# 0051 The short respondent pages are a centered card on a desktop, 2026-10-05

Mihai, in a comment on the "Respondent as built" board (About you): "this page looks horible
on desktop - its super narrow as for a mobile, it has offcentered buttons at the bottom of the
page while above it says powerd by etc which should be the lowest thing on the page".

This replaces the 560 px column decided on 2026-10-01 (docs/design-system.md, Respondent
columns) for About you, Done, nothing to rate and the link pages (unknown, not yet open,
closed, inactive, the passcode).

Decision: on a phone nothing moves but "Powered by", which is now the last line, under the
action. From a 576 px column (a container query) the page is a centered card 720 px wide,
48 px from the top: the header, the content with 32 px sides, and on About you a footer with
Start at 320 px, centered, and its hint centered under it. The fields fill the card. "Powered
by" and the privacy link sit under the card as the last thing on the page. Chapters (1000 px)
and the Wrap up (760 px) are unchanged.

Consequences: src/components/respondent/frame.ts holds the frame's classes; about-you.tsx,
link-page.tsx, respondent-header.tsx (a className) and the Done and nothing-to-rate screens in
src/app/r/[token]/respondent-app.tsx use it. docs/design-system.md (Respondent columns) and
stories/E7-1 acceptance 5 amended; the "Respondent as built" board's screenshots retaken.
