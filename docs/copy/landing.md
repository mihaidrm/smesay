# Landing page copy

The words on landing page F, design v2 (docs/design-notes/prototype-01/LandingF.dc.html;
built at /landing-page, stories/E12-1), in page order. F is landing page E cut shorter
(design note 33); E's longer copy (the three pictures, the reasons band, the use cases, the
closing) is in this file's history before 2026-10-03 and comes back if a section of E is
built again. The screens inside the page use the Marlow Group example (decision 0005); their
data is listed only where a reader would take it as a claim. When a line here changes, the
board and the page change in the same commit (decision 0017).

## Navigation

SMEsay. How it works. What you get. Pricing. Start free.

## Hero

Chip: Live: 5 of 7 experts answering right now

Headline: Send the list as a link. Get back who agrees, and why.

Instead of emailing a spreadsheet around, your experts go through it item by item: agree,
push back with a reason, or ask a question. You get a dashboard, a to-do list written by AI,
and the CSV.

Buttons: Start free. See the sample.

Under the buttons: No account for the experts. Nothing to install. Free while we build it.

Live card (the Marlow example): Approving · CL-04. Arriving now. "Expenses over the policy
limit are flagged before they reach the approver." You proposed Should have. Ana, finance:
Must have. Dan, sales: Agree. Radu, operations: Must have. Ioana, HR: Agree. To do, written by
AI: Decide whether policy flags move to Must have. From 2 answers.

Agreement chip: 72%. Agreement so far. 14 of 40 items rated.

## Three steps

Title: Three steps. The AI does the dull one.

Upload the spreadsheet you already have. Shaping groups it into areas and writes each item in
plain words. Send one link.

1. Import the list. xlsx, csv or a pasted list. Columns are matched once and remembered.
   (Fragment: expense-requirements.xlsx)
2. Shape it. AI groups items into areas, writes a reader version of each, and flags
   duplicates and vague ones. You keep or change every line. (Fragment: CL-01 Photograph a
   receipt and the amount fills in, Submitting. CL-07 Per diem rates apply by country,
   Ambiguity. CL-09 Mileage is paid at the state rate, Duplicate of CL-02.)
3. Send one link. Experts open it on a phone, no account. Answers arrive live; the dashboard,
   the to-do list and the CSV are yours. (Fragment: smesay.app/r/7k2… Copy.)

## What you get back

Title: What you get back.

Agreement by area. Live · 31 of 40 answered. Submitting 81%. Approving 64%. Paying 92%.
Legend: Agree, Pushed back, Unclear.

To do, written by AI. Decide whether policy flags move to Must have. Cites 2 answers · Ana,
Radu.

Where groups disagree. Finance and sales split on cash advances.

Every number to the row. Export CSV.

## Pricing

Title: Free while we build it with the first users.

Unlimited projects, unlimited experts, the AI included. Paid plans come later and nothing you
build now is lost or locked.

Buttons: Start free. See the sample.

Card: Free. While we build it. EUR 0 / month. Projects, experts and answers without limits.
AI shaping and the to-do list. Live dashboard and CSV export. Your logo and colour on the
link.

## Footer

SMEsay. What the SMEs say. SME: subject matter expert. Privacy · Terms · hello@smesay.app.
The legal links go live with E11; until then they are text.

## Page metadata

Title: SMEsay: send the list as a link. Description: Your experts go through the list item by
item: agree, push back with a reason, or ask a question. You get a dashboard, a to-do list
written by AI, and the CSV.

## Claims to check before launch

The page describes the R1 product as planned, not only what is built on the day it was coded
(2026-10-03: sign-in, workspaces, projects, import, AI shaping). That conflicts with the copy
rule "do not describe a feature the product does not have"; it is recorded in stories/E12-1
as an open question for Mihai, and the page is linked from nowhere until he answers. Lines
that are claims about the product rather than the Marlow example inside a product screen:

- The hero chip "Live: 5 of 7 experts answering right now" (outside the live card), "Send
  the list as a link", "go through it item by item", "a dashboard, a to-do list written by
  AI, and the CSV", "No account for the experts. Nothing to install.": the public link (E7),
  the respondent instrument (E5), the dashboard and the CSV (E6, E10).
- Step 3 "Send one link" and "Experts open it on a phone, no account. Answers arrive live;
  the dashboard, the to-do list and the CSV are yours": E5 to E7, E10.
- "Every number to the row" with the Export CSV pill: E10.
- The Free card: "unlimited experts", "Live dashboard and CSV export", "Your logo and colour
  on the link" (the logo and colour settings exist, E2-5; the link does not until E7).
- The footer: "Privacy · Terms" are pages E11 writes (every one carries the lawyer markers),
  and hello@smesay.app is a domain the plan buys at the launch gate (docs/accounts.md); until
  then both are text, not links.

True on the day: the upload and shaping lines (E3, E4) and the free lines (decision 0008).

Numbers inside product screens, the Marlow example (the seed, stories/E1-4), not claims:
"72%", "14 of 40" (the agreement chip), "31 of 40", "81%", "64%", "92%" (agreement by area),
the live card's answers, "Cites 2 answers".
