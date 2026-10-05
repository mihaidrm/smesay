// The app's one logger (stories/E11-5, acceptance 3; SECURITY.md, Data). A line is a fixed
// sentence plus named fields, and only the fields in FIELDS are printed: ids, counts, money,
// step and reason codes. A field outside the list is dropped, whatever a caller passes, so a
// name, an email or an answer cannot reach the log through this module. The sentence is the
// caller's constant; text from a request or the database goes in no sentence. The lint rule
// no-console keeps src/ on this module (eslint.config.mjs).
//
// Output goes to the console, which the host collects (docs/runbooks, launch gate): error and
// warn to stderr, info to stdout (nodejs.org/api/console.html).

export const FIELDS = [
  "workspace", "project", "set", "purpose", "reason", "detail", "step", "error", "sqlstate",
  "count", "objects", "responses", "projects", "estimateCents", "costCents", "tokensIn", "tokensOut",
] as const;
export type LogField = (typeof FIELDS)[number];
export type LogFields = Partial<Record<LogField, string | number | null | undefined>>;
type Level = "info" | "warn" | "error";

const ALLOWED = new Set<string>(FIELDS);
const VALUE_MAX = 200;

// The line as printed: the sentence, then key=value for each allowed field that has a value.
export function formatLine(message: string, fields: LogFields = {}): string {
  const parts = Object.entries(fields)
    .filter(([key, value]) => ALLOWED.has(key) && value !== undefined && value !== null && value !== "")
    .map(([key, value]) => `${key}=${String(value).replace(/\s+/g, " ").slice(0, VALUE_MAX)}`);
  return parts.length === 0 ? message : `${message} ${parts.join(" ")}`;
}

export function log(level: Level, message: string, fields?: LogFields): void {
  const line = formatLine(message, fields);
  // eslint-disable-next-line no-console -- the one place that prints
  if (level === "error") console.error(line); else if (level === "warn") console.warn(line); else console.info(line);
}
