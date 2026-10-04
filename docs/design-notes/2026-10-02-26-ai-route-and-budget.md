# Design note 26: the server route to the model, 2026-10-02

Since note 68 (2026-10-04, E9-3) the estimate counts the output schema too, and a caller may
name the output it expects instead of the whole allowance.

Story E4-1. No screen of its own: the messages it returns appear on the Shape board in E4-2
(docs/copy/errors.md, Shaping). This note records what was decided while building it.

## What was built

`runModel(input, deps)` in src/lib/ai/client.ts, the one function every AI feature calls.
It takes the workspace id from the session (never the request), the project, the purpose,
the instructions, the uploaded text, a zod schema and an optional content check, and
returns either the validated output with the logged run, or a refusal with the message the
screen shows and a detail line for the server log.

Order of work inside it: the schema and ceiling checks (a caller's bug throws), workspace
and project lookup (404 for another workspace's project, 403 on the sample), the budget
check, the key check, the call with a 60 second timeout and no SDK retries, the ai_run row,
then the checks on the answer.

The reviewer's audit (same day, fresh context) found two blocking points and six to fix;
all eight are in the second commit of PR 40 and listed below where they changed a decision.

## Decisions taken here

- Model: claude-sonnet-5-5, the Sonnet class model on the day, as the story's notes ask.
  Prices from the pricing page of 2026-10-02 (2 and 10 dollars per million tokens), euro by
  the ECB reference rate of the same day (1.1225), both in src/lib/ai/prices.ts with the
  date. A cost is rounded up to the cent and never zero for a billed token.
- The estimate before a call is four characters per token for the input (the pricing page's
  own rule of thumb) plus the whole output allowance (16,000 tokens by default), so a call is
  refused a little early rather than a little late. With the default allowance the estimate
  is 15 cents; a workspace at EUR 50 can start about 330 calls in a month before the sum of
  real costs matters.
- A run row is written for every call, as acceptance 2 says: an answered call with its
  tokens (a refusal, a cut-off answer and an answer that failed the schema included, the
  tokens were billed), and a timeout, a 429 or a provider error with zero tokens and zero
  cost, so the log is the full list of attempts. The first build logged answered calls only;
  the audit sent it back. Consequence for Mihai to confirm: the plan's run cap (E2-6) counts
  every attempt, failed ones included. No plan carries a cap today.
- The 60 seconds cover the whole call. The SDK's timeout option ends at the response headers
  (node_modules/@anthropic-ai/sdk/client.js, the audit's probe); an AbortController cuts the
  body read at the same deadline, tested with a fetch whose body never ends.
- The plan's run cap has its own message ("used its AI runs for the month on its plan"), since
  raising the euro budget would not lift it; and an answer the app could not use (a refusal,
  a cut-off, a schema or check failure) has its own ("The AI answered in a form the app could
  not use"), since "did not answer" was untrue there. Both rows are new in docs/copy/errors.md
  for Mihai to accept.
- Per-request ceilings (SECURITY.md): 500,000 input characters, 16,000 output tokens. A
  caller over them is a bug and gets an Error, not a clipped call.
- The project is required: usage() counts a run against the budget only through its project
  (the sample's rows never count), so a run without a project would be free. The sample is
  refused with its own message ("The sample project cannot be changed by AI."), as E3-1 refuses
  edits on it.
- Structured output is requested from the API (output_config.format from the zod schema) and
  the answer is validated again in the app with the same schema. Every object in the schema
  must be strict: src/lib/ai/strict.ts walks the zod definition at the call, through arrays,
  records, maps, sets, tuples, intersections, pipes, lazy, optional and union, and throws on a
  loose object anywhere, so an extra field fails rather than being stripped (tested kind by
  kind in strict.test.ts). The caller's
  check is required and refuses content the schema cannot see, such as an item the input does
  not have.
- The SDK's retries are off (maxRetries 0): a 429 reaches the user as its own message at once,
  and the 60 seconds are one timeout, not three. Prompt caching is not used in R1 (the story);
  cache tokens are still counted as input if a later story turns it on.
- The key is read in this one file. The lint rule smesay/ai-sdk (eslint-rules/db-access.mjs)
  refuses the SDK package anywhere else by every import spelling, and refuses this module
  from a file that starts with "use client" (tested in src/lib/ai/lint-rule.test.ts).
  scripts/check-ai-bundle.mjs is a CI step after `next build` that fails when a file under
  .next/static carries the key name or the package name (its scan is tested).
- The server log names the SDK error class and status (the SDK's classes do not set `name`);
  a 401 says to check ANTHROPIC_API_KEY. The route's own detail lines carry codes, counts and
  paths, never text from the list or the answer; the caller's check reason is the caller's,
  and E4-2's check returns counts.
- The acceptance run is `npm run ai:smoke` on Mihai's PC (docs/accounts.md step 9): one call
  on his first project of his own, printing the tokens, the cost and the row id.

## Known limits, left as they are

- The budget check is read-then-call: two calls from one workspace in the same second can
  both pass and overspend by one call. A reservation row would fix it; not worth it before a
  second user exists.
- The estimate counts four characters per token and leaves out the JSON schema the API adds;
  the whole output allowance covers the gap today.
- 16,000 output tokens in 60 seconds needs about 270 tokens per second from the model, which
  is unverified. The golden set runner (E4-6) will show real durations; if shaping a 2,000
  row list times out, E4-2 chunks the list.
- Cache tokens are priced at the base input rate; caching is off in R1.
- The smoke run is logged as a shaping run on Mihai's project, one row.
- The plan's run cap path has no test: no plan carries a cap (E2-6), so there is nothing to
  hit it with until one does.
- A "use client" file that imports a server module which imports runModel is caught by the
  bundle check in CI, not by lint. `import "server-only"` would catch it at build time but
  throws under vitest and tsx; left out.

## Open for Mihai

Both points below were decided on 2026-10-03 (decision 0036, design note 31): the product cap
reads ANTHROPIC_MONTHLY_BUDGET_EUR, and the workspace default is 10.

- ANTHROPIC_MONTHLY_BUDGET_EUR sits in .env.example since E1 and nothing reads it. Either a
  global cap across workspaces (the Console limit is now EUR 10, so one at EUR 10 would stop
  the app before the provider does) or remove the line. Recommended: the cap, in E4-6 with the
  golden set runner, when the real spend per run is known.
- The workspace default of EUR 50 (schema) is above the Console's EUR 10 limit. The provider
  refuses first; the app then shows "The AI did not answer". Lowering the default to 10 is a
  migration; recommended when the first outside workspace exists.
