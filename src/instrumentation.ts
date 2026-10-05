// Error reports (stories/E11-5, acceptances 1 and 4). Next runs register() once when a server
// starts and calls onRequestError for errors it catches on the server (node_modules/next/dist/
// docs/01-app/03-api-reference/03-file-conventions/instrumentation.md). Sentry's setup puts its
// init in register() and exports its captureRequestError as onRequestError
// (docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/, "Register Server-Side
// SDK"). Both load the SDK only when SENTRY_DSN is set: without it, as locally and in CI, no
// Sentry module is imported and the app runs as before (decision 0006). Only the Node.js runtime
// is set up: the app has no edge routes (src/proxy.ts runs on Node.js). Errors in the browser
// are not reported in R1 (docs/review-list.md).
import type { Instrumentation } from "next";

export async function register() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn || process.env.NEXT_RUNTIME !== "nodejs") return;
  const [Sentry, { sentryOptions }] = await Promise.all([import("@sentry/nextjs"), import("@/lib/sentry")]);
  Sentry.init(sentryOptions(dsn, process.env.SENTRY_ENVIRONMENT));
}

export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  if (!process.env.SENTRY_DSN) return;
  const Sentry = await import("@sentry/nextjs");
  Sentry.captureRequestError(error, request, context);
};
