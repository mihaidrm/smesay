// The signed-in line under the pages outside the shell (/app/new, /app/switch): who is signed
// in and Sign out, so a wrong address has a way out. Copy: docs/copy/app.md.
import { SignOutButton } from "./sign-out-button";

export function SignedInFooter({ email }: { email: string }) {
  return (
    <div className="flex flex-col gap-2 text-sm text-ink-muted">
      <div>Signed in as {email}.</div>
      <SignOutButton />
    </div>
  );
}
