"use client";
// The error state of a part of Results (stories/E8-1, acceptance 5): the strip and each tab
// fail on their own, with a banner naming the part and Try again, which re-renders it
// (catchError's retry: node_modules/next/dist/docs/01-app/03-api-reference/04-functions/
// catchError.md; redirect() and notFound() pass through). Copy: docs/copy/errors.md, Results.
import { catchError, type ErrorInfo } from "next/error";
import { Banner, bannerButtonClass } from "@/components/ui/banner";
import { RESULTS_COPY } from "@/lib/results-copy";

export function ResultsFailed({ what, onRetry }: { what: string; onRetry: () => void }) {
  return (
    <Banner action={<button type="button" onClick={onRetry} className={bannerButtonClass}>{RESULTS_COPY.tryAgain}</button>} data-testid="results-failed">
      {RESULTS_COPY.failed(what)}
    </Banner>
  );
}

function Fallback({ what }: { what: string; children?: React.ReactNode }, { retry }: ErrorInfo) {
  return <ResultsFailed what={what} onRetry={() => retry()} />;
}

export const ResultsBoundary = catchError(Fallback);
