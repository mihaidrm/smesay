// HTML to PDF for the summary (stories/E10-3): Playwright's Chromium, headless, through
// playwright-core (node_modules/playwright-core/types/types.d.ts, Page.pdf: "generates a pdf of
// the page with print css media"; preferCSSPageSize gives the @page size and margins of
// summary-html.ts priority). The browser comes from the first of these that is there
// (launchPlan; Mihai, 2026-10-12, a 500 on Download PDF with no browser on his machine):
// PLAYWRIGHT_CHROMIUM_PATH when set (this container, CI), Playwright's own download (npx
// playwright install chromium), then the Google Chrome or Microsoft Edge installed on the
// machine (the launch's `channel`, node_modules/playwright-core/types/types.d.ts, "Browser
// distribution channel"). A launch that fails because the executable is missing moves on;
// any other failure is thrown as it is. With none, NoBrowserError names what was tried and
// the export route answers 503 so the Export tab can say so (docs/copy/errors.md). One
// browser per summary, closed after, so nothing stays running between downloads.
// Server-only: no client imports this.
// The page runs no script and loads nothing but data: URLs (BrowserContext javaScriptEnabled and
// page.route, types.d.ts), the print stops after RENDER_TIMEOUT_MS, and at most MAX_RENDERS
// browsers run at once in this process; a further summary waits for one to finish.
import { chromium, type Browser } from "playwright-core";

export type Pdf = { bytes: Buffer; pages: number };

// The number of pages: one "/Type /Page" object per page in the file Chromium writes (the PDF
// 1.7 page objects, ISO 32000-1, 7.7.3.3; "/Type /Pages" is the tree's root and not counted).
// The summary's <title> is fixed (summary-html.ts), so the file's Info dictionary carries no text
// a project or respondent typed that could read as a page object.
export const pageCount = (bytes: Buffer): number => (bytes.toString("latin1").match(/\/Type\s*\/Page(?![a-zA-Z])/g) ?? []).length;

export type LaunchAttempt = { kind: "path"; path: string } | { kind: "download" } | { kind: "channel"; channel: "chrome" | "msedge" };

export function launchPlan(env: { PLAYWRIGHT_CHROMIUM_PATH?: string }): LaunchAttempt[] {
  const path = env.PLAYWRIGHT_CHROMIUM_PATH?.trim();
  return [...(path ? [{ kind: "path" as const, path }] : []), { kind: "download" }, { kind: "channel", channel: "chrome" }, { kind: "channel", channel: "msedge" }];
}

// What each attempt is called in the log line.
export const attemptLabel = (a: LaunchAttempt): string =>
  a.kind === "path" ? "PLAYWRIGHT_CHROMIUM_PATH" : a.kind === "download" ? "Playwright's Chromium" : a.channel === "chrome" ? "Google Chrome" : "Microsoft Edge";

// Playwright's words for a browser that is not there (playwright-core 1.63.0): "Executable
// doesn't exist at [path]" for its download or a given path, "Chromium distribution 'chrome'
// is not found at [path]" for a channel.
export const isMissingBrowser = (e: unknown): boolean => /Executable doesn't exist|distribution '[^']+' is not found/.test(e instanceof Error ? e.message : String(e));

export class NoBrowserError extends Error {
  readonly tried: string[];
  constructor(tried: string[]) {
    super(`No browser for the PDF summary. Tried: ${tried.join(", ")}.`);
    this.name = "NoBrowserError";
    this.tried = tried;
  }
}

export type LaunchOptions = { executablePath?: string; channel?: string; timeout: number };

// The plan, run: `launcher` is chromium.launch, or a stand-in in the unit test.
export async function launchWith<B>(launcher: (options: LaunchOptions) => Promise<B>, env: { PLAYWRIGHT_CHROMIUM_PATH?: string }): Promise<B> {
  const tried: string[] = [];
  for (const attempt of launchPlan(env)) {
    const options = attempt.kind === "path" ? { executablePath: attempt.path } : attempt.kind === "channel" ? { channel: attempt.channel } : {};
    try {
      return await launcher({ ...options, timeout: RENDER_TIMEOUT_MS });
    } catch (e) {
      if (!isMissingBrowser(e)) throw e;
      tried.push(attemptLabel(attempt));
    }
  }
  throw new NoBrowserError(tried);
}

const launch = (): Promise<Browser> => launchWith((options) => chromium.launch(options), { PLAYWRIGHT_CHROMIUM_PATH: process.env.PLAYWRIGHT_CHROMIUM_PATH });

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
  const browser = await launch();
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
