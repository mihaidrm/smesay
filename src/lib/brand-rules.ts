// The accent rules shared by the server (src/lib/brand.ts) and the Settings form (stories/
// E2-5, acceptance 2): no server import here. With no accent set the respondent side uses the
// design system's violet 600 (design v2, decision 0041); an accent under WCAG 2.1's 4.5:1 on
// white (docs/design-system.md, Respondent theming; decision 0016; Brand 06) falls back to
// ink, and Settings says why.
import type { PlanKey } from "@/db/types";
import { contrastRatio, hexToRgb } from "@/lib/contrast";

export const DEFAULT_ACCENT = "#6D4CF5";
export const FALLBACK_ACCENT = "#15131F";
export const MIN_CONTRAST = 4.5;
export const HEX = /^#[0-9a-f]{6}$/i;

export const BRAND_COPY = {
  badHex: "Enter the colour as six hex digits, like #1F4F7A.",
  tooLight: "This colour is too light on white, so the respondent page uses the default. Pick a darker one to use yours.",
  saved: "Saved. Your validations carry the new name, logo and accent.",
  accentUse: "The accent colours the selected answer, the active chapter, the progress bar, the confidence picked and the initials shown when there is no logo. Buttons stay ink.",
  noAccent: "No accent set. The respondent page uses violet.",
  pick: "Pick a colour",
  clear: "Clear",
};

// "Powered by SMEsay" on the respondent side and in the Build preview (stories/E7-7,
// acceptance 5; docs/design-system.md, Identity): while the workspace is on the Free plan.
export const showsPoweredBy = (plan: PlanKey): boolean => plan === "free";

// The picker beside the hex field (design note 104, Mihai 2026-10-07: "accent color in brand
// needs to open a color picker"). An input of type color always holds a 7-character lowercase
// hex and is never empty (developer.mozilla.org/docs/Web/HTML/Element/input/color, Value), so
// the two sides are kept in sync by these two: the text as typed to the picker's value (null
// while the text is not a colour yet, so the picker keeps the last valid one; the default
// violet when the field is empty, which is what the respondent page then uses), and a picked
// value to the text in upper case, as the server stores it (src/lib/brand.ts).
export function pickerValue(text: string): string | null {
  const trimmed = text.trim();
  if (trimmed === "") return DEFAULT_ACCENT.toLowerCase();
  return HEX.test(trimmed) ? trimmed.toLowerCase() : null;
}

export function pickedHex(value: string): string {
  return value.trim().toUpperCase();
}

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

// On dark (stories/E7-7, acceptance 4; docs/design-system.md, Respondent theming): the accent
// "lifted two steps". The design system pins two lifts: violet 600 #6D4CF5 to violet 400
// #9B86FF, and design note 33's #1F4F7A to #6FA8E6; both land near OKLCH lightness 0.7. So
// the rule built raises the accent to OKLCH lightness 0.72 with its hue, its chroma lowered
// only as far as sRGB needs (OKLab and its matrices: bottosson.github.io/posts/oklab; OKLCH
// in CSS Color 4: w3.org/TR/css-color-4/#ok-lab). #1F4F7A gives #78A9DA. SMEsay's own
// colours, violet 600 (no accent set) and ink (an accent too light on white), take violet
// 400 as the design system names it. The rule is Claude's reading
// (docs/review-list.md). It is drawn with the dark ink on it; a lift that still reads under
// 4.5:1 against the dark surface or the dark ink falls back to violet 400.
export const DARK_SURFACE = "#1E1D33";
export const ON_DARK_ACCENT = "#16152A";
export const DARK_FALLBACK_ACCENT = "#9B86FF";
export const DARK_LIGHTNESS = 0.72;

const toLinear = (c: number) => { const v = c / 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
const toGamma = (v: number) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);
function toOklab([r8, g8, b8]: [number, number, number]): [number, number, number] {
  const [r, g, b] = [toLinear(r8), toLinear(g8), toLinear(b8)];
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
}
function fromOklab([L, a, b]: [number, number, number]): [number, number, number] {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
}
const inGamut = (rgb: number[]) => rgb.every((v) => v >= -1e-6 && v <= 1 + 1e-6);
export function liftAccent(hex: string): string {
  const [L, a, b] = toOklab(hexToRgb(hex));
  const hue = Math.atan2(b, a);
  const lightness = Math.max(L, DARK_LIGHTNESS);
  let chroma = Math.hypot(a, b);
  while (chroma > 0 && !inGamut(fromOklab([lightness, chroma * Math.cos(hue), chroma * Math.sin(hue)]))) chroma -= 0.001;
  const rgb = fromOklab([lightness, Math.max(chroma, 0) * Math.cos(hue), Math.max(chroma, 0) * Math.sin(hue)]);
  return `#${rgb.map((v) => Math.round(Math.min(1, Math.max(0, toGamma(v))) * 255).toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}
export function darkAccent(hex: string): string {
  if (hex.toUpperCase() === DEFAULT_ACCENT || hex.toUpperCase() === FALLBACK_ACCENT) return DARK_FALLBACK_ACCENT;
  const lifted = liftAccent(hex);
  return contrastRatio(lifted, DARK_SURFACE) >= MIN_CONTRAST && contrastRatio(lifted, ON_DARK_ACCENT) >= MIN_CONTRAST ? lifted : DARK_FALLBACK_ACCENT;
}

// The two values as CSS custom properties, for the classes ACCENT_FILL and ACCENT_BAR: the
// light accent with white on it, and on dark the lifted one with the dark ink on it
// (Tailwind's bg-(--name) form: tailwindcss.com/docs/background-color, custom property).
export function accentVars(accent: string): Record<"--brand-accent" | "--brand-accent-dark", string> {
  return { "--brand-accent": accent, "--brand-accent-dark": darkAccent(accent) };
}
// The names are SMEsay's own: --accent is the UI kit's theme variable (src/app/globals.css). The
// text on the fill is the design system's on-violet: white, and the dark ink on dark.
export const ACCENT_FILL = "bg-(--brand-accent) text-on-violet dark:bg-(--brand-accent-dark)";
export const ACCENT_BAR = "bg-(--brand-accent) dark:bg-(--brand-accent-dark)";
