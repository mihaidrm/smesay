// The session check every signed-in page runs (stories/E2-1, acceptance 5). Next's guide keeps
// the real check next to the data, not in a layout (node_modules/next/dist/docs/01-app/
// 02-guides/authentication.md, "Layouts and auth checks"). A signed-out request is sent to the
// sign-in page with the path it wanted; the proxy (src/proxy.ts) does the same before rendering.
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export type Session = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;

export async function requireSession(nextPath: string): Promise<Session> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect(`/sign-in?next=${encodeURIComponent(nextPath)}`);
  return session;
}
