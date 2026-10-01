# 0010 A list with reasons, not a survey tool, 2026-10-01

Decided by Mihai in the Claude Code cloud session of 2026-10-01, on Claude's recommendation.

1. The product stays "react to a list with reasons". It is not a general survey tool and the
   landing page does not use the word survey for itself. Reason: the business plan positions
   the product against Typeform, Microsoft Forms and Google Forms, which are free or near free
   and have question types R1 does not (branching, matrices, quotas). Said as a survey tool, the
   product loses that comparison.

2. The same mechanic serves several jobs, internal and external. Landing page E gets a
   use-cases section in place of "who it is for", so the page does not grow (decision 0008).
   Each case names the existing features it depends on and nothing the product does not have.
   First list: requirement validation for a client engagement; roadmap or backlog check with
   internal experts; vendor or platform shortlist criteria; policy or process review (keep,
   change, drop); proposed catalogue or pricing changes reviewed by partners or customers.

3. Vocabulary stays generic. RequirementSet in docs/schema.md becomes ItemSet before the E1
   migration is written. "Requirement" is not used in button or column labels.

4. E3 gets one more story: type or paste a list instead of uploading a file.

5. No free-form question types that are not tied to an item in R1. That is the line between
   a list and a survey.

Consequence: docs/schema.md, stories/backlog.md and docs/plan-steps.md updated the same day.
