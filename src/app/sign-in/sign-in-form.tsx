"use client";
// The email form (stories/E2-1, acceptance 1 and 2). Validates the address, asks better-auth for a
// magic link, then shows the "Check your email" banner. Components from docs/design-system.md.
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SIGN_IN_LINK_MINUTES } from "@/lib/mail/sign-in-email";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function SignInForm({ next }: { next: string }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const address = email.trim();
    if (!EMAIL.test(address)) { setError("Enter the email address you signed up with."); return; }
    setError(null); setBusy(true);
    const { error: sendError } = await authClient.signIn.magicLink({ email: address, callbackURL: next, errorCallbackURL: "/sign-in/link-used" });
    setBusy(false);
    if (sendError) { setError(sendError.message ?? "The link was not sent. Check the address and try again."); return; }
    setSent(true);
  }

  if (sent) {
    return (
      <div role="status" className="rounded-lg border border-hairline bg-grey-50 px-4 py-3">
        Check your email. The link works once and stops working in {SIGN_IN_LINK_MINUTES} minutes.
      </div>
    );
  }
  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)}
          aria-invalid={error ? true : undefined} aria-describedby={error ? "email-error" : undefined} className="h-10" />
        {error && <p id="email-error" className="text-sm text-danger">{error}</p>}
      </div>
      <Button type="submit" loading={busy} className="self-start">Send me a link</Button>
    </form>
  );
}
