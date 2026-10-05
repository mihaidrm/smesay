"use client";
// The error boundary of a respondent link (stories/E6-1; E11-6 builds the full error
// pages): a page in the product's words when the link cannot be read, with Try again,
// which re-fetches the page (retry, node_modules/next/dist/docs/01-app/03-api-reference/
// 03-file-conventions/error.md; the app's own src/app/app/error.tsx does the same). In the
// respondent frame (decision 0052): a centered card from 576 px, Try again in its bottom band.
import { cn } from "cn";
import { Mark } from "@/components/brand/mark";
import { ModeButton } from "@/components/respondent/mode-button";
import { FRAME_ACTIONS, FRAME_CARD, FRAME_HEADER, FRAME_OUTER, FRAME_PRIMARY } from "@/components/respondent/frame";
import { LINK_PAGE_COPY } from "@/lib/sharing-copy";

export default function LinkError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div className={cn(FRAME_OUTER, "mx-auto w-full max-w-[752px]")} data-testid="link-error">
      <div className={FRAME_CARD}>
      <header className={cn("flex items-center gap-2.5 border-b border-hairline bg-surface px-5 pt-4 pb-3", FRAME_HEADER)}>
        <span className="inline-flex grow items-center gap-2 text-[15px] font-bold"><Mark size={22} /> SMEsay</span><ModeButton />
      </header>
      <main className="flex w-full grow flex-col gap-4 px-5 pt-6 pb-8 @xl:px-8">
        <h1 className="text-[22px] leading-7 font-extrabold tracking-[-0.025em]">{LINK_PAGE_COPY.errorTitle}</h1>
        <p className="text-[17px] leading-[26px] text-ink-muted">{LINK_PAGE_COPY.errorLine}</p>
      </main>
      <div className={FRAME_ACTIONS}>
        <button type="button" onClick={retry} className={cn("h-12 self-start rounded-full bg-ink px-6 text-base font-bold text-ground focus:outline-hidden focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface @xl:self-center", FRAME_PRIMARY)}>{LINK_PAGE_COPY.tryAgain}</button>
      </div>
      </div>
    </div>
  );
}
