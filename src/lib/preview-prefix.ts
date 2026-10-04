// The preview token's prefix (stories/E5-6), on its own so the respondent app's client code
// can tell a preview token apart without importing node:crypto (src/lib/preview-token.ts).
export const PREVIEW_PREFIX = "p.";
export const isPreviewToken = (token: string): boolean => token.startsWith(PREVIEW_PREFIX);
