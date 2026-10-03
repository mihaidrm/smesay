// The accent rules shared by the server (src/lib/brand.ts) and the Settings form (stories/
// E2-5, acceptance 2): no server import here. With no accent set the respondent side uses the
// design system's violet 600 (design v2, decision 0041); an accent under WCAG 2.1's 4.5:1 on white (docs/design-system.md,
// Respondent theming; decision 0016; Brand 06) falls back to ink, and Settings says why.
import { contrastRatio } from "@/lib/contrast";

export const DEFAULT_ACCENT = "#6D4CF5";
export const FALLBACK_ACCENT = "#15131F";
export const MIN_CONTRAST = 4.5;
export const HEX = /^#[0-9a-f]{6}$/i;

export const BRAND_COPY = {
  badHex: "Enter the colour as six hex digits, like #1F4F7A.",
  tooLight: "This colour is too light on white, so the respondent page uses the default. Pick a darker one to use yours.",
  saved: "Saved. Your instruments carry the new name, logo and accent.",
  accentUse: "Used on the selected answer, the active chapter and the progress bar. Buttons stay ink.",
  noAccent: "No accent set. The respondent page uses violet.",
};

export function accentContrast(hex: string | null): number | null {
  return hex && HEX.test(hex) ? contrastRatio(hex, "#FFFFFF") : null;
}

export function isReadableAccent(hex: string | null): boolean {
  const ratio = accentContrast(hex);
  return ratio !== null && ratio >= MIN_CONTRAST;
}

// The colour the respondent side paints with: the PM's accent when it reads on white, violet
// when none is set, ink when the accent is too light.
export function effectiveAccent(hex: string | null): string {
  if (hex === null || hex === "") return DEFAULT_ACCENT;
  return isReadableAccent(hex) ? hex.toUpperCase() : FALLBACK_ACCENT;
}
