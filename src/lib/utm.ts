// Where a new workspace came from (stories/E13-3, acceptance 4): the utm_source of the link
// that brought the person, carried from the landing page to sign-in, through the magic link
// (as the callback's query) to the workspace step, and stored once as workspace.first_source.
// Only a short token is kept: lowercase letters, digits, dot, dash and underscore, up to 40
// characters; anything else is dropped, so a sentence or an email address cannot be stored
// (a hand-made source such as a name with a dot still can; it is what the link said).
export const SOURCE_MAX = 40;
const SOURCE = new RegExp(`^[a-z0-9._-]{1,${SOURCE_MAX}}$`);

export function cleanSource(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const v = value.trim().toLowerCase();
  return SOURCE.test(v) ? v : null;
}

// The sign-in page's target for a person who came with a source: the workspace step, which an
// existing member is sent on from (src/app/app/new/page.tsx).
export function nextWithSource(next: string, source: string | null): string {
  return source && next === "/app" ? `/app/new?source=${encodeURIComponent(source)}` : next;
}

export function signInHref(source: string | null): string {
  return source ? `/sign-in?utm_source=${encodeURIComponent(source)}` : "/sign-in";
}
