// HTML to PDF for the summary (stories/E10-3): Playwright's Chromium, headless, through
// playwright-core (node_modules/playwright-core/types/types.d.ts, Page.pdf: "generates a pdf of
// the page with print css media"; preferCSSPageSize gives the @page size and margins of
// summary-html.ts priority). The browser's path comes from PLAYWRIGHT_CHROMIUM_PATH when set
// (this container, CI), else Playwright's own download. One browser per summary, closed after,
// so nothing stays running between downloads. Server-only: no client imports this.
import { chromium } from "playwright-core";

export type Pdf = { bytes: Buffer; pages: number };

// The number of pages: one "/Type /Page" object per page in the file Chromium writes (the PDF
// 1.7 page objects, ISO 32000-1, 7.7.3.3; "/Type /Pages" is the tree's root and not counted).
export const pageCount = (bytes: Buffer): number => (bytes.toString("latin1").match(/\/Type\s*\/Page(?![a-zA-Z])/g) ?? []).length;

// header and footer: Page.pdf's templates, printed in the margins of every page.
export async function renderPdf(html: string, frame?: { header: string; footer: string }): Promise<Pdf> {
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    const bytes = await page.pdf({ preferCSSPageSize: true, printBackground: true, tagged: true, ...(frame ? { displayHeaderFooter: true, headerTemplate: frame.header, footerTemplate: frame.footer } : {}) });
    return { bytes, pages: pageCount(bytes) };
  } finally {
    await browser.close();
  }
}
