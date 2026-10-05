"use client";
// The 500 page's body (stories/E11-6, acceptance 1; docs/copy/errors.md, "Everything else"),
// shared by src/app/error.tsx, src/app/app/error.tsx and src/app/global-error.tsx. retry
// re-fetches and re-renders the segment (node_modules/next/dist/docs/01-app/03-api-reference/
// 03-file-conventions/error.md, "retry").
import { Lockup } from "@/components/brand/mark";
import { Button } from "@/components/ui/button";
import { ERROR_PAGE_COPY } from "@/lib/error-pages-copy";

export function ServerError({ retry }: { retry: () => void }) {
  return (
    <main className="auth-frame gap-4" data-testid="server-error">
      <Lockup />
      <h1 className="text-xl font-medium">{ERROR_PAGE_COPY.serverTitle}</h1>
      <p className="text-ink-muted">{ERROR_PAGE_COPY.serverLine}</p>
      <Button variant="secondary" className="self-start" onClick={retry}>{ERROR_PAGE_COPY.tryAgain}</Button>
    </main>
  );
}
