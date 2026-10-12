# Launch marketing strategy

Mihai, 2026-10-12: "think of a really strong marketing strategy. You will run all of it";
"the marketing strategy for launch also, not just for the 2 users". Decision 0070 records
the split: Claude drafts, sends, measures and reports; Mihai owns every account, every post
under his name, every call and every euro. The plan for the first two real users is in
docs/marketing/pilot-users.md; the messages are in docs/marketing/outreach-drafts.md; what
was done and what it returned goes in docs/marketing/log.md.

## The product in one line

SMEsay turns a requirements list into a link. The people who know the work open it, answer
item by item (agree, a different priority, not needed, a question, and why), and the person
who sent it sees where they agree, where they do not, and what to do next. No account for the
experts, a phone-first link, AI that rewrites the list in plain words and drafts the to-do
list from the answers. Free while it is built with the first users; a 7-day trial and the
paid plans after Launch (decision 0068): Pro EUR 49 a month, Team EUR 149, Enterprise from
EUR 6,000 a year (src/lib/plans.ts).

## Who buys it

The landing page already says it (docs/copy/landing.md, Questions): "a product manager, a
project lead, a consultant, an IT manager choosing a tool". For the launch the list is
narrowed to the two people who feel the pain most often and can decide alone:

1. The person at a company of 10 to 250 people who was told to choose or replace a tool or a
   process (an expense tool, a CRM, an onboarding process) and has to get sign-off from the
   people who will live with it. Titles: operations manager, head of operations, IT manager,
   office manager, project lead. They use a spreadsheet by email today (the landing's Compare
   section is written for them).
2. The consultant or implementation partner who runs requirement workshops for such
   companies (ERP, CRM, HR tools) and bills by the day. For them SMEsay replaces the workshop
   with a link and gives them a report they can put in front of the client. One consultant
   brings several clients, which is why they are a channel as well as a buyer.

Product managers at software companies are the loudest community (Product Makers, Mind the
Product), and the easiest to reach, but most of them already have Productboard, Jira or a
Notion template. They are where the first feedback comes from, not where the first payment
comes from. The strategy treats them as the pilot pool and the operations people as the
market.

## What the research says

