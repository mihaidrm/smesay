// Who may see /admin (stories/E13-2, acceptance 1; E14-1 shares the rule): the signed-in email
// in ADMIN_EMAILS, a comma separated list, compared in lower case. Anyone else, signed in or
// not, and everyone while the variable is missing, gets the 404 page, so the page's existence
// is not shown (notFound: node_modules/next/dist/docs/01-app/03-api-reference/04-functions/
// not-found.md).
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import type { AdminProof } from "@/db/types";
import type { Session } from "@/lib/session";

export function adminEmails(value = process.env.ADMIN_EMAILS): string[] {
  return (value ?? "").split(",").map((e) => e.trim().toLowerCase()).filter((e) => e.includes("@"));
}

export function isAdmin(email: string | null | undefined, list = adminEmails()): boolean {
  return Boolean(email) && list.includes(email!.trim().toLowerCase());
}

// The session and the proof the admin reads take (src/db/types.ts AdminProof).
export async function requireAdmin(): Promise<{ session: Session; proof: AdminProof }> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !session.user.emailVerified || !isAdmin(session.user.email)) notFound();
  return { session, proof: { checked: "admin" } as AdminProof };
}
