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
// A message keeps its words but loses what could be a person's data: email addresses, quoted
// text, the values in a database error's "Key (column)=(value)", the token in a /r/ link and
// any long hex or base64 run. Pure: no SDK import, so a unit test feeds it a plain object.

const EMAIL = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g;
const QUOTED = /"[^"]*"|'[^']*'|`[^`]*`|“[^”]*”/g;
const KEY_VALUE = /\(([^()]*)\)=\(([^()]*)\)/g;
const LINK = /\/r\/[^/?#\s]+/g;
const LONG_RUN = /\b[0-9a-f]{20,}\b|[A-Za-z0-9+_-]{32,}={0,2}/gi;
export const MESSAGE_MAX = 300;
export const REMOVED = "[removed]";

export function scrubText(text: string): string {
  return text
    .replace(EMAIL, REMOVED)
    .replace(KEY_VALUE, `($1)=(${REMOVED})`)
    .replace(QUOTED, REMOVED)
    .replace(LINK, "/r/[token]")
    .replace(LONG_RUN, REMOVED)
    .slice(0, MESSAGE_MAX);
}

// The shapes read here, a subset of Sentry's Event (node_modules/@sentry/core/build/types/
// types/event.d.ts); everything else on the event is not copied.
type Frame = { filename?: string; function?: string; module?: string; lineno?: number; colno?: number; in_app?: boolean };
type Exception = { type?: string; value?: string; stacktrace?: { frames?: Frame[] } };
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
  if (event.exception?.values) out.exception = { values: event.exception.values.map((e) => ({ type: e.type, value: e.value === undefined ? undefined : scrubText(e.value), stacktrace: e.stacktrace?.frames ? { frames: e.stacktrace.frames.map(frame) } : undefined })) };
  if (event.transaction) out.transaction = scrubText(event.transaction);
  if (event.request) out.request = { method: event.request.method, url: event.request.url === undefined ? undefined : pathOnly(event.request.url) };
  return out as E;
}
