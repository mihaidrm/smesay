"use server";
// The stop page's one button (stories/E16-1, acceptance 5): stops the kind for the person
// behind the token and comes back to the page with done=1. No session: the token is the
// person's, and a token not on file is 404 (src/lib/email-prefs.ts).
import { notFound, redirect } from "next/navigation";
import { stopEmails } from "@/lib/email-prefs";

export async function stopEmailsAction(formData: FormData): Promise<void> {
  const t = formData.get("t");
  const k = formData.get("k");
  if (typeof t !== "string" || typeof k !== "string" || !(await stopEmails(t, k))) notFound();
  redirect(`/email/stop?t=${encodeURIComponent(t)}&k=${encodeURIComponent(k)}&done=1`);
}
