// Renders Mark B (src/components/brand/mark.tsx, the same paths) to a 44 px PNG for the emails'
// 22 px mark (stories/E12-3; docs/design-system.md, Email). PNG because Gmail rasterises SVG and
// PNG works in Gmail, Outlook.com and Apple Mail (caniemail.com/features/image-png/ and
// /image-svg/, tested 2026-09-16). 44 px for screens at twice the density. Run once when the
// mark changes: node scripts/mark-png.mjs (PLAYWRIGHT_CHROMIUM_PATH as for the PDF export).
import { chromium } from "playwright-core";

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 32 32"><rect width="32" height="32" rx="9" fill="#6D4CF5"/><path d="M7 8.5h8v7H10l-3 2.5z" fill="#FFFFFF"/><path d="M17 11.5h8v7h-5l-3 2.5z" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linejoin="round"/></svg>`;
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined });
const page = await browser.newPage({ viewport: { width: 44, height: 44 } });
await page.setContent(`<html><body style="margin:0;background:transparent">${svg}</body></html>`);
await page.locator("svg").screenshot({ path: "public/assets/brand/mark-44.png", omitBackground: true });
await browser.close();
console.log("public/assets/brand/mark-44.png written");
