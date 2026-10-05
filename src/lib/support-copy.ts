// The question bubble's words (stories/E12-5), from docs/copy/landing.md, Question bubble
// (decision 0049: no "AI", "Ask us a question", a reply within one working day). No server
// import, so the landing page's client island can use them.
// The limits the words name, shared with the server checks (src/lib/support.ts).
export const QUESTION_MAX = 2000;
export const SUPPORT_PER_ADDRESS = 5;

export const SUPPORT_COPY = {
  button: "Ask us a question",
  title: "Ask us a question",
  line: "We read every message and reply by email within one working day.",
  email: "Your email",
  question: "Your question",
  privacyLine: "We use your email only to reply.",
  privacy: "Privacy",
  send: "Send",
  sending: "Sending",
  close: "Close",
  sent: (email: string) => `Sent. We will reply to ${email}.`,
  emailMissing: "Enter your email so we can reply.",
  questionEmpty: "Write your question.",
  questionLong: (max: number) => `Keep your question to ${max.toLocaleString("en-GB")} characters.`,
  failed: (support: string) => `Your question was not sent. Check your connection and press Send again, or email ${support}.`,
  tooMany: (count: number, support: string) => `You have sent ${count} questions in the last hour. Email ${support} instead.`,
} as const;
