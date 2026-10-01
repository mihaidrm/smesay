# E4-1 Server route to Anthropic with a per-workspace budget, logging and timeout

User: Claude building every AI feature on it; the workspace owner watching the budget
Status: ready
Outcome: one server-side function calls the model, refuses over budget, logs every call, and
never lets the key near a browser.

## Acceptance criteria
1. src/lib/ai/client.ts is the only file that reads ANTHROPIC_API_KEY. A lint rule
   (no-restricted-imports) fails when any file outside src/lib/ai/ imports the SDK; `next
   build` output is grepped for the key name and the SDK package name in client bundles.
2. Every call records an ai_run row: workspace, project, purpose (shape, insights), model,
   tokens in and out, cost in euro cents from a price table in the code, duration
   (docs/schema.md). The cost table names the model and the date its prices were read.
3. Before a call, the month's spend (E2-6 usage) plus the call's estimated cost is checked
   against workspace.ai_budget_eur. Over budget: the call is refused and the caller gets the
   message "This workspace has used its AI budget for the month. The list is imported and can
   be published as it is. Ask the workspace owner to raise the budget." (docs/copy/errors.md).
4. Timeout 60 seconds; on timeout or provider error the caller gets "The AI did not answer.
   Nothing changed. Try again; if it fails again, use the items as imported and come back
   later." with a Try again button. A provider 429 gives "Too many AI requests at once. Wait a
   minute and try again." No partial result is ever applied.
5. Uploaded text is passed as data, in a separate content block from the instructions, and
   every output is validated against a JSON schema before it is used (SECURITY.md, AI). A
   test feeds an output with an extra field and an output with an invented item and both are
   refused.
6. Unit tests use a fake transport; no test calls the real API. One manual run by Mihai with
   his key on his PC is the acceptance (docs/accounts.md step 9).

## Out of scope
- The prompts themselves: E4-2 to E4-5. Insights: E9.

## Open questions
- None.

## Technical notes
Anthropic SDK for TypeScript (docs.anthropic.com; the model id and pricing page are read when
the story starts and cited in the price table). Default model: the latest Sonnet class model
on that day, recorded in the table. Prompt caching is not used in R1. The claude-api skill in
this environment is consulted before the SDK call is written.
