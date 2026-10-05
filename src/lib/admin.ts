// Who may see /admin (stories/E13-2, acceptance 1; E14-1 shares the rule): the signed-in email
// in ADMIN_EMAILS, a comma separated list, compared in lower case. Anyone else, signed in or
// not, and everyone while the variable is missing, gets the 404 page, so the page's existence
// is not shown (notFound: node_modules/next/dist/docs/01-app/03-api-reference/04-functions/
// not-found.md).
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { cache } from "react";
import { auth } from "@/lib/auth";
import type { AdminProof } from "@/db/types";
import type { Session } from "@/lib/session";

export function adminEmails(value = process.env.ADMIN_EMAILS): string[] {
  return (value ?? "").split(",").map((e) => e.trim().toLowerCase()).filter((e) => e.includes("@"));
}

export function isAdmin(email: string | null | undefined, list = adminEmails()): boolean {
  return Boolean(email) && list.includes(email!.trim().toLowerCase());
}

// The session and the proof the admin reads take (src/db/types.ts AdminProof), with the admin's
// user id from the session for the audit row. cache() keeps one session read per request when
// the layout and the page both ask (react.dev/reference/react/cache).
export const requireAdmin = cache(async (): Promise<{ session: Session; proof: AdminProof }> => {
  const session = await auth.api.getSession({ headers: await headers() });
  const proof = adminProofFor(session);
  if (!session || !proof) notFound();
  return { session, proof };
});

// The proof for a session already read, or null when it is not an admin's: the view-as check in
// the PM app (src/lib/view-as.ts, stories/E14-4), where anyone else must get the app as usual,
// not a 404. The one other place a proof is made.
export function adminProofFor(session: Session | null): AdminProof | null {
  if (!session || !session.user.emailVerified || !isAdmin(session.user.email)) return null;
  return { checked: "admin", userId: session.user.id } as AdminProof;
}
