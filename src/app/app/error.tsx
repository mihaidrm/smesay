"use client";
// The error state of everything under /app, the shell's layout included: an error.tsx wraps the
// segments below it, not its own layout (node_modules/next/dist/docs/01-app/03-api-reference/
// 03-file-conventions/error.md, "does not wrap the layout.js above it in the same segment"), so
// it sits at the /app segment. Copy: the 500 row of docs/copy/errors.md; the support address is
// added by E11-6 with the error pages.
import { Button } from "@/components/ui/button";

export default function AppError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <main className="auth-frame gap-4">
      <h1 className="text-xl font-medium">The server could not finish this request.</h1>
      <p className="text-ink-muted">It has been logged. Try again in a minute.</p>
      <Button variant="secondary" className="self-start" onClick={retry}>Try again</Button>
    </main>
  );
}
