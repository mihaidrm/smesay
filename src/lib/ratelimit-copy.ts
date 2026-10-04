// The words of the rate limits (stories/E11-1; docs/copy/errors.md). No database import, so the
// proxy can use them.
export const RATE_LIMIT_COPY = {
  title: "Too many requests",
  respondent: "Too many requests from your connection. Wait a minute and try again.",
};

// The 429 page of the respondent routes: plain HTML with its own styles, since the proxy answers
// before the app renders: the design tokens of src/app/globals.css (ground, surface, hairline,
// ink), light and dark.
export const limitedPage = () => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${RATE_LIMIT_COPY.title}</title><style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f7f6fb;color:#15131f;font-family:system-ui,sans-serif}main{max-width:28rem;margin:1rem;padding:1.5rem;background:#fff;border:1px solid #e6e3f0;border-radius:1rem}h1{font-size:1.25rem;margin:0 0 .5rem}p{margin:0;line-height:1.5}@media (prefers-color-scheme:dark){body{background:#16152a;color:#f3f1fa}main{background:#1e1d33;border-color:#343252}}</style></head><body><main><h1>${RATE_LIMIT_COPY.title}</h1><p>${RATE_LIMIT_COPY.respondent}</p></main></body></html>`;
