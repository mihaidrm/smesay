// The session check every signed-in page runs (stories/E2-1, acceptance 5). Next's guide keeps
// the real check next to the data, not in a layout (node_modules/next/dist/docs/01-app/
// 02-guides/authentication.md, "Layouts and auth checks"). A signed-out request is sent to the
// sign-in page with the path it wanted; the proxy (src/proxy.ts) does the same before rendering.
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isAPIError } from "better-auth/api";
import { auth } from "@/lib/auth";

export type Session = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;

// The one read of the session for a request, with the given headers or the request's own. better-
// auth answers a request whose session row went away between its read and its daily refresh
// write with the UNAUTHORIZED error "Failed to get session", after expiring the cookies
// (node_modules/better-auth/dist/api/routes/session.mjs, the updateSession that returns nothing;
// Mihai saw the error page on 2026-10-08). That request is a signed-out one, so it reads as no
// session; any other error (the database, a schema out of date) is still thrown.
export async function readSession(requestHeaders?: Headers): Promise<Session | null> {
  try {
    return await auth.api.getSession({ headers: requestHeaders ?? (await headers()) });
  } catch (error) {
    if (isAPIError(error) && error.status === "UNAUTHORIZED") return null;
    throw error;
  }
}

// Whether a request carries a live session, without redirecting: a form's save answers "signed
// out" so the page keeps what was typed (stories/E11-6, acceptance 3).
export async function signedIn(): Promise<boolean> {
  return (await readSession()) !== null;
}

export async function requireSession(nextPath: string): Promise<Session> {
  const session = await readSession();
  if (!session) redirect(`/sign-in?next=${encodeURIComponent(nextPath)}`);
  return session;
}
