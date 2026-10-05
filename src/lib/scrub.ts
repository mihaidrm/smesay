// What an error report may carry (stories/E11-5, acceptance 1; SECURITY.md, Data). Sentry's
// beforeSend gets every event before it leaves the process and may return a changed event
// (docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/, beforeSend). This
// module builds a new event from an allow-list instead of deleting known fields, so a field a
// later SDK version adds is left out by default:
// - kept: the event's id, time, level, platform, environment and release; each exception's
//   type, its message with the text removed (below), and its stack frames' file, function and
//   line numbers (no local variables, no source lines); the route and the request's method;
// - dropped: user, request headers, cookies, query and body, breadcrumbs, extra, tags,
//   contexts, server name.
// A message keeps its first line only, and loses what could be a person's data there: a failed
// query's SQL and bound values (drizzle-orm's DrizzleQueryError puts "Failed query: [SQL]" and
// "params: [VALUES]" in its message, node_modules/drizzle-orm/errors.js; only "Failed query" is
// kept, the database's own error follows as the linked cause), email addresses, quoted text and
// anything after an unmatched quote, the values in "Key (column)=(value)", IP addresses, the
// token in a /r/ link and any long hex or base64 run. What it cannot see is an unquoted name in
// a library's own sentence; the gate's test event checks what a real error carries
// (docs/review-list.md). Pure: no SDK import, so a unit test feeds it a plain object.

const EMAIL = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g;
const QUOTED = /"[^"]*"|'[^']*'|`[^`]*`|“[^”]*”/g;
const KEY_VALUE = /\(([^()]*)\)=\(([^()]*)\)/g;
const LINK = /\/r\/[^/?#\s]+/g;
const LONG_RUN = /\b[0-9a-f]{20,}\b|[A-Za-z0-9+_-]{32,}={0,2}/gi;
const LONE_QUOTE = /["'`“].*$/;
const IPV4 = /\b\d{1,3}(?:\.\d{1,3}){3}\b/g;
const IPV6 = /\b(?:[0-9a-f]{0,4}:){2,7}[0-9a-f]{0,4}\b/gi;
export const MESSAGE_MAX = 200;
export const REMOVED = "[removed]";

export function scrubText(text: string): string {
  if (/^\s*Failed query\b/.test(text)) return "Failed query";
  const first = text.split(/\r?\n/)[0].replace(/\bparams:.*$/i, "");
  return first
    .replace(EMAIL, REMOVED)
    .replace(KEY_VALUE, `($1)=(${REMOVED})`)
    .replace(QUOTED, REMOVED)
    .replace(LONE_QUOTE, REMOVED)
    .replace(LINK, "/r/[token]")
    .replace(IPV4, REMOVED)
    .replace(IPV6, REMOVED)
    .replace(LONG_RUN, REMOVED)
    .slice(0, MESSAGE_MAX);
}

// The shapes read here, a subset of Sentry's Event (node_modules/@sentry/core/build/types/
// types/event.d.ts); everything else on the event is not copied.
type Frame = { filename?: string; function?: string; module?: string; lineno?: number; colno?: number; in_app?: boolean };
type Mechanism = { type?: string; handled?: boolean };
type Exception = { type?: string; value?: string; mechanism?: Mechanism; stacktrace?: { frames?: Frame[] } };
export type ReportEvent = {
  event_id?: string; timestamp?: number; level?: string; platform?: string; environment?: string; release?: string;
  message?: string | { message?: string; formatted?: string };
  exception?: { values?: Exception[] };
  transaction?: string;
  request?: { method?: string; url?: string };
};

const frame = (f: Frame): Frame => ({ filename: f.filename, function: f.function, module: f.module, lineno: f.lineno, colno: f.colno, in_app: f.in_app });
const pathOnly = (url: string) => scrubText(url.replace(/^[a-z]+:\/\/[^/]+/i, "").replace(/[?#].*$/, ""));

export function scrubEvent<E extends ReportEvent>(event: E): E {
  const message = typeof event.message === "string" ? event.message : event.message?.formatted ?? event.message?.message;
  const out: ReportEvent = {
    event_id: event.event_id, timestamp: event.timestamp, level: event.level, platform: event.platform,
    environment: event.environment, release: event.release,
  };
  if (message !== undefined) out.message = scrubText(message);
  // The mechanism's type and handled flag say how the error was caught (an unhandled request
  // error stays unhandled in Sentry); its data field is not copied.
  if (event.exception?.values) out.exception = { values: event.exception.values.map((e) => ({ type: e.type, value: e.value === undefined ? undefined : scrubText(e.value), mechanism: e.mechanism ? { type: e.mechanism.type, handled: e.mechanism.handled } : undefined, stacktrace: e.stacktrace?.frames ? { frames: e.stacktrace.frames.map(frame) } : undefined })) };
  if (event.transaction) out.transaction = scrubText(event.transaction.replace(/[?#]\S*/, ""));
  if (event.request) out.request = { method: event.request.method, url: event.request.url === undefined ? undefined : pathOnly(event.request.url) };
  return out as E;
}
