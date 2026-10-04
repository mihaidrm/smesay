# Landing page copy

The words on landing page F, design v2 (docs/design-notes/prototype-01/LandingF.dc.html;
built at /landing-page, stories/E12-1), in page order. F is landing page E cut shorter
(design note 33); E's longer copy (the three pictures, the reasons band, the use cases, the
closing) is in this file's history before 2026-10-03 and comes back if a section of E is
built again. The screens inside the page use the Marlow Group example (decision 0005); their
data is listed only where a reader would take it as a claim. When a line here changes, the
board and the page change in the same commit (decision 0017).

## Navigation

SMEsay. How it works. What you get. Compare. Pricing. Questions. Start free.

## Hero

Chip: Live: 5 of 7 experts answering right now

Headline: Send the list as a link. Get back who agrees, and why.

Instead of emailing a spreadsheet around, your experts go through it item by item: agree,
push back with a reason, or ask a question. You get a dashboard, a to-do list written by AI,
and the CSV.

Buttons: Start free. See the sample.

Under the buttons: No account for the experts. Nothing to install. Free while we build it.

Live card (the Marlow sample, src/db/seed/sample.ts): Approving · CL-04. Arriving now.
"Expenses over the policy limit are flagged before they reach the approver." You proposed
Should have. Ioana, sales: Must have. Tom, sales: Must have. Dana, finance: Agree. Lukas,
engineering manager: Agree. To do, written by AI: Decide whether policy flags move to Must have. From
2 answers.

Agreement chip: 63%. Agreement so far. 30 answers from 5 experts.

## Three steps

Title: Three steps. The AI does the dull one.

Start from the spreadsheet you already have. Let the AI make it readable. Send one link.

1. Import the list. xlsx, csv or a pasted list. Columns are matched once and remembered.
   (Fragment: expense-requirements.xlsx)
2. Shape it. AI sorts the list into areas and writes each item in plain words. You choose
   which wording your experts see. (Fragment, design note 53, concept 3: a switch "Your sheet" and "Shaped". Your
   sheet: rows 2 to 5 of the Marlow spreadsheet as imported, "OCR receipt capture via mobile
   (auto-fill amt/date/vendor).", "Multi-allocation of single expense line to 2+ cost
   centres/projects.", "Approval actionable from notification email (no login).", "Policy
   engine: auto-flag out-of-policy claims pre-approval." Shaped: Submitting, "Photograph a
   receipt and the amount, date and merchant are filled in automatically.", "Split one receipt
   across two projects or cost centres."; Approving, "Managers approve or reject from the
   email, without logging in.", "Expenses over the policy limit are flagged before they reach
   the approver." The card opens on Your
   sheet and turns to Shaped once it has been seen.)
3. Send one link. Experts answer without an account or an app. Their answers arrive while
   they work. (Fragment: smesay.app/r/7k2… Copy.) The phone is named in Questions, not here
   (Mihai, 2026-10-04).

## What you get back

Title: What you get back.

Beside it: Not a pile of replies. A picture of where your experts agree, where they do not
and why, and what to decide next.

Results card. Label: See where the list is weak. Title: Every item, every area, as answers
arrive. Line: Pick the numbers you watch, filter by role or by who left a reason, and switch
the chart to the view your meeting needs.
Tiles: Submitted 5 of 7. Agreement 63%. Different priority 7. Unclear 2.
Chips: Role: any. With a reason. + Choose tiles.
View switch (works on the page): Table, Columns, Share. Table: the six items with a stacked bar
and the agreement each, the seed's reader texts cut to one line (CL-01 Photograph a receipt
and the amount, date and merchant are filled in automatically, 80%; CL-02 Split one receipt
across two projects or cost centres, 40%; CL-03 Managers approve or reject from the email,
without logging in, 80%; CL-04 Expenses over the policy limit are flagged before they reach
the approver, 40%;
CL-05 Approved expenses are paid with the next salary run, 100%; CL-06 Employees can request
a cash advance before a trip, 40%). Columns: per area, one bar per kind with its count.
Share: a donut per area with the agreement in the middle and the counts beside it.
Legend: Agree, Different priority, Disagree, Unclear.
Under it: Filter by any field you asked for, such as role, or by who left a reason. Every
chart, count and export follows the same filter.

Label: Know who disagrees, and why. Sales and everyone else split on the policy flags. Did not
agree with Should have: Sales 2 of 2, everyone else 1 of 3. "Sales gets most of the
rejections, and always after the fact." Tom, sales.

Label: Walk into the meeting with the decisions listed. Decide whether policy flags move to
Must have. To do, written by AI · cites 2 answers. Answer two open questions before the link
closes. To do, written by AI · cites 2 answers.

