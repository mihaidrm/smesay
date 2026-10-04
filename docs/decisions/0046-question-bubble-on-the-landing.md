# 0046 A question bubble on the landing page that emails Mihai, 2026-10-04

Mihai: "I think we should add a support option bubble that floats on the landing page
bottom right, and users can ask questions to the ai bot - and ai bot cannot respond - it
gets sent to me?"

Decision: story E12-5. A button at the bottom right of the landing page opens a small panel
where a visitor writes their email and a question; the server emails the question to
Mihai with Reply-To set to the visitor, and stores nothing. No model is called.

Claude's recommendation, waiting for Mihai (decision 0007): the bubble and the panel do not
say "AI". A visitor who sees an AI chat expects an answer within seconds; this one answers
by email later, so the words say that ("Ask us a question", "We reply by email within one
working day"). An assistant that answers is a separate story with its own spend decision
(decision 0039).

Open until Mihai answers (stories/E12-5): the word "AI", the address the questions go to
(SUPPORT_EMAIL), and the reply promise.

Consequences: stories/E12-5-support-bubble.md written; stories/backlog.md and the E12 row
of docs/plan-steps.md name it; docs/copy/landing.md and docs/copy/emails.md carry its words
as proposed; stories/E11-3 (privacy page) names the messages.
