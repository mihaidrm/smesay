"use client";
// "Continue with Google" (stories/E2-2, acceptance 1): authClient.signIn.social starts the
// provider flow; better-auth adds state and PKCE and sends the browser to Google
// (node_modules/better-auth/dist/api/routes/sign-in.mjs, signInSocial: a Location header
// unless disableRedirect). The callback returns to `next`; a refusal or a cancel goes to
// GOOGLE_ERROR_PATH. Copy: docs/copy/app.md, Sign-in.
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { SIGN_IN_COPY } from "@/lib/sign-in-copy";

export function GoogleButton({ next, errorPath }: { next: string; errorPath: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <Button type="button" variant="secondary" loading={busy} className="self-start" onClick={async () => {
      setBusy(true);
      const { error } = await authClient.signIn.social({ provider: "google", callbackURL: next, errorCallbackURL: errorPath });
      if (error) { setBusy(false); window.location.assign(errorPath); }
    }}>{SIGN_IN_COPY.google}</Button>
  );
}
