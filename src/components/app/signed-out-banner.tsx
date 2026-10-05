"use client";
// The banner on a PM form whose save found the session ended (stories/E11-6, acceptance 3;
// docs/copy/errors.md, "Session expired"). The form stays as typed; sign-in opens in a new tab
// with this page as where to go back to, so nothing on this page is lost, and the draft is in
// the tab's session storage (use-draft.ts) for a reload.
import { usePathname } from "next/navigation";
import { ERROR_PAGE_COPY } from "@/lib/error-pages-copy";

export function SignedOutBanner() {
  const path = usePathname();
  return (
    <div role="alert" data-testid="signed-out" className="flex flex-wrap items-center gap-3 rounded-lg border border-sun bg-sun-soft px-3 py-2 text-sm text-sun-text">
      <span>{ERROR_PAGE_COPY.signedOut}</span>
      <a href={`/sign-in?next=${encodeURIComponent(path)}`} target="_blank" rel="noopener" className="font-semibold underline underline-offset-4">{ERROR_PAGE_COPY.signIn}</a>
    </div>
  );
}
