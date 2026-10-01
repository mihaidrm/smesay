# 0009 Prototype choices, headline and example confirmed, 2026-10-01

Decided by Mihai in the Claude Code cloud session of 2026-10-01.

1. Headline on landing page E stays: "Send the list as a link. Get back who agrees, and why."
   Marked "good for now"; it can change after first users.

2. The eight prototype choices in design note 03 are accepted as written: the answer model
   (Agree; Should be different with a mandatory reason; Unclear with a mandatory question;
   direct value pick when the proposed value is hidden), one item per screen on the phone, the
   missing-item form as its own skippable screen, the summary screen with confidence scale and
   sign-off checkbox, AI rewrites applied only on Accept, the live preview in the builder, five
   headline numbers plus tabs on Results, and actions with Mark done or Dismiss.

3. The example stays: Marlow Group, 400 staff, replacing its expense tool (decision 0005).
   Marked "ok for now".

4. The eight retired agent files (builder-ui, copy-docs, dashboard, lead, researcher, runtime,
   schema-security, spec-writer) are deleted from .claude/agents/. Reviewer and tester remain,
   as decision 0004 says.

5. Open, to discuss in a later session: the order of the next sessions. docs/plan-steps.md puts
   the design phase (prototypes finished, design system, copy, golden set) before the scaffold;
   docs/context.md puts the scaffold first. Claude recommends the plan-steps order. No work on
   either starts until Mihai decides.

Consequence: docs/context.md and docs/plan-steps.md updated the same day. The repository now
exists on GitHub (mihaidrm/smesay, personal account per decision 0006), so the "git init" task
in docs/context.md is done.
