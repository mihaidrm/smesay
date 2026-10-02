// 404 (docs/copy/errors.md, "Everything else"): shown by notFound() anywhere, including the
// switch action's refusal of a workspace id that is not one of the person's memberships
// (stories/E2-3, acceptance 4), and for an unknown address. E11-6 builds the full error pages;
// this file carries the copy until then. Convention: node_modules/next/dist/docs/01-app/
// 03-api-reference/03-file-conventions/not-found.md.
import Link from "next/link";
import { Lockup } from "@/components/brand/mark";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 px-4 py-12">
      <Lockup />
      <h1 className="text-2xl font-medium tracking-tight">This page does not exist.</h1>
      <p className="text-ink-muted">Check the address, or go to your projects.</p>
      <Link href="/app" className="inline-flex h-10 items-center self-start rounded-full border border-ink bg-ink px-5 text-sm font-medium text-white">Go to your projects</Link>
    </main>
  );
}
