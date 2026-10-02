// A "next" parameter may only send the person to a path inside this site (stories/E2-1,
// acceptance 5). The checks follow better-auth's own relative-URL rule (node_modules/better-auth/
// dist/auth/trusted-origins.mjs, isSafeRelativeURL): one leading slash, not "//", no backslash,
// no control character (the URL parser strips tab, CR and LF, so "/\t/evil.example" would
// resolve to another host: url.spec.whatwg.org/#url-parsing, "remove all ASCII tab or newline"),
// no encoded slash in the path part, and the parsed result stays on the same origin.
const CONTROL = /[\u0000-\u001f\u007f]/;
const ENCODED_SEPARATOR = /%2f|%5c/i;
const ORIGIN = "http://relative.invalid";

export function isSafePath(value: string): boolean {
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\") || CONTROL.test(value)) return false;
  const end = value.search(/[?#]/);
  const path = end === -1 ? value : value.slice(0, end);
  if (ENCODED_SEPARATOR.test(path)) return false;
  try {
    return new URL(value, ORIGIN).origin === ORIGIN;
  } catch {
    return false;
  }
}

export function safeNextPath(value: string | null | undefined, fallback = "/app"): string {
  return value && isSafePath(value) ? value : fallback;
}
