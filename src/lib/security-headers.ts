// The security headers (stories/E11-5, acceptance 2; SECURITY.md, Headers and transport). Pure, so
// a unit test reads them; src/proxy.ts sets the content security policy on each page with a
// fresh nonce, and next.config.ts sets the fixed headers on every response, static files
// included (node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/
// headers.md).
//
// The policy follows Next's nonce guide (node_modules/next/dist/docs/01-app/02-guides/
// content-security-policy.md, "Adding a nonce with Proxy"): scripts only with the request's
// nonce, and 'strict-dynamic' so the scripts they load run too; Next reads the nonce from the
// request's header and puts it on its own scripts. 'unsafe-eval' only in development, where
// React needs it (same guide). Styles keep 'unsafe-inline': the app sets style attributes
// (charts, the workspace's accent colour), which a nonce cannot cover (a nonce applies to
// elements, not attributes: developer.mozilla.org/docs/Web/HTTP/Reference/Headers/
// Content-Security-Policy/style-src, "Unsafe inline styles"). Every other source is the app's own
// origin: images come from /brand and /assets, fonts are self-hosted by next/font, the live
// updates are same-origin events. frame-ancestors 'self' keeps the builder's preview working:
// it frames the app's own /r/ pages (stories/E5-6, design note 65); any other site cannot frame
// the app. upgrade-insecure-requests only when the app is served over HTTPS, so a local or CI
// server on http://localhost keeps its scripts.

// analytics: Plausible's origin when it is switched on (stories/E13-3): its script loads with
// the nonce like the app's own (with 'strict-dynamic' a script carrying the nonce runs whatever
// its host, and host lists are ignored: developer.mozilla.org/docs/Web/HTTP/Reference/Headers/
// Content-Security-Policy/script-src, "strict-dynamic"), and it sends its counts there, which
// connect-src must allow. The proxy leaves it out on the respondent pages.
export type CspOptions = { nonce: string; dev: boolean; https: boolean; analytics?: string | null };

export function contentSecurityPolicy({ nonce, dev, https, analytics = null }: CspOptions): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data:",
    "font-src 'self'",
    `connect-src 'self'${dev ? " ws:" : ""}${analytics ? ` ${analytics}` : ""}`,
    "frame-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    ...(https ? ["upgrade-insecure-requests"] : []),
  ].join("; ");
}

// The fixed headers, on every response. Values: developer.mozilla.org/docs/Web/HTTP/Reference/
// Headers/ and each header's page.
// - Strict-Transport-Security: two years with subdomains; a browser ignores it over plain HTTP
//   (Strict-Transport-Security page), so localhost is unaffected.
// - X-Content-Type-Options nosniff; Referrer-Policy strict-origin-when-cross-origin (a link's
//   token never leaves in a Referer to another site).
// - Permissions-Policy: camera, microphone, geolocation, payment and USB off; the app uses none.
// - X-Frame-Options SAMEORIGIN, for browsers without frame-ancestors, matching it.
export const FIXED_HEADERS: { key: string; value: string }[] = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
];
