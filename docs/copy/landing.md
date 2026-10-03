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

## Claims to check before launch

- "Data hosted in the EU": true only once the launch-gate hosting is in fra1 or equivalent
  (decision 0006). Keep the line, confirm the region at the gate.
- "Export or delete everything yourself, at any time": E10 and E11 deliver this. Do not launch
  the page before they ship.
- "5 of 7", "72%", "14 of 40", "31 of 40", "81%", "64%", "92%": Marlow example numbers inside
  product screens (the seed, stories/E1-4), not claims about the product.
- The legal links point to pages E11 writes; every one carries the lawyer markers.

## Changed in this pass, 2026-10-01

- The disagreement register used the MoSCoW word for the fourth priority where the respondent
  card says "Not needed" (decision 0018). The register, the PM app (item detail, action text,
  the MoSCoW hint) and the respondent wrap-up now all say Not needed. The MoSCoW word is in
  docs/retired-terms.md, so the hook catches it if it comes back.
