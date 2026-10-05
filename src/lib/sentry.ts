// Sentry's options (stories/E11-5, acceptances 1 and 4). Read by src/instrumentation.ts only
// when SENTRY_DSN is set; with no DSN nothing here runs and no SDK module is loaded. The region
// is the DSN's: an EU project's DSN points at the EU ingest host (docs/accounts.md step 10).
//
// Version 11 of the SDK collects user identity, cookies, headers, bodies, query values, AI
// inputs and outputs, database query data and local variables unless dataCollection turns each
// off (docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/, dataCollection;
// node_modules/@sentry/core/build/types/types/datacollection.d.ts). Every one is off here, and
// beforeSend (src/lib/scrub.ts) rebuilds each event from an allow-list on top of that.
// Breadcrumbs are dropped (beforeBreadcrumb returning null drops one, same page). No tracing
// sample rate is set, so no performance data is sent.
import type { init } from "@sentry/nextjs";
import { scrubEvent, type ReportEvent } from "@/lib/scrub";

// @sentry/nextjs does not export the DataCollection type itself; this is the init option's type.
type DataCollection = NonNullable<Parameters<typeof init>[0]["dataCollection"]>;

export const DATA_COLLECTION: DataCollection = {
  userInfo: false,
  cookies: false,
  httpHeaders: false,
  httpBodies: [],
  urlQueryParams: false,
  graphQL: { document: false, variables: false },
  genAI: { inputs: false, outputs: false },
  databaseQueryData: false,
  queues: false,
  stackFrameVariables: false,
  frameContextLines: 0,
};

export function sentryOptions(dsn: string, environment: string | undefined) {
  return {
    dsn,
    // Only when set: an undefined value would replace the SDK's own default (SENTRY_ENVIRONMENT,
    // then NODE_ENV; node_modules/@sentry/nextjs/build/cjs/server/index.js).
    ...(environment ? { environment } : {}),
    dataCollection: DATA_COLLECTION,
    maxBreadcrumbs: 0,
    beforeBreadcrumb: () => null,
    beforeSend: <E extends ReportEvent>(event: E) => scrubEvent(event),
  };
}
