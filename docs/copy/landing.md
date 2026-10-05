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

Buttons: Start free. Try the sample as a respondent (to /sample, stories/E12-4).

Under the buttons: Your experts need no account and install nothing. It is free while we build it.

Live card (the Marlow sample, src/db/seed/sample.ts): Approving · CL-04. Arriving now.
"Expenses over the policy limit are flagged before they reach the approver." You proposed
Should have. Ioana, sales: Must have. Tom, sales: Must have. Dana, finance: Agree. Lukas,
engineering manager: Agree. To do, written by AI: Decide whether policy flags move to Must have. From
2 answers.

Agreement chip: 63%. Agreement so far. 30 answers from 5 experts.

## Three steps

Title: Three steps. The AI does the dull one.

Start from the spreadsheet you already have. Let the AI make it readable. Send one link.

1. Import the list. Upload an xlsx or csv file, or paste a list. Columns are matched once and remembered.
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

Beside it: Instead of a pile of replies, you get a picture of where your experts agree, where they do not
and why, and what to decide next.

Results card. Label: See where the list is weak. Title: Every item and every area updates as answers
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
under 640 px, so the three fit a phone), Survey form, Workshop. Column heads from 1024 px:
Today, with a [WAY IN LOWER CASE]. With SMEsay. Under 1024 px each point stacks with the
labels Today, with a [WAY IN LOWER CASE] and With SMEsay.

- Setting it up.
  - Today, spreadsheet by email: The sheet goes out in the words your team wrote it in, unless you rewrite it first.
  - Today, survey form: You turn each item into a form question and rewrite the wording yourself where it needs it.
  - Today, workshop: Finding a time that suits everyone, then a room or a call.
  - With SMEsay: Import the sheet you already have. AI sorts it into areas and writes each item in plain words. You choose which wording goes out.
- For your experts.
  - Today, spreadsheet by email: They open an attachment, fill in a column and email it back. On a phone that is slow work.
  - Today, survey form: A link, usually with no account to make. Each item is one more question in a long form.
  - Today, workshop: An hour or more of everyone's time at once, for every item on the list.
  - With SMEsay: A link, no account, made for a phone, in the wording you chose. Answers save as they go, so they can stop and carry on later on the same device, or anywhere with a personal link.
- The reasons.
  - Today, spreadsheet by email: A comment only when someone thinks to write one.
  - Today, survey form: A rating, and a reason only where you set up a follow-up question.
  - Today, workshop: Reasons are said out loud, and the notes keep some of them.
  - With SMEsay: When you show your proposal and an expert does not agree, the answer asks for a reason before it counts. Unclear asks for their question.
- Who has answered.
  - Today, spreadsheet by email: You track replies in your inbox and chase the missing ones yourself.
  - Today, survey form: Unless the form asks for a name or the tool sends the invitations, you cannot tell who has answered.
  - Today, workshop: Whoever came took part. Whoever could not, missed it.
  - With SMEsay: Send personal links by email and see who has submitted. Remind the others with one button, at most once every three days.
- Reading the answers.
  - Today, spreadsheet by email: You copy every reply into one sheet before you can count anything. Splitting by role is done by hand.
  - Today, survey form: A chart per question. Whether the experts back your proposal, and why not, is yours to work out.
  - Today, workshop: The loudest voices tend to set the direction. Quiet and remote experts tend to say less.
  - With SMEsay: Everyone answers on their own. The answers arrive in one place, counted per item and area. Ask role or department as a list to pick from, and see which group disagrees and why, once three or more in a group have answered.
- The result.
  - Today, spreadsheet by email: A merged sheet to write the decisions up from. Checking it against the replies means going back through the emails.
  - Today, survey form: A file of answers to turn into decisions yourself.
  - Today, workshop: Notes or a board from the session, written up afterwards.
  - With SMEsay: A to-do list drafted by AI, each line naming the answers behind it. Numbers that match the CSV to the row.

Under it: It does not replace the meeting where you decide. It gives that meeting the answers and the open points to start from.

## Pricing

Title: Free while we build it with the first users.

Projects and experts are unlimited, and the AI is included. Paid plans come later and nothing you
build now is lost or locked.

Buttons: Start free. Try the sample as a respondent (to /sample, stories/E12-4).

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
- How much does it cost? It costs nothing while we build it with the first users. Paid plans come
  later, and nothing you build now is lost or locked.

## Footer