Founder-led outreach is where the first hundred customers of a bootstrapped B2B product
come from; paid ads at zero do nothing because they amplify a signal that does not exist yet,
and broad content compounds too slowly to matter in the first ninety days
(hub.causo.ai, "How to get your first 100 users in 2026"; saashero.net, "Low-budget B2B SaaS
channels", July 2026; both vendor content, their figures not verified). The same sources agree
on one routine: narrow the target to a few job titles at matching companies, engage with
their posts first, then send short personal messages, about twenty a day, and write
bottom-of-funnel pages ("[competitor] alternative", comparisons) rather than top-of-funnel
articles. Two founder examples they cite: Superhuman onboarded its first users one by one in
30-minute calls; Linear's first hundred came from the founders' own messages.

Launch directories still exist and still send a first wave of visitors, but a June 2026 guide
warns that many "have stopped curating" (startups.fm, "Best free startup directories"), so
each one is checked before the submission. The names that recur across the 2026 lists:
Product Hunt, BetaList, Uneed, Fazier, Indie Hackers, Hacker News (Show HN), SaaSHub, and the
buyer directories G2 and Capterra (pinggy.io, evalyze.ai, screenhance.com, peerpush.com,
ideaproof.io).

Romania: Product Makers is "Romania's Largest Product Community", 12 years old, free, run by
volunteers, "1,700+ on Slack" and "2,780+ on LinkedIn", joined through Slack (#intros); it runs
Product & Design Drinks monthly, a Learning Series every few weeks, a mentoring programme and
the yearly Product Jam conference (productmakers.ro). Whether a member may ask for product
feedback there is not on the site; the organisers are asked first. How to Web 2026 took place
on 6 to 8 October in Bucharest (howtoweb.co); the 2027 edition is the conference to plan for,
with its Spotlight startup competition and Demo Area.

## The plan

Three phases, each with a gate, measured on the admin Overview (E13-2: sign-ups, workspaces,
projects, published, invites, links opened, started, submitted, exports, per week) and on
Plausible once it is on (docs/accounts.md step 11). No ad spend in any phase; the first ad
euro waits for the first paying customer and Mihai's decision.

### Phase A, before Launch (the next two to three weeks)

Goal: two real users running a real validation with five or more respondents each, and
everything a launch needs lying ready.

1. The two pilot users (docs/marketing/pilot-users.md): Mihai's own network first, Product
   Makers second, LinkedIn third. Offer: a year of Pro at no cost, a 30-minute call, their
   name on nothing unless they want it. Claude writes every message; Mihai sends the ones
   under his name; Claude sends the emails from Mihai's Gmail once he approves each batch.
2. The landing page says what the plans are (the Free card still says "without limits";
   docs/accounts.md step 12b, item 1): a pull request of Claude's, on Mihai's go.
3. The launch kit, written by Claude in docs/marketing/outreach-drafts.md: the tagline, the
   60-character and the 260-character descriptions, the "first comment" for Product Hunt
   and the Show HN text (for later), the six screenshots list (taken from the real product by
   Claude with Playwright), the LinkedIn post, the Product Makers post, the email to the
   first users.
4. The lead magnet (docs/plan-steps.md step 4.3): a requirements-list template (CSV and
   xlsx, the Marlow example rewritten for a CRM choice) on a page of its own under
   /templates, which imports into SMEsay in one click. Claude builds it; it is content and
   product at once.
5. Analytics ready: Plausible on (Mihai, step 11), the admin funnel checked against it for one
   week, the getting-started emails switched on at Launch (LIFECYCLE_EMAILS, the lawyer
   confirmed L43).

Gate: two pilots ran a validation, their feedback is in /admin/feedback, the three blocking
fixes are merged, the landing claims are checked (docs/copy/landing.md, "Claims to check
before launch").

### Phase B, Launch week

Day 1: Mihai presses Launch. Day 1 to 2: the LinkedIn post from Mihai's profile and the
company page; the Product Makers post (with the organisers' ok); the email to everyone who
signed in before Launch (email 11's series takes over after). Day 2 to 5: the directory
submissions, one a day, in this order: Uneed, Fazier, BetaList, SaaSHub, Indie Hackers
(a "Show" post), then G2 and Capterra listings (free tier). Hacker News Show HN only if the
product has something a developer wants to read about (the import, the live updates); not a
given. Product Hunt stays in R2 (docs/plan-steps.md, Phase 5), when there are users to ask
for an upvote and a maker network to lean on; a launch there with no followers ranks low and
burns the one shot.

Gate: the week's numbers on the Overview, written in docs/marketing/log.md: visitors,
sign-ups, validations published, respondents. No target is set; the first week sets the
baseline.

### Phase C, the ninety days after

The routine, every working day:
- Outbound: twenty personal messages a day from Mihai's LinkedIn (Claude writes the list of
  names from the titles above and the message for each; Mihai sends, or gives Claude the
  go for the ones that can go by email). About 400 a month. The reply rate is unknown until
  measured; the log keeps it.
- Communities: one useful answer a day in a thread where someone asks how to get a list
  agreed, how to run a requirements workshop, how to choose a tool. Claude finds the threads
  (Product Makers Slack, Indie Hackers, LinkedIn posts); Mihai posts under his name; no link
  unless asked.
- The respondent loop: every link ends with "Powered by SMEsay" (the respondent frame, E7).
  Every respondent is a prospect; the admin funnel's "links opened" to "sign-ups" ratio says
  whether the loop works. If it does, the Done page gets one line for the respondent ("Run
  one yourself") as its own story.

Every week:
- One page of bottom-of-funnel content, by Claude, in the repo as a landing page: "Typeform
  for a requirements sign-off: what changes", "A requirements workshop in a day, without the
  room", "A spreadsheet by email, and what it costs you", and the "[tool] alternative" pages
  for the tools the pilots say they used. Each page ends with the template and "Start free".
- One feedback review (E17-1, /admin/feedback): what three things hurt, fixed in the order the
  users said (docs/plan-steps.md step 4.1).
- One report from Claude in docs/marketing/log.md and in the session: the funnel numbers,
  what was sent, what replied, what the next week does.

Every month:
- The partner track: five implementation consultants in Romania and five in one other market
  (the UK or the Netherlands, decided from the pilots' languages), one email each with the
  consultant's own report as the pitch. A consultant who brings a client gets Team for a
  year.
- The comparison pages checked against the product (decision 0042: nothing described that
  does not exist).

Gate at ninety days: the plan's business target is the first paying customer within six months
of Launch (docs/plan-steps.md, Phase 4). At ninety days the strategy is kept or changed on
the numbers: which channel brought the sign-ups that published a validation.

## What Claude runs alone

Writing every message, post, page and description; building the template page and the
comparison pages; taking the screenshots; reading the funnel and the feedback; keeping the
log; sending email from Mihai's Gmail for each batch he approves (the Gmail connector in the
session); submitting to a directory once Mihai has made the account and handed over the
session, or filling the form for him to press Send; the weekly report.

## What needs Mihai

Accounts: a LinkedIn company page (it needs his personal profile, at least a few days old,
with Alerty as his employer and a verified work email: linkedin.com/help/linkedin/answer/a543852
and a726850), Product Makers Slack, Uneed, Fazier, BetaList, SaaSHub, Indie Hackers, G2 and
Capterra vendor accounts; Plausible (step 11). Decision 0039: Claude never creates an account.
Actions: every post under his name, every call with a pilot, the go on each outreach batch,
the pricing pull request, pressing Launch. Spend: none proposed before the first paying
customer; a Product Makers sponsorship or a How to Web 2027 Demo Area slot are his calls when
they come up, with prices looked up then.

## What is not in the plan

Paid ads (not before a paying customer). A Product Hunt launch (R2). Press (no story yet).
A newsletter (the getting-started series and the closing summaries are the emails; a
newsletter needs an audience first). Auto translation of the respondent side (decision 0055,
R3) even though the partner track may ask for it.

## Measures

| Measure | Where | Read |
|---|---|---|
| Visitors, by page and source | Plausible | weekly |
| Sign-ups, workspaces, published, invites, links opened, started, submitted | /admin Overview, per week | weekly |
| Messages sent, replies, calls, pilots | docs/marketing/log.md | weekly |
| Feedback reports, open and solved | /admin/feedback | weekly |
| Paying customers | by hand until Stripe (R3) | monthly |
