# Design note 80: the visitors' sample instrument, 2026-10-05

Made in the Claude Code cloud session of 2026-10-05 for stories/E12-4, under decision 0044.

## What was decided

- /sample is the Marlow Group instrument built in memory from src/db/seed/sample.ts, with no
  database read. The story's technical note expected a read-only "sample" workspace in every
  deployment and the preview's token; both are unnecessary when the page reads nothing, and a
  page that reads nothing cannot leak anything. The item ids are the references (CL-01 to
  CL-06); nothing is stored under them.
- The respondent app gets a sample mode on top of the preview mode (E5-6): nothing goes to the
  server, as in the preview, but Submit works and shows Done, the cards say "Saved on this
  device", and the details, cards, Wrap up and Submit are kept in the tab's session storage
  (smesay-sample). A small client wrapper reads them after hydration and starts the app on the
  screen the address names, so reload and Back behave as on a live link. The savers know the
  token "sample" and never call /r/sample/state or probe local storage. About you and the Wrap
  up behave as on a live link (no preview strip, Submit enabled).
- The audit found the sample reloading itself after a lost connection (the saver's online
  check called /r/sample/state, which answered 404); the token check above closes it.
- The sentence "Sample: nothing you enter here is saved" is the watermark band (the sample
  project's dashed outline, E8-8) directly above the header, rather than the header's own note
  line, which on a phone already carries the workspace name. One band says both things the
  story asks for.
- "Powered by SMEsay" links to the landing page in the sample only (PoweredBy's "landing"
  value); on a workspace's link it stays text, as E7-7 built it.
- The landing page's two "See the sample" buttons become "Try the sample as a respondent" to
  /sample, as the story's user line said they would.
- The proxy counts /sample in the respondent limit (E11-1).

## Why

A visitor should see the real respondent app, not a copy of it, and the sample must not depend
on a seeded row that a deployment might not have.
