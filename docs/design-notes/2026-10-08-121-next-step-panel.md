# 121 The next-step panel after Import and after Shape, 2026-10-08

Mihai, 2026-10-08: "Clicking import needs to actually feel like import is happening. User has
no idea the import was succesful, or that it even attempted. We need to make this step more
obvious"; "After import we make a button big one appear on screen -> continue to shaping the
list or something like that"; "same for when shaping is done".

What was wrong: the Import button showed a spinner and nothing else while the commit ran; after
it, the check card closed and a 13 px muted "Imported as version 1." sat in its footer, the
title line gained a sentence, and the stepper changed; nothing said "done, now go here". Shape
had the thinking lines while it ran (design note 113) and the grouped line after, and the same
silence about what comes next.

Decided:
- The Import button reads "Importing [N] items..." with its spinner while the commit runs.
- A next-step panel (src/components/app/next-step.tsx): a panel on the agree tint under the
  page title with a tick, one line that says the step is done, one muted line that says what
  comes next, and a big primary link (the respondent size, 48 px) to the next step.
  - Import, once the latest upload is in: "The list is imported." "[N] items, version [N].
    Next, the AI shapes it into areas and writes a readable version of each item." Continue to
    Shape the list. A newer upload not yet imported shows the cards instead, since the work is
    there.
  - Shape, after a run: "The list is shaped." "Accept or edit the reader versions below if
    you want to, then build the validation your respondents will see." Continue to Build the
    validation. Not on the sample, which is read-only.
- The panel stays as long as the step is done, not only right after the click: a PM who comes
  back to Import a day later sees the same way forward. The stepper's pills (design note 106)
  stay as they are.
- Build and Share already end in their own actions (Publish on Share, decision 0021) and are
  not changed here.

Tests: e2e/import.spec.ts and e2e/shape.spec.ts read the panel and the link's address. Copy
in docs/copy/app.md; the component in docs/design-system.md.
