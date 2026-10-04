// HTML to PDF for the summary (stories/E10-3): Playwright's Chromium, headless, through
// playwright-core (node_modules/playwright-core/types/types.d.ts, Page.pdf: "generates a pdf of
// the page with print css media"; preferCSSPageSize gives the @page size and margins of
// summary-html.ts priority). The browser's path comes from PLAYWRIGHT_CHROMIUM_PATH when set
// (this container, CI), else Playwright's own download. One browser per summary, closed after,
// so nothing stays running between downloads. Server-only: no client imports this.
// The page runs no script and loads nothing but data: URLs (BrowserContext javaScriptEnabled and
// page.route, types.d.ts), the print stops after RENDER_TIMEOUT_MS, and at most MAX_RENDERS
// browsers run at once in this process; a further summary waits for one to finish.
import { chromium } from "playwright-core";

export type Pdf = { bytes: Buffer; pages: number };

// The number of pages: one "/Type /Page" object per page in the file Chromium writes (the PDF
// 1.7 page objects, ISO 32000-1, 7.7.3.3; "/Type /Pages" is the tree's root and not counted).
// The summary's <title> is fixed (summary-html.ts), so the file's Info dictionary carries no text
// a project or respondent typed that could read as a page object.
export const pageCount = (bytes: Buffer): number => (bytes.toString("latin1").match(/\/Type\s*\/Page(?![a-zA-Z])/g) ?? []).length;

export const MAX_RENDERS = 2;
export const RENDER_TIMEOUT_MS = 60_000;
let running = 0;
const waiting: (() => void)[] = [];
async function slot<T>(work: () => Promise<T>): Promise<T> {
  if (running >= MAX_RENDERS) await new Promise<void>((go) => waiting.push(go));
  running += 1;
  try {
    return await work();
  } finally {
    running -= 1;
    waiting.shift()?.();
  }
}

// header and footer: Page.pdf's templates, printed in the margins of every page.
export async function renderPdf(html: string, frame?: { header: string; footer: string }): Promise<Pdf> {
  return slot(() => render(html, frame));
}

async function render(html: string, frame?: { header: string; footer: string }): Promise<Pdf> {
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined, timeout: RENDER_TIMEOUT_MS });
  try {
    const context = await browser.newContext({ javaScriptEnabled: false });
    context.setDefaultTimeout(RENDER_TIMEOUT_MS);
    await context.route("**/*", (route) => (route.request().url().startsWith("data:") ? route.continue() : route.abort()));
    const page = await context.newPage();
    await page.setContent(html, { waitUntil: "load" });
    const bytes = await page.pdf({ preferCSSPageSize: true, printBackground: true, tagged: true, ...(frame ? { displayHeaderFooter: true, headerTemplate: frame.header, footerTemplate: frame.footer } : {}) });
    return { bytes, pages: pageCount(bytes) };
  } finally {
    await browser.close();
  }
}
