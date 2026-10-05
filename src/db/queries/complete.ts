// When a stored answer is complete, in SQL (INTERFACES.md ReasonRule; design note 98): the twin
// of isComplete() in src/lib/respondent-rules.ts for the counts the database makes (CLAUDE.md,
// dashboard: aggregates over 500 rows in SQL). `rule` is an expression giving the
// instrument's reason_rule; `a` names the answer's kind, reason and comment. differs: change,
// disagree and unclear need a reason with a character that is not white space; never: every
// answer counts; always: change, disagree and unclear need that reason, agree and pick that
// comment. `~ '\S'` is a POSIX regular expression match
// (postgresql.org/docs/current/functions-matching.html#FUNCTIONS-POSIX-REGEXP); a null text
// gives null, which coalesce turns into false. SQLWrapper: node_modules/drizzle-orm/sql/sql.d.ts.
import { sql, type SQL, type SQLWrapper } from "drizzle-orm";

export type AnswerColumns = { kind: SQLWrapper; reason: SQLWrapper; comment: SQLWrapper };

export function completeSql(rule: SQLWrapper, a: AnswerColumns): SQL {
  const reasonKind = sql`${a.kind} in ('change', 'disagree', 'unclear')`;
  const reasonWritten = sql`coalesce(${a.reason} ~ '\\S', false)`;
  const commentWritten = sql`coalesce(${a.comment} ~ '\\S', false)`;
  return sql`(case ${rule}
    when 'never' then true
    when 'always' then (case when ${reasonKind} then ${reasonWritten} else ${commentWritten} end)
    else (not ${reasonKind} or ${reasonWritten}) end)`;
}
