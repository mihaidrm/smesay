"use client";
// The error state of a part of Results (stories/E8-1, acceptance 5): the strip and each tab
// fail on their own, with a banner naming the part and Try again, which re-renders it
// (catchError's retry: node_modules/next/dist/docs/01-app/03-api-reference/04-functions/
// catchError.md; redirect() and notFound() pass through). Copy: docs/copy/errors.md, Results.
import Link from "next/link";
import { catchError, type ErrorInfo } from "next/error";
import { Banner, bannerButtonClass } from "@/components/ui/banner";
import { buttonVariants } from "@/components/ui/button";
import { RESULTS_COPY } from "@/lib/results-copy";

export function ResultsFailed({ what, onRetry }: { what: string; onRetry: () => void }) {
  return (
    <Banner action={<button type="button" onClick={onRetry} className={bannerButtonClass}>{RESULTS_COPY.tryAgain}</button>} data-testid="results-failed">
      {RESULTS_COPY.failed(what)}
    </Banner>
  );
}

// `back`: a way out when the part stands in place of the tabs (the item detail, E8-5).
function Fallback({ what, back }: { what: string; back?: { href: string; label: string }; children?: React.ReactNode }, { retry }: ErrorInfo) {
  if (!back) return <ResultsFailed what={what} onRetry={() => retry()} />;
  return (
    <div className="flex flex-col gap-3">
      <div><Link href={back.href} scroll={false} className={buttonVariants({ variant: "secondary", size: "small" })} data-testid="detail-close">{back.label}</Link></div>
      <ResultsFailed what={what} onRetry={() => retry()} />
    </div>
  );
}

export const ResultsBoundary = catchError(Fallback);