SMEsay. What the SMEs say. SME: subject matter expert. Privacy · Terms · DPA · Subprocessors ·
hello@smesay.app. The four legal words link to /legal/privacy, /legal/terms, /legal/dpa and
/legal/subprocessors (E11-3); the address stays text until the domain is bought.

## Question bubble (E12-5, decided 2026-10-05, decision 0049)

Button, bottom right: a speech-bubble icon, named "Ask us a question" for screen readers.
Panel title: Ask us a question
Line: We read every message and reply by email within one working day.
Fields: Your email; Your question
Under the fields: We use your email only to reply. Privacy (a link to /legal/privacy)
Button: Send; while sending: Sending
Sent: Sent. We will reply to [EMAIL].
Email missing or not an address: Enter your email so we can reply.
Question empty: Write your question.
Question too long: Keep your question to 2,000 characters.
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
  AI, and the CSV", "Your experts need no account and install nothing.": the public link (E6),
  the respondent side (E7), the dashboard (E8), the to-do list (E9) and the CSV (E10).
- Step 3 "Send one link" and "Experts answer without an account or an app. Their answers
  arrive while they work": E5 to E7, and E8-7 (live updates, built 2026-10-04) for "arrive
  while they work".
- What you get back, "Know who disagrees, and why": its bars compare Sales, 2 answers, with
  everyone else. Decision 0031 does not compare a group with fewer than 3 answers, and the
  conflict view (E8-6, built 2026-10-04) compares the field's groups, not one group with
  everyone else; at the launch gate the card's example gets groups of 3 or more, or the card
  is cut (docs/review-list.md).
- What you get back: "as answers arrive" (E8-7, live updates, built 2026-10-04), the tiles a PM picks ("+ Choose tiles") and the filter chips (E8-1), the
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
- Compare (design note 58), the With SMEsay column, each with its condition: import the
  sheet you already have, the AI's areas and plain words, the PM choosing the wording (E3,
  E4-1 to E4-3); a link, no account, made for a phone, in the wording the PM chose (E6-1,
  E7-1; E4-3 acceptance 2: a rewrite reaches the respondent only where the PM accepted it),
  answers saved as they go, carrying on later on the same device or anywhere with a
  personal link (E7-3 acceptance 2); a reason asked before the answer counts when the PM
  shows the proposal and the expert does not agree, and a question for Unclear under every
  method (E5-2 show proposed, E7-2; a rate-blind instrument asks no reason for a rating);
  personal links by email, who has submitted, a reminder button for the others (E6-2, E6-3,
  E8-2; personal links only, at most one reminder per person every three days); everyone
  answering on their own, the answers in one place counted per item and area, the group
  split when role or department is asked as a list to pick from (E8-1, E8-3 to E8-6;
  decision 0043 makes Role a text field by default, so the PM changes it to a list; a text
  field filters by "contains" and does not split groups; a group with fewer than 3
  answers on an item is drawn but not compared, E8-6 acceptance 3); a to-do list drafted by AI naming the answers behind each line (E9-1);
  numbers that match the CSV to the row (E10-1).
- Compare, the Today column: the usual ways as most people use them, not products (design
  note 58). These are comparisons with other ways of working and are checked at the launch
  gate with the rest of this list. Who checks them is open: E11-3's lawyer reads the four
  legal pages only, and adding this section is Mihai's decision (docs/review-list.md). Each
  line must stay true for the common tools: a survey form line that a widely used tool
  contradicts is rewritten or cut (the first audit of this section, 2026-10-04, rewrote
  three for that reason and its re-audit two more), and no line says what "most" tools do.
  "Tend to" marks the two tendencies in the workshop column.
- The Free card: "unlimited experts", "Live dashboard and CSV export", "Your logo and colour
  on the link" (the settings, E2-5; the link shows them since E7-1).
- The footer: the four legal pages exist since E11-3 and carry the lawyer's markers until the
  lawyer confirms them; hello@smesay.app is a domain the plan buys at the launch gate
  (docs/accounts.md), so it stays text until then.

True on the day: the upload and shaping lines (E3, E4) and the free lines (decision 0008).

Numbers inside product screens, the Marlow example, not claims: the live card's answers and
the agreement chip (63%, 30 answers from 5 experts), the Shape fragment's rows and the results
card's tiles, items, percentages and counts, "2 of 2", "1 of 3", Tom's reason and the two
to-dos are all the seed's
(src/db/seed/sample.ts: 5 of 7 submitted, 30 answers, 19 agree, 7 different priority, 2
disagree, 2 unclear).
