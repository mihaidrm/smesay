# Design note 39: onboarding and tutorial with the robot (epic E15), 2026-10-03

Made in the Claude Code cloud session of 2026-10-03 from Mihai's message: "add an epic for
Onboarding / Tutorial where we gonna use robot to teach users; make sure it's specced
correctly, do research on other onboarding practices." Stories: stories/E15-1 to E15-5.
Copy: docs/copy/guide.md. Shape: GuideState in INTERFACES.md.

## What the research says

Each line is one source and one finding; the pages were read on 2026-10-03.

- Nielsen Norman Group, "Mobile Tutorials: Wasting Precious Time and Effort", Alita
  Kendrick, 8 March 2020 (nngroup.com/articles/mobile-tutorials). A between-subject test
  with 70 participants on four iPhone apps: the half who read a tutorial rated the tasks
  harder (4.92 against 5.49 on the ease scale, p = 0.047) and were no more successful (91
  percent against 94 percent) or faster. Quote: "tutorials can make apps seem overly
  complicated". Recommendation: "think twice about creating a tutorial for simple
  applications" and invest in the interface and in contextual help.
- Nielsen Norman Group, "Instructional Overlays and Coach Marks for Mobile Apps", Aurora
  Harley, 16 February 2014 (nngroup.com/articles/mobile-instructional-overlay). Quote:
  "Presenting hints one-by-one, at the right moment, makes it a lot easier for users to
  understand and learn instructions." Chains of tips get dismissed: "Bombarding users with
  frequent hint screens causes them to dismiss hints more quickly." Keep the text very
  short; one task per hint.
- Userpilot, "SaaS Product Metrics Benchmark Report 2025" (userpilot.com/saas-product-metrics),
  from anonymised data of 547 companies: the average activation rate is 37.5 percent (62
  companies) and the average onboarding checklist completion rate is 19.2 percent (188
  companies); average time to value 1 day 12 hours. A checklist alone is not the answer:
  four of five users never finish one.
- Roman Kamushken, "How to replace onboarding with contextual help, and lift activation",
  22 February 2026 (setproduct.com/blog/how-to-replace-onboarding-with-contextual-help).
  Three levels of help: passive (labels, empty states, helper text), gentle nudges (a tooltip
  on the first interaction), rescue (a stronger step after repeated friction). Quote: "The
  tour had been an obstacle placed in front of motivated users." (one company's five-step
  tour switched off by accident, activation went up; the figure is not given, so it is an
  anecdote, not a number.)
- Zendesk, "Slack kills at onboarding customers, here's how", Joshua Weissburg, updated 15
  March 2018 (zendesk.com/blog/slack-onboarding). Slackbot says it is a bot, asks the name,
  then suggests one action at a time and only moves on when the previous one is done; it
  reads what the person has and has not tried. Quote: "they didn't try to build the world's
  most advanced onboarding AI so they can pretend that you're chatting with a person."
- Appcues, "Duolingo's delightful user onboarding experience" (goodux.appcues.com/blog/
  duolingo-user-onboarding). Duo greets, waves at the right moments and the first lesson
  happens before sign-up: learning by doing, with the mascot as the voice, not as the
  teacher of every screen. The page argues from psychology (goal setting, progress bars),
  not from measured data.
- Clippy (Microsoft Office Assistant, 1997 to 2007): the search summary of several articles
  (thenewstack.io, cio.co.nz, dice.com; the pages did not load in this session, so this is
  unverified) agrees on the cause: it interrupted on weak triggers ("It looks like you're
  writing a letter") and kept coming back; Microsoft turned it off by default in Office
  2000 and removed it in Office 2007.

What the sources agree on: no upfront tutorial; one hint at a time, at the moment it is
needed, in very few words; empty states and labels do most of the teaching; a guide that
knows what the person has done and suggests the next step only; the person can switch it
off; a mascot gives the guide a voice and a tone, it does not make a tutorial work.

## What was decided for SMEsay (the defaults in the stories, Mihai confirms or changes)

- The robot is the voice of the guide, not a tour. It appears in one place per screen, a
  guide card (robot pose, one line, at most one action, Dismiss), never a modal, never a
  spotlight overlay, never more than one on a screen (note 39 rule 1).
- The guide reads the data, not the clicks: which step the project is on, what is missing
  on that step (no list, no shape run, intro empty, link not published), so the line is
  always true and the next step is always the one the data says (Slackbot's rule).
- The first project has a four-step path on Projects: Import, Shape, Build, Share, then
  "read the results". Each step is ticked from the data (a set exists, a shape run exists,
  an instrument has an intro and fields, a link is published), never from a click, so the
  19.2 percent checklist completion figure measures the product, not the checklist.
- Rescue help exists for three stuck states the data can see (E15-4), nothing else in R1.
  Every tip is a candidate for Clippy's fate: a tip that is dismissed more than it is acted
  on comes out (E15-5 measures it).
- Off switch: "Show tips" in the sidebar footer, per person, and each tip remembers its own
  dismissal; the quickstart page (E12-2) stays as the reference the person can open any time.
- Learning by doing: the sample project is the lesson. The robot's "analysis" pose walks the
  sample's Results in three tips, one per screen, each opened by the person (E15-3), not a
  sequence that plays by itself.
- No robot on the respondent side beyond the thank-you page (decision 0041 and note 37
  stand): respondents are not onboarded, the instrument has to work on its own.
- Poses: "hi" greets on the first visit of Projects, "idea" gives tips, "reading" on Import,
  "analysis" on Results. The pack has 75 robots (docs/assets.md row 1); a fifth pose for the
  rescue tip ("Robot Help" or "Robot Question") is placed when E15-4 is built.

## Questions for Mihai

1. The first-project path: on Projects above the table (recommended: it is the one screen
   every session starts on), or in the sidebar under the project list?
2. Rescue tips (E15-4): the three stuck states as written, or none in R1? Recommended: the
   three, each measured.
3. The sample walkthrough (E15-3): three tips as written, or a longer path through the
   dashboard? Recommended: three; more waits for what E15-5 measures.
4. Should the robot have a name? Recommended: no name in R1; "the guide" in copy, the robot
   is the picture. A name is a brand decision for the launch gate.

## Checks

The stories carry acceptance criteria and a Playwright test each; nothing is built yet.
