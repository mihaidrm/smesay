# Design note 26: the server route to the model, 2026-10-02

Story E4-1. No screen of its own: the messages it returns appear on the Shape board in E4-2
(docs/copy/errors.md, Shaping). This note records what was decided while building it.

## What was built

`runModel(input, deps)` in src/lib/ai/client.ts, the one function every AI feature calls.
It takes the workspace id from the session (never the request), the project, the purpose,
the instructions, the uploaded text, a zod schema and an optional content check, and
returns either the validated output with the logged run, or a refusal with the message the
screen shows and a detail line for the server log.

Order of work inside it: workspace and project lookup (404 for another workspace's project,
403 on the sample), the budget check, the key check, the call with a 60 second timeout and
no SDK retries, the ai_run row, then the checks on the answer.

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
- A run row is written for every call the provider answered, including a refusal, a cut-off
  answer and an answer that failed the schema: the tokens were billed either way. A timeout, a
  429 and a connection error write no row. The plan's run cap (E2-6) therefore counts answered
  calls.
- The project is required: usage() counts a run against the budget only through its project
  (the sample's rows never count), so a run without a project would be free. The sample is
  refused with its own message ("The sample project cannot be changed by AI."), as E3-1 refuses
  edits on it.
- Structured output is requested from the API (output_config.format from the zod schema) and
  the answer is validated again in the app with the same schema. The caller's schema is a
  z.strictObject, so an extra field fails; the caller's check refuses content the schema
  cannot see, such as an item the input does not have.
- The SDK's retries are off (maxRetries 0): a 429 reaches the user as its own message at once,
  and the 60 seconds are one timeout, not three. Prompt caching is not used in R1 (the story);
  cache tokens are still counted as input if a later story turns it on.
- The key is read in this one file. ESLint refuses the SDK package anywhere else
  (no-restricted-imports, tested in src/lib/ai/lint-rule.test.ts), and
  scripts/check-ai-bundle.mjs fails the build when a file under .next/static carries the key
  name or the package name. CI runs it after the build.
- The acceptance run is `npm run ai:smoke` on Mihai's PC (docs/accounts.md step 9): one call
  on his first project of his own, printing the tokens, the cost and the row id.

## Open for Mihai

- ANTHROPIC_MONTHLY_BUDGET_EUR sits in .env.example since E1 and nothing reads it. Either a
  global cap across workspaces (the Console limit is now EUR 10, so one at EUR 10 would stop
  the app before the provider does) or remove the line. Recommended: the cap, in E4-6 with the
  golden set runner, when the real spend per run is known.
- The workspace default of EUR 50 (schema) is above the Console's EUR 10 limit. The provider
  refuses first; the app then shows "The AI did not answer". Lowering the default to 10 is a
  migration; recommended when the first outside workspace exists.
