// Sign-in page (stories/E2-1, E2-2; design v2): a card on the ground with a soft aurora
// behind it, the lockup, the mascot greeting at the card's corner, the email form and,
// when Google is configured, "Continue with Google" under it. Copy from docs/copy/app.md and
// errors.md, "Sign-in". A signed-in person goes straight to the app. searchParams is a
// Promise in Next.js 16 (decision 0024; nextjs.org/docs/app/api-reference/file-conventions/page).
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth, GOOGLE_ERROR_PATH, readGoogleEnv } from "@/lib/auth";
import { SIGN_IN_COPY } from "@/lib/sign-in-copy";
import { GoogleButton } from "./google-button";
import { safeNextPath } from "@/lib/safe-path";
import { Mascot } from "@/components/app/mascot";
import { Lockup } from "@/components/brand/mark";
import { PlausibleScript } from "@/components/analytics/plausible-script";
import { cleanSource, nextWithSource } from "@/lib/utm";
import { SignInForm } from "./sign-in-form";

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string; utm_source?: string | string[] }> }) {
  const { next, utm_source } = await searchParams;
  // A source from the landing page's link rides through the magic link to the workspace step
  // (stories/E13-3, acceptance 4).
  const target = nextWithSource(safeNextPath(next), cleanSource(utm_source));
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) redirect(target);
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <PlausibleScript />
      <div aria-hidden="true" className="pointer-events-none absolute -top-40 -left-40 size-[520px] rounded-full bg-[radial-gradient(circle,rgba(109,76,245,0.28),rgba(109,76,245,0)_62%)]" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-32 -bottom-40 size-[460px] rounded-full bg-[radial-gradient(circle,rgba(255,107,87,0.22),rgba(255,107,87,0)_60%)]" />
      <div className="card relative flex w-full max-w-md flex-col gap-8 rounded-[20px] p-8">
        <Mascot pose="hi" size={88} className="absolute -top-9 -right-5" />
        <Lockup />
        <div className="flex flex-col gap-2">
          <h1 className="text-[30px] font-extrabold leading-9 tracking-[-0.03em]">Sign in</h1>
          <p className="text-ink-muted">Enter your email and we send you a link. No password to remember.</p>
        </div>
        <SignInForm next={target} />
        {readGoogleEnv(process.env, () => undefined) && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 text-sm text-ink-muted" aria-hidden="true"><span className="h-px flex-grow bg-hairline" />{SIGN_IN_COPY.or}<span className="h-px flex-grow bg-hairline" /></div>
            <GoogleButton next={target} errorPath={GOOGLE_ERROR_PATH} />
          </div>
        )}
      </div>
    </main>
  );
}
