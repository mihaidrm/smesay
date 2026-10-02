// The accent rules shared by the server (src/lib/brand.ts) and the Settings form (stories/
// E2-5, acceptance 2): no server import here. The threshold is WCAG 2.1's 4.5:1 for text
// (docs/design-system.md, Respondent theming); the fallback is the design system's teal 700.
import { contrastRatio } from "@/lib/contrast";

export const DEFAULT_ACCENT = "#0E6B63";
export const MIN_CONTRAST = 4.5;
export const HEX = /^#[0-9a-f]{6}$/i;

export const BRAND_COPY = {
  badHex: "Enter the colour as six hex digits, like #1F4F7A.",
  tooLight: "This colour is too light on white, so the respondent page uses the default. Pick a darker one to use yours.",
  saved: "Saved. Instruments created from now on carry the new name, logo and accent.",
};

export function accentContrast(hex: string | null): number | null {
  return hex && HEX.test(hex) ? contrastRatio(hex, "#FFFFFF") : null;
}

export function isReadableAccent(hex: string | null): boolean {
  const ratio = accentContrast(hex);
  return ratio !== null && ratio >= MIN_CONTRAST;
}

export function effectiveAccent(hex: string | null): string {
  return isReadableAccent(hex) ? hex!.toUpperCase() : DEFAULT_ACCENT;
}