Label: Numbers that hold up. Every number on the dashboard matches the export to the row, so
the result stands up in the steering meeting. Chips: CSV. PDF summary.

## Compare (design note 58)

Title: Why not a spreadsheet, a form or a workshop?

Beside it: Each of them can collect what your experts think. Pick the one you use today and see
what changes.

Switch (works on the page), labelled What you use today: Spreadsheet by email (Spreadsheet
under 640 px, so the three fit a phone), Survey form, Workshop. Column heads on desktop: Today, with a [WAY IN LOWER CASE]. With SMEsay. On a phone
each point stacks with the labels Today and With SMEsay.

- Setting it up.
  - Today, spreadsheet by email: You send the sheet as it is, codes and jargon included.
  - Today, survey form: You rebuild the list in the form builder, one question at a time.
  - Today, workshop: Finding a time that suits everyone, then a room or a call.
  - With SMEsay: Import the sheet you already have. AI sorts it into areas and writes each item in plain words; you choose which wording goes out.
- For your experts.
  - Today, spreadsheet by email: They open an attachment, fill in a column and email it back. On a phone that is hard work.
  - Today, survey form: They meet each item as you typed it, with the words your team uses.
  - Today, workshop: An hour or more of everyone's time, including the items they already agree on.
  - With SMEsay: One link, no account, made for a phone. Answers save as they go, so they can stop and come back.
- The why behind a no.
  - Today, spreadsheet by email: A comment only when someone thinks to write one.
  - Today, survey form: A rating, and a reason only if you added a box for it and they filled it in.
  - Today, workshop: Reasons are said out loud, and the notes keep some of them.
  - With SMEsay: When an expert does not agree with the proposal, the answer asks for a reason before it counts. Unclear asks for their question.
- Who has answered.
  - Today, spreadsheet by email: You track replies in your inbox and chase people one by one.
  - Today, survey form: A count of responses. Knowing who is missing takes a list and a comparison.
  - Today, workshop: Whoever came took part. Whoever could not, missed it.
  - With SMEsay: Invite people by email, see who has submitted, and remind the rest with one button.
- Making sense of it.
  - Today, spreadsheet by email: You copy every reply into one sheet before you can count anything, then sort by role by hand.
  - Today, survey form: One chart per question. Comparing groups means exporting and building it yourself.
  - Today, workshop: The loudest voices tend to set the direction. Quiet and remote experts say less.
  - With SMEsay: Everyone answers on their own, and the answers arrive in one place, counted per item and area. Filter by role to see which group disagrees, and why.
- What you walk out with.
  - Today, spreadsheet by email: A merged sheet to write the decisions up from, after copy and paste steps nobody can check.
  - Today, survey form: A spreadsheet of answers to turn into decisions yourself.
  - Today, workshop: One person's notes, written up afterwards.
  - With SMEsay: A to-do list drafted by AI, each line naming the answers behind it, and numbers that match the CSV to the row.

Under it: It does not replace the meeting. It gives the meeting the answers and the open points
to start from.

## Pricing

Title: Free while we build it with the first users.

Unlimited projects, unlimited experts, the AI included. Paid plans come later and nothing you
build now is lost or locked.

Buttons: Start free. See the sample.

Card: Free. While we build it. EUR 0 / month. Projects, experts and answers without limits.
AI shaping and the to-do list. Live dashboard and CSV export. Your logo and colour on the
link.

## Questions

Title: Questions. Beside it: Something else on your mind? Write to hello@smesay.app.

Each opens in place (a plus that turns to a cross):

- Do my experts need an account? No. They open the link and answer. There is nothing to
  install and nothing to sign up for.
- Does it work on a phone? Yes. The link is made for a phone first and works the same on a
  laptop. Answers save as they go, so an expert can stop and pick up where they left off.
- What does the AI do? It sorts your list into areas, writes each item in plain words, flags
  duplicates and vague items, and drafts the to-do list from the answers, naming the answers
  behind each line. It never answers for your experts. You choose which wording goes out,
  move items between areas, and dismiss what you do not need.
- Can I see who said what? You choose the fields the link asks for, such as name, role or
  department. Answers carry those fields and nothing more about the person; a personal invite
  also carries the email you sent it to, and the name and role when you gave them.
- Can the link carry our logo and colour? Yes. Your experts see your logo and your colour on
  the link.
- What happens to my list and the answers? They stay in your workspace. Export them as CSV
  whenever you like. Archive a project when it is done; delete the workspace and the app
  removes its data within 24 hours.
- How much does it cost? Nothing while we build it with the first users. Paid plans come
  later, and nothing you build now is lost or locked.

## Footer

SMEsay. What the SMEs say. SME: subject matter expert. Privacy · Terms · hello@smesay.app.
The legal links go live with E11; until then they are text.

## Question bubble (E12-5, proposed; waits for Mihai, decision 0046)

