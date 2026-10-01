# Landing page copy

The words on landing page E (docs/design-notes/prototype-01/LandingE.dc.html and
LandingEPhone.dc.html), in page order, so they can be read as one text and scanned. The
screens inside the page use the Marlow Group example (decision 0005); their data is listed
only where a reader would take it as a claim. When a line here changes, the boards change in
the same commit (decision 0017).

## Navigation

SMEsay. How it works. What you get. Pricing. Try the sample. Start free.

## Hero

Label: Requirement validation with your subject matter experts

Headline: Send the list as a link. Get back who agrees, and why.

Instead of emailing a spreadsheet around, your experts go through it item by item: agree,
disagree with a reason, or ask a question. You get reasons, not votes, and a to-do list written
from them.

Buttons: Start free. Try the sample as a respondent.

Hero panel labels: What you asked them about. You proposed. What they answered, arriving now.
5 of 7 experts. To do, written by AI. From 2 answers.

## Three pictures

Title: What happens, in three pictures

A spreadsheet goes in. Reasons and a to-do list come out.

1. You have a list. The spreadsheet you already have, with all its mess. Upload it as it is.
2. They answer, and say why. Agree, change the priority, disagree or ask. Every push-back needs
   a reason.
3. You get a to-do list and a record. To-dos written from the answers, each citing them. Who
   signed off, and when.

## How it works

Title: How it works. Three steps. Each one ends with something you can show.

01 Upload and tidy. Upload the spreadsheet you already have. Tell it which column is the
requirement and which is the priority. It groups the items into areas and rewrites each one in
plain words. The original wording is always kept, and nothing changes until you press Accept.
You get: A list people can read.

02 Send one link. Publish, then share one link. Your experts open it and go through the list. A
reason is required for every disagreement, so you never get a bare no. At the end they confirm
their answers. No account needed; it works on a phone; they can stop and come back.
You get: Signed-off answers.

03 Read and decide. See the answers as they arrive. Agreement per item, every push-back with its
reason, every open question, every missing item. AI turns them into a short list of actions and
names the answers behind each one. Export to a spreadsheet or a PDF.
You get: Decisions with sources.

## What you get back

Title: What you get back. Every view below is live while the link is open, and every number
matches the export.

Agreement by area. 5 of 7 answered. Legend: Agree, Pushed back, Unclear.

Where groups disagree, by role. Share of each group that agreed. Compare by any field you asked
for.

How sure they were. Confidence, 1 to 5, given at sign-off. Average 3.8. Low confidence on a
high-agreement item is worth a second look.

Disagreement register. 8 push-backs, 2 questions, 1 missing item. Sortable by item or by
person. Rows read "[Name], [Role] says [Priority]: [reason]" or "marked it Unclear: [question]".
The priority a respondent picks is Must have, Should have, Could have or Not needed, the same
words they see on the card.

Sign-off record. Who confirmed, when, and how confident. Goes into the PDF for the steering
deck.

To-do list, written by AI. 4 actions. An action with no answers behind it is never shown.

Export everything: CSV of answers. CSV of items with totals. JSON of the project. PDF summary
for the deck.

## Reasons band

A vote tells you what. A reason tells you why.

Nobody can disagree without saying why, and nobody can mark an item unclear without asking the
question. These are the lines you read first.

(Then the Marlow answers scroll: each one a reason, its status pill and "[Role], on [item]".)

## Use cases

Title: One mechanic, five jobs. A list of items, each answered with a reason. The features on
the right are the ones each job leans on.

- Requirement validation for a client engagement. The consultancy sends the link to the
  client's experts and puts the sign-off record in the steering deck. Personal invites,
  Passcode, Sign-off record, PDF summary.
- Roadmap or backlog check with internal experts. Product shows the proposed priority and finds
  out who disagrees before the budget is committed. Public link, Proposed priority shown, Live
  dashboard.
- Vendor or platform shortlist criteria. IT and the business departments rate the same
  criteria; the dashboard shows where they split. Perspectives, Compare by department, CSV
  export.
- Policy or process review. Each clause is an item. Staff keep, change or drop it, with a
  reason every time. Keep, change, drop; Disagree with a reason; Disagreement register.
- Catalogue or pricing changes reviewed by partners. Partners rate blind so the proposal does
  not anchor them, and say how sure they are. Rate-blind mode, Confidence at sign-off,
  Missing-item form.

## Pricing

Title: Pricing. Free. While we build it with the first users.

Every feature on this page, for as many projects and responses as you need. Paid plans come
later, and nothing you build now is lost or locked.

Data hosted in the EU. Export or delete everything yourself, at any time.

Button: Start free.

## Closing

Try it on the list you were about to email round. Upload it, send the link to three people, and
see what comes back.

Buttons: Start free. Try the sample first.

## Footer

SMEsay. SME: subject matter expert. The people who know.

Product: How it works, What you get, Pricing. Try it: Sample instrument, Sample project. Legal:
Privacy policy, Terms, DPA and subprocessors. © Alerty S.R.L. 2026.

## Claims to check before launch

- "Data hosted in the EU": true only once the launch-gate hosting is in fra1 or equivalent
  (decision 0006). Keep the line, confirm the region at the gate.
- "Export or delete everything yourself, at any time": E10 and E11 deliver this. Do not launch
  the page before they ship.
- "Average 3.8", "5 of 7", "8 push-backs": Marlow example numbers inside product screens, not
  claims about the product. They match the PM app board and the respondent board.
- The legal links point to pages E11 writes; every one carries the lawyer markers.

## Changed in this pass, 2026-10-01

- The disagreement register said "Won't have" where the respondent card says "Not needed"
  (decision 0018). The register, the PM app (item detail, action text, the MoSCoW hint) and the
  respondent wrap-up now all say Not needed. "Won't have" no longer appears on any board.
