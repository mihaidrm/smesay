# Context for the next Claude Code session

What: a hosted tool where a PM imports a requirement list (xlsx, csv; Jira and Notion later),
gets a readable validation instrument, sends one link, and gets back agreement, disagreement
with reasons and gaps, plus AI-written actions. Respondents need no account. Provisional name SMEsay
(decision 0005); no domain until the product is validated (decision 0006).

Who: consultancies running discovery and platform selection; in-house product and IT teams.
Owner: Alerty S.R.L. (Mihai). Built by Mihai and Claude Code.

Where we are (updated 2026-09-30): Setup. No application code exists. Done so far:
- Working setup decided (docs/decisions/0004-working-setup.md).
- Account list with steps written (docs/accounts.md). No account is created yet.
- Placeholder logo in assets/brand/. Asset shopping list in docs/brand-assets.md.
- User journey and a clickable prototype with mocked data (docs/design-notes/2026-09-30-03-prototype.md).
  It has not been opened in a browser by Claude. Mihai reviews it first.
- Landing page design on the same canvas, measured against duna.com
  (docs/design-notes/2026-09-30-04-landing.md). Rendered and checked at 1440 px. No phone layout yet.
- Mihai's feedback: page A follows Duna too closely; Duna is an example, not a template; the page
  needs motion. Landing page B (own layout, animated) is on the canvas
  (docs/design-notes/2026-09-30-05-landing-b-and-motion.md).
- Mihai offered two of his own past deliverables as visual reference and chose to keep decision
  0002 instead. Landing page C (docs/design-notes/2026-09-30-06-landing-argument.md) is the
  current candidate: it adds today-versus-with, six outputs, the respondent phone, who it is for
  and a comparison table. Landing page D (docs/design-notes/2026-10-01-08-landing-d-simple.md) is the
  simple one: three pictures, three captions, three steps. Mihai chose B's layout with D's story
  and a gallery of outputs: landing page E (decision 0008). E is the current landing page.
- Provisional name SMEsay (first proposal Agreeline), mark option A, and a new example (a company replacing its
  expense tool) applied to the journey, PM app, respondent flow and landing page C
  (docs/decisions/0005-provisional-name-and-example.md). Waiting for Mihai's approval of all three.

Machine check on 2026-09-30: Node v20.17.0 (plan asks for Node 22; upgrade before scaffolding),
Git 2.40.0, Docker 27.5.1. The folder is not a git repository yet.

Read in this order: CLAUDE.md, docs/plan-steps.md, docs/decisions/*, docs/design-notes/*, docs/schema.md,
stories/backlog.md, docs/business-plan.pdf (pages 9 to 15 hold the acceptance criteria).

Waiting on Mihai:
1. Feedback on landing page E and on the prototype: the respondent answer model and the PM steps.
2. Trademark search for SMEsay before buying anything. Logo decided: wordmark D with mark B.
3. Delete the eight retired agent files in .claude/agents/ (builder-ui, copy-docs, dashboard,
   lead, researcher, runtime, schema-security, spec-writer). Claude's delete was blocked by the
   permission system on 2026-09-30. Keep reviewer.md and tester.md.
4. Node 22 installed. Docker Desktop running for build sessions. Optional: a private repository
   on Mihai's personal GitHub (decision 0006: local and personal until validated).

Next tasks for Claude, in order, once the items above are answered:
1. `git init`, first commit, push to the GitHub repository.
2. Scaffold Next.js 15 with TypeScript, Tailwind, shadcn/ui, Drizzle, better-auth, Vitest,
   Playwright. Add the copy scan script (`npm run scan:copy`) from WRITING.md.
3. Write docs/design-system.md from design notes 01 to 03 and build the styleguide page.
4. Write stories/E1-*.md from the E1 rows of the plan, using stories/TEMPLATE.md.
5. Stop and list every open question for Mihai before building E1.

Do not: read or reference any client engagement material; create accounts; commit secrets;
decide scope.
