"use client";
// Sign out (stories/E2-1): ends the session through better-auth and returns to the sign-in page.
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <Button variant="secondary" size="small" loading={busy} className="self-start" onClick={async () => {
      setBusy(true);
      await authClient.signOut();
      router.push("/sign-in");
      router.refresh();
    }}>Sign out</Button>
  );
}