Button, bottom right: a speech-bubble icon, named "Ask us a question" for screen readers.
Panel title: Ask us a question
Line: We read every message and reply by email within one working day. (the promise is
Mihai's to confirm)
Fields: Your email; Your question
Under the fields: We use your email only to reply. Privacy (a link to /legal/privacy)
Button: Send; while sending: Sending
Sent: Sent. We will reply to [EMAIL].
Email missing or not an address: Enter your email so we can reply.
Question empty: Write your question.
Question too long: Keep your question to 2000 characters.
Send failed: Your question was not sent. Check your connection and press Send again, or
email [SUPPORT EMAIL].
Too many: You have sent 5 questions in the last hour. Email [SUPPORT EMAIL] instead.
Close button: Close

## Page metadata

Title: SMEsay: send the list as a link. Description: Your experts go through the list item by
item: agree, push back with a reason, or ask a question. You get a dashboard, a to-do list
written by AI, and the CSV.

## Claims to check before launch

The page describes the R1 product as planned, not only what is built on the day it was coded
(2026-10-03: sign-in, workspaces, projects, import, AI shaping). Decision 0042: the copy rule
"do not describe a feature the product does not have" is for the live product; these lines
are checked at the launch gate before the page moves to /, and a line still not true then is
cut. Lines that are claims about the product rather than the Marlow example inside a product
screen:

- The hero chip "Live: 5 of 7 experts answering right now" (outside the live card), "Send
  the list as a link", "go through it item by item", "a dashboard, a to-do list written by
  AI, and the CSV", "No account for the experts. Nothing to install.": the public link (E6),
  the respondent side (E7), the dashboard (E8), the to-do list (E9) and the CSV (E10).
- Step 3 "Send one link" and "Experts answer without an account or an app. Their answers
  arrive while they work": E5 to E7, and E8-7 (live updates) for "arrive while they work".
- What you get back: "as answers arrive" (E8-7, live updates), the tiles a PM picks ("+ Choose tiles") and the filter chips (E8-1), the
  three views Table, Columns and Share (E8-3), the group split and the quoted reason (E8-4 to
  E8-6), the to-do list that cites answers (E9-1), "matches the export to the row" with CSV
  and PDF summary (E10-1, E10-3).
- Questions: no account and nothing to install (E7), made for a phone first (E7-1, built
  2026-10-04) and answers saved as they go (E7-3), what the AI does and what the PM controls
  (E4-2 moves items between areas, E4-3 accepts or rejects the wording, E4-4 dismisses
  flags, E9-1 and E9-2 the to-dos, done or dismissed), only the fields asked for and a
  personal invite's email and optional name and role (E5-1, E6-2), logo and colour on the link (E2-5,
  E7-1), CSV export (E10-1), projects archived (decision 0028) and a workspace's rows and
  files removed within 24 hours (E11-2; backups, E11-4, have no retention period in any story
  yet, a point for the privacy policy, E11-3, and the lawyer), free (decision 0008), hello@smesay.app (the domain,
  docs/accounts.md).
- Compare (design note 58), the With SMEsay column: import the sheet you already have and
  the AI's areas and plain words with the PM choosing the wording (E3, E4-1 to E4-3); one
  link, no account, made for a phone, answers saved as they go (E6-1, E7-1, E7-3); an answer
  that does not agree with the proposal asks for a reason and Unclear for a question
  (E7-2); invite by email, see who has submitted, remind the rest with one button (E6-2,
  E8-2, E6-3); everyone answers on their own, answers in one place counted per item and
  area, filter by role to see which group disagrees and why (E8-1, E8-3 to E8-6); a to-do
  list drafted by AI naming the answers behind each line, numbers that match the CSV to the
  row (E9-1, E10-1). The Today column describes the usual ways, not products (design note
  58); its lines are descriptions a reader can check against their own work, and "tend to"
  marks the one tendency.
- The Free card: "unlimited experts", "Live dashboard and CSV export", "Your logo and colour
  on the link" (the settings, E2-5; the link shows them since E7-1).
- The footer: "Privacy · Terms" are pages E11 writes (every one carries the lawyer markers),
  and hello@smesay.app is a domain the plan buys at the launch gate (docs/accounts.md); until
  then both are text, not links.

True on the day: the upload and shaping lines (E3, E4) and the free lines (decision 0008).

Numbers inside product screens, the Marlow example, not claims: the live card's answers and
the agreement chip (63%, 30 answers from 5 experts), the Shape fragment's rows and the results
card's tiles, items, percentages and counts, "2 of 2", "1 of 3", Tom's reason and the two
to-dos are all the seed's
(src/db/seed/sample.ts: 5 of 7 submitted, 30 answers, 19 agree, 7 different priority, 2
disagree, 2 unclear).
