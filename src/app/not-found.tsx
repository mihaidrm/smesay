// 404 (stories/E11-6, acceptance 1; docs/copy/errors.md, "Everything else"): shown by notFound()
// anywhere outside a respondent link, including the switch action's refusal of a workspace id
// that is not one of the person's memberships (stories/E2-3, acceptance 4), and for an unknown
// address. Convention: node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/
// not-found.md.
import Link from "next/link";
import { Lockup } from "@/components/brand/mark";
import { buttonVariants } from "@/components/ui/button";
import { ERROR_PAGE_COPY } from "@/lib/error-pages-copy";

export default function NotFound() {
  return (
    <main className="auth-frame gap-6">
      <Lockup />
      <h1 className="text-2xl font-medium tracking-tight">{ERROR_PAGE_COPY.notFoundTitle}</h1>
      <p className="text-ink-muted">{ERROR_PAGE_COPY.notFoundLine}</p>
      <Link href="/app" className={buttonVariants({ className: "self-start" })}>{ERROR_PAGE_COPY.goToProjects}</Link>
    </main>
  );
}
