# Context for the next Claude Code session

What: a hosted tool where a PM imports a requirement list (xlsx, csv; Jira and Notion later),
gets a readable validation instrument, sends one link, and gets back agreement, disagreement
with reasons and gaps, plus AI-written actions. Respondents need no account. Provisional name SMEsay
(decision 0005); no domain until the product is validated (decision 0006).

Who: consultancies running discovery and platform selection; in-house product and IT teams.
Owner: Alerty S.R.L. (Mihai). Built by Mihai and Claude Code.

Where we are (updated 2026-10-01): Setup. No application code exists. Done so far:
- Working setup decided (docs/decisions/0004-working-setup.md). The eight retired agent files
  were deleted on 2026-10-01 (decision 0009); reviewer.md and tester.md remain.
- Account list with steps written (docs/accounts.md). No account is created yet.
- Placeholder logo in assets/brand/. Asset shopping list in docs/brand-assets.md.
- User journey and a clickable prototype with mocked data (docs/design-notes/2026-09-30-03-prototype.md).
  Mihai accepted all eight prototype choices on 2026-10-01 (decision 0009).
- Landing pages A to D on the same canvas (design notes 04 to 08). Mihai chose B's layout with
  D's story and a gallery of outputs: landing page E (decision 0008). E is the current landing
  page. Headline confirmed on 2026-10-01: "Send the list as a link. Get back who agrees, and
  why." (decision 0009). No phone layout yet.
- Provisional name SMEsay (decision 0005), trademark search pending. Logo: wordmark D with
  mark B. Example: Marlow Group replacing its expense tool, confirmed 2026-10-01.
- Git repository on GitHub: mihaidrm/smesay, personal account (decision 0006). First commit
  2026-10-01.

Machine check on 2026-10-01 (Mihai's laptop, decision 0005): Node v26.10.0, Docker 29.8.1
running. The Claude Code cloud container has Node v22.22.0.

Read in this order: CLAUDE.md, docs/plan-steps.md, docs/decisions/*, docs/design-notes/*, docs/schema.md,
stories/backlog.md, docs/business-plan.pdf (pages 9 to 15 hold the acceptance criteria).

Waiting on Mihai:
1. Allow euipo.europa.eu, www.tmdn.org, branddb.wipo.int and tmsearch.uspto.gov in the cloud
   environment so Claude can run the trademark database search (decision 0012). No domain and
   no filing until then.

Next tasks for Claude, in order (decision 0013, design first):
1. Tidy the canvas: current boards in the main flow, superseded landing pages apart, labelled.
2. Landing page E: use-cases section in place of "who it is for" (decision 0010); phone layout.
3. Finish the respondent prototype: closed, revoked, personal link resume, rate-blind mode, the
   other two layouts.
4. Finish the PM prototype: settings, members, project list, sample watermark, item detail,
   export screen.
5. docs/design-system.md from design notes 01 to 08.
6. All copy: landing, quickstart, transactional emails, error messages. Scan with WRITING.md.
7. Ten golden-set specs in evals/.
8. Then Phase 2: scaffold, styleguide page, E1 stories, open questions before E1.

Do not: read or reference any client engagement material; create accounts; commit secrets;
decide scope.
