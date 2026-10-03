// Where better-auth sends a person whose Google sign-in was refused (an unverified email, a
// linking refusal) or cancelled at Google (stories/E2-2, acceptance 3; errorCallbackURL in
// src/app/sign-in/google-button.tsx). The ?error code is not shown: every case gets the one
// message from docs/copy/errors.md.
import Link from "next/link";
import { Lockup } from "@/components/brand/mark";
import { buttonVariants } from "@/components/ui/button";
import { SIGN_IN_COPY } from "@/lib/sign-in-copy";

export default function GoogleFailedPage() {
  return (
    <main className="auth-frame">
      <Lockup />
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-medium tracking-tight">{SIGN_IN_COPY.googleFailedTitle}</h1>
        <p className="text-ink-muted">{SIGN_IN_COPY.googleFailedLine}</p>
      </div>
      <Link href="/sign-in" className={buttonVariants({ variant: "primary", className: "self-start" })}>{SIGN_IN_COPY.googleFailedButton}</Link>
    </main>
  );
}
