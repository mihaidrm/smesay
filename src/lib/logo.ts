// Logo validation by content, not extension (stories/E2-5, acceptance 1 and 4). PNG: the eight
// byte signature 89 50 4E 47 0D 0A 1A 0A (w3.org/TR/png-3/#5PNG-file-signature). SVG: the text
// is an XML document whose root element is svg (w3.org/TR/SVG2/struct.html#SVGElement). An SVG
// is refused, not cleaned, when, after numeric character references are decoded, it contains
// a script element (any namespace prefix), an event handler attribute, a javascript: or data:
// reference, a foreignObject, or an animate or set element aimed at an href; a cleaned file
// would not be the one the person uploaded. This is a filter on text, not a parser: the logo
// is shown through an img element and served under a sandbox policy with no sources, so a
// file that slips the filter still runs nothing (src/app/brand/[workspaceId]/logo/route.ts).
// Up to LOGO_MAX_BYTES (1 MB).
export const LOGO_MAX_BYTES = 1024 * 1024;

export type LogoKind = "png" | "svg";
export type LogoCheck = { ok: true; kind: LogoKind; contentType: "image/png" | "image/svg+xml" } | { ok: false; error: string };

export const LOGO_COPY = {
  tooBig: "The logo is over 1 MB. Export a smaller PNG or SVG and try again.",
  notImage: "The file is not a PNG or an SVG. Export the logo as one of those and try again.",
  scripted: "The SVG contains a script or an event handler, so it was refused. Export it again without them.",
};

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const SVG_ROOT = /^(?:\s|<\?xml[^>]*\?>|<!--[\s\S]*?-->|<!DOCTYPE[^>]*>)*<svg[\s>]/i;
const SVG_ACTIVE = [
  /<\/?(?:[a-z0-9_.-]+:)?script[\s>\/]/i,
  /[\s"'<]on[a-z]+\s*=/i,
  /javascript\s*:/i,
  /data\s*:/i,
  /<(?:[a-z0-9_.-]+:)?foreignObject[\s>\/]/i,
  /<(?:[a-z0-9_.-]+:)?(?:animate|set)\b[^>]*attributeName\s*=\s*["']?(?:xlink:)?href/i,
];

// &#106; and &#x6A; become their characters, so a reference cannot hide a keyword.
export function decodeNumericReferences(text: string): string {
  return text.replace(/&#x([0-9a-f]+);?/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);?/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)));
}

export function checkLogo(bytes: Uint8Array): LogoCheck {
  if (bytes.length > LOGO_MAX_BYTES) return { ok: false, error: LOGO_COPY.tooBig };
  if (bytes.length >= PNG_SIGNATURE.length && PNG_SIGNATURE.every((b, i) => bytes[i] === b)) return { ok: true, kind: "png", contentType: "image/png" };
  const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  if (SVG_ROOT.test(text)) {
    const decoded = decodeNumericReferences(text);
    if (SVG_ACTIVE.some((rule) => rule.test(decoded))) return { ok: false, error: LOGO_COPY.scripted };
    return { ok: true, kind: "svg", contentType: "image/svg+xml" };
  }
  return { ok: false, error: LOGO_COPY.notImage };
}
