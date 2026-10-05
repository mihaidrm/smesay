// The words of the error pages, the maintenance page and the signed-out banner (stories/E11-6;
// docs/copy/errors.md, Everything else). No database import, so the proxy and client error
// boundaries can use them.
//
// The support address: NEXT_PUBLIC_SUPPORT_EMAIL, read at build time so the client error pages
// have it (node_modules/next/dist/docs/01-app/02-guides/environment-variables.md, "Bundling
// Environment Variables for the Browser"); until the domain is bought the placeholder is the
// landing page's address, shown as text (docs/copy/landing.md).
export const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "hello@smesay.app";

// The maintenance window in minutes, from MAINTENANCE_MINUTES; 30 when it is not a whole number.
export const maintenanceMinutes = (value: string | undefined) => (/^\d+$/.test(value ?? "") && Number(value) > 0 ? Number(value) : 30);

export const ERROR_PAGE_COPY = {
  notFoundTitle: "This page does not exist.",
  notFoundLine: "Check the address, or go to your projects.",
  goToProjects: "Go to your projects",
  serverTitle: "The server could not finish this request.",
  serverLine: `It has been logged. Try again in a minute; if it keeps failing, email ${SUPPORT_EMAIL}.`,
  tryAgain: "Try again",
  respondentNotFoundTitle: "This page does not exist.",
  respondentNotFoundLine: "Check the link you were sent, or ask the person who sent it for a new one.",
  maintenanceTitle: "SMEsay is being updated",
  maintenanceLine: (minutes: number) => `SMEsay is being updated and is back within ${minutes} minutes. Respondent links keep their saved answers.`,
  signedOut: "You were signed out. Sign in again; what you typed on this page is kept.",
  signIn: "Sign in again",
  draftBack: "What you typed before you were signed out is back. Save to keep it.",
};

// The maintenance page: plain HTML with its own styles, like the 429 page (src/lib/ratelimit-copy.ts),
// since the proxy answers before the app renders.
export const maintenancePage = (minutes: number) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${ERROR_PAGE_COPY.maintenanceTitle}</title><style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f7f6fb;color:#15131f;font-family:system-ui,sans-serif}main{max-width:28rem;margin:1rem;padding:1.5rem;background:#fff;border:1px solid #e6e3f0;border-radius:1rem}h1{font-size:1.25rem;margin:0 0 .5rem}p{margin:0;line-height:1.5}@media (prefers-color-scheme:dark){body{background:#16152a;color:#f3f1fa}main{background:#1e1d33;border-color:#343252}}</style></head><body><main><h1>${ERROR_PAGE_COPY.maintenanceTitle}</h1><p>${ERROR_PAGE_COPY.maintenanceLine(minutes)}</p></main></body></html>`;
