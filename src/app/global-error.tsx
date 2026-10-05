"use client";
// An error in the root layout itself (stories/E11-6, acceptance 1): global-error replaces the
// root layout, so it brings its own html and body, the global styles, and a title, since it
// cannot export metadata (node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/
// error.md, "global-error"). The mode script does not run here, so the page is always in the
// light tokens, and the font falls back to the system sans-serif (the root layout's next/font
// variables are not set here).
import "./globals.css";
import { ServerError } from "@/components/app/server-error";
import { ERROR_PAGE_COPY } from "@/lib/error-pages-copy";

export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <title>{ERROR_PAGE_COPY.serverTitle}</title>
        <ServerError retry={retry} logged={Boolean(error.digest)} />
      </body>
    </html>
  );
}
