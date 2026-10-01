// WCAG 2.1 contrast ratio between two sRGB colours given as #RRGGBB.
// Relative luminance and the (L1 + 0.05) / (L2 + 0.05) ratio as defined in WCAG 2.1,
// https://www.w3.org/TR/WCAG21/#dfn-relative-luminance and #dfn-contrast-ratio.
// The design system's contrast figures (docs/design-system.md, Colour) are computed with this.

function channel(v: number): number {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

export function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) throw new Error(`Not a #RRGGBB colour: ${hex}`);
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

// Rounded to two decimals, the way the design system prints it.
export function contrastLabel(a: string, b: string): string {
  return contrastRatio(a, b).toFixed(2);
}
