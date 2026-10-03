// Where better-auth sends a person whose link was already used or has expired
// (errorCallbackURL in src/app/sign-in/sign-in-form.tsx). Copy from docs/copy/errors.md.
import Link from "next/link";
import { Lockup } from "@/components/brand/mark";
import { buttonVariants } from "@/components/ui/button";

export default function LinkUsedPage() {
  return (
    <main className="auth-frame">
      <Lockup />
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-medium tracking-tight">This sign-in link has already been used or has expired.</h1>
        <p className="text-ink-muted">Ask for a new one.</p>
      </div>
      <Link href="/sign-in" className={buttonVariants({ variant: "primary", className: "self-start" })}>Send a new link</Link>
    </main>
  );
}
