// Sign-in page (stories/E2-1): one field, one button. Copy from docs/copy/errors.md, "Sign-in and
// workspace". A signed-in person goes straight to the app. searchParams is a Promise in
// Next.js 16 (decision 0024; nextjs.org/docs/app/api-reference/file-conventions/page).
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { safeNextPath } from "@/lib/safe-path";
import { Lockup } from "@/components/brand/mark";
import { SignInForm } from "./sign-in-form";

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const target = safeNextPath(next);
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) redirect(target);
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-8 px-4 py-12">
      <Lockup />
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-medium tracking-tight">Sign in</h1>
        <p className="text-ink-muted">Enter your email and we send you a link. No password to remember.</p>
      </div>
      <SignInForm next={target} />
    </main>
  );
}
