# Quickstart

Shown once after the first sign-in (once per person per workspace), and always under Help in
the sidebar footer. Four steps on one page, each a card. Nothing
below describes a feature the product does not have (R1 scope, stories/backlog.md).

## Page copy

Title: Your first validation in four steps

Intro: Upload the list you were about to email round and in about ten minutes it is a link
your experts can answer on their phones.

Each step card has the number, the title, then two lines: what you do, what you get.

Step 1, Import the list
Upload an xlsx or csv, or paste the list, and mark the requirement column.
Your items are in the app, and the file stays as it is.

Step 2, Shape it
Accept or reject the AI's areas and its readable version of each item.
Nothing changes until you press Accept, and the original wording is always kept.

Step 3, Build the validation
Pick how people rate, what they fill in, and whether your proposed value shows.
The preview on the right shows what they will see, phone or desktop.

Step 4, Share one link
Publish a public link or send personal invites, and set when it closes.
Respondents need no account, and you can close or withdraw the link any time.

Then: read the results
- Answers arrive live: who agreed, who pushed back and why, what is missing.
- The AI writes a short to-do list and names the answers behind each line.
- Export the answers as CSV, the project as JSON, or a PDF summary.

Button: Start a project
Secondary link: Open the sample project

## Notes for the build (E12)

- Four steps match the stepper in the app: Import, Shape, Build, Share. "Results" is step 5 in
  the app and "Then" here on purpose; the quickstart is about getting to a link.
- "About ten minutes" is a claim to check against the first real users. Replace with a measured
  number or remove it before launch.
- The sample project link opens the sample with the watermark (decision 0003). It is left out
  when the workspace has no sample (deleted, E8-8, or archived).
- Built 2026-10-05 in src/lib/quickstart-copy.ts (stories/E12-2); the help link's label is
  "Help".
- Reworked 2026-10-07 (design note 102): one-sentence intro, two lines per step (what you do,
  what you get, at most 14 words each), three bullets under Then. The facts are the ones the
  2026-10-05 copy stated; the tip about the project words on Import and the list of rating
  scales moved out of the page, since Import and Build say them where they apply.
