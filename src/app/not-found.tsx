// 404 (docs/copy/errors.md, "Everything else"): shown by notFound() anywhere, including the
// switch action's refusal of a workspace id that is not one of the person's memberships
// (stories/E2-3, acceptance 4), and for an unknown address. E11-6 builds the full error pages;
// this file carries the copy until then. Convention: node_modules/next/dist/docs/01-app/
// 03-api-reference/03-file-conventions/not-found.md.
import Link from "next/link";
import { Lockup } from "@/components/brand/mark";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="auth-frame gap-6">
      <Lockup />
      <h1 className="text-2xl font-medium tracking-tight">This page does not exist.</h1>
      <p className="text-ink-muted">Check the address, or go to your projects.</p>
      <Link href="/app" className={buttonVariants({ className: "self-start" })}>Go to your projects</Link>
    </main>
  );
}
