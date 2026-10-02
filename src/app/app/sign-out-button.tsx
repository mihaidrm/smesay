"use client";
// Sign out (stories/E2-1): ends the session through better-auth and returns to the sign-in page.
// If the request fails the person stays here and sees the message from docs/copy/errors.md.
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  return (
    <div className="flex flex-col gap-2">
      <Button variant="secondary" size="small" loading={busy} className="self-start" onClick={async () => {
        setBusy(true); setFailed(false);
        const { error } = await authClient.signOut();
        setBusy(false);
        if (error) { setFailed(true); return; }
        router.push("/sign-in");
        router.refresh();
      }}>Sign out</Button>
      {failed && <p role="alert" className="text-xs text-danger">Sign out did not complete. Try again.</p>}
    </div>
  );
}
