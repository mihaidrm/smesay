"use client";
// The error state of every page under /app (CLAUDE.md, PM side). Copy: the 500 row of
// docs/copy/errors.md; the support address is added by E11-6 with the error pages. The file
// convention and the retry prop: node_modules/next/dist/docs/01-app/03-api-reference/
// 03-file-conventions/error.md.
import { Button } from "@/components/ui/button";

export default function AppError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <main className="flex flex-col gap-4 px-8 py-6">
      <h1 className="text-xl font-medium">The server could not finish this request.</h1>
      <p className="text-ink-muted">It has been logged. Try again in a minute.</p>
      <Button variant="secondary" className="self-start" onClick={retry}>Try again</Button>
    </main>
  );
}
