"use client";
// An error in the root layout itself (stories/E11-6, acceptance 1): global-error replaces the
// root layout, so it brings its own html and body, the global styles, and a title, since it
// cannot export metadata (node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/
// error.md, "global-error"). The mode script does not run here; the page follows the system's
// light or dark setting through the tokens' media query.
import "./globals.css";
import { ServerError } from "@/components/app/server-error";
import { ERROR_PAGE_COPY } from "@/lib/error-pages-copy";

export default function GlobalError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <title>{ERROR_PAGE_COPY.serverTitle}</title>
        <ServerError retry={retry} />
      </body>
    </html>
  );
}
