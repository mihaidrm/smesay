"use client";
// The email form (stories/E2-1, acceptance 1 and 2). Validates the address with the same rule
// the server applies (better-auth's endpoint uses zod's z.email(), node_modules/better-auth/
// dist/plugins/magic-link/index.mjs; zod.dev/api#emails), asks better-auth for a magic link,
// then shows the "Check your email" status box. Every message shown comes from docs/copy/
// errors.md; the library's own text never reaches the screen. Components from
// docs/design-system.md.
import { useState } from "react";
import { z } from "zod";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { messageForStatus, SIGN_IN_COPY } from "@/lib/sign-in-copy";

const EMAIL = z.email();
export function SignInForm({ next }: { next: string }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const address = email.trim();
    if (!EMAIL.safeParse(address).success) { setError(SIGN_IN_COPY.badAddress); return; }
    setError(null); setBusy(true);
    const { error: sendError } = await authClient.signIn.magicLink({ email: address, callbackURL: next, errorCallbackURL: "/sign-in/link-used" });
    setBusy(false);
    if (sendError) { setError(messageForStatus(sendError.status, (sendError as { waitMinutes?: unknown }).waitMinutes)); return; }
    setSent(true);
  }

  if (sent) {
    return (
      <div role="status" className="rounded-lg border border-hairline bg-tint px-4 py-3">{SIGN_IN_COPY.sent}</div>
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
