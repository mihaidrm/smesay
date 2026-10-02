// Logo validation by content, not extension (stories/E2-5, acceptance 1 and 4). PNG: the eight
// byte signature 89 50 4E 47 0D 0A 1A 0A (w3.org/TR/png-3/#5PNG-file-signature). SVG: the text
// is an XML document whose root element is svg (w3.org/TR/SVG2/struct.html#SVGElement) and that
// carries no script element, event handler attribute or javascript: reference; such a file is
// refused rather than cleaned, because a cleaned SVG is a different file from the one the
// person uploaded. Up to LOGO_MAX_BYTES (1 MB).
export const LOGO_MAX_BYTES = 1024 * 1024;

export type LogoKind = "png" | "svg";
export type LogoCheck = { ok: true; kind: LogoKind; contentType: "image/png" | "image/svg+xml" } | { ok: false; error: string };

export const LOGO_COPY = {
  tooBig: "The logo is over 1 MB. Export a smaller PNG or SVG and try again.",
  notImage: "The file is not a PNG or an SVG. Export the logo as one of those and try again.",
  scripted: "The SVG contains a script or an event handler, so it was refused. Export it again without them.",
  empty: "Choose a PNG or SVG file first.",
};

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const SVG_ROOT = /^(?:\s|<\?xml[^>]*\?>|<!--[\s\S]*?-->|<!DOCTYPE[^>]*>)*<svg[\s>]/i;
const SVG_SCRIPT = /<script[\s>]|\son[a-z]+\s*=|javascript:|<foreignObject[\s>]/i;

export function checkLogo(bytes: Uint8Array): LogoCheck {
  if (bytes.length === 0) return { ok: false, error: LOGO_COPY.empty };
  if (bytes.length > LOGO_MAX_BYTES) return { ok: false, error: LOGO_COPY.tooBig };
  if (PNG_SIGNATURE.every((b, i) => bytes[i] === b)) return { ok: true, kind: "png", contentType: "image/png" };
  const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes.subarray(0, 64 * 1024));
  if (SVG_ROOT.test(text)) {
    const whole = bytes.length > 64 * 1024 ? new TextDecoder().decode(bytes) : text;
    if (SVG_SCRIPT.test(whole)) return { ok: false, error: LOGO_COPY.scripted };
    return { ok: true, kind: "svg", contentType: "image/svg+xml" };
  }
  return { ok: false, error: LOGO_COPY.notImage };
}
