"use client";
// The error boundary of a respondent link (stories/E6-1; E11-6 builds the full error
// pages): a page in the product's words when the link cannot be read, with Try again,
// which re-fetches the page (retry, node_modules/next/dist/docs/01-app/03-api-reference/
// 03-file-conventions/error.md; the app's own src/app/app/error.tsx does the same).
import { Mark } from "@/components/brand/mark";
import { LINK_PAGE_COPY } from "@/lib/sharing-copy";

export default function LinkError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div className="flex min-h-screen flex-col bg-ground text-ink" data-testid="link-error">
      <header className="flex items-center gap-2.5 border-b border-hairline bg-surface px-5 pt-4 pb-3">
        <span className="inline-flex items-center gap-2 text-[15px] font-bold"><Mark size={22} /> SMEsay</span>
      </header>
      <main className="mx-auto flex w-full max-w-[560px] grow flex-col gap-4 px-5 pt-6 pb-8">
        <h1 className="text-[22px] leading-7 font-extrabold tracking-[-0.025em]">{LINK_PAGE_COPY.errorTitle}</h1>
        <p className="text-[17px] leading-[26px] text-ink-muted">{LINK_PAGE_COPY.errorLine}</p>
        <button type="button" onClick={retry} className="h-12 self-start rounded-full bg-ink px-6 text-base font-bold text-ground">{LINK_PAGE_COPY.tryAgain}</button>
      </main>
    </div>
  );
}
