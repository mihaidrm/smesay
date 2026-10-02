// The upload limits (stories/E3-2, acceptance 1; SECURITY.md, Data): 5 MB and 2,000 rows. The
// row limit counts the rows below the header; parseFile() keeps a few rows more than the limit
// so the check can tell "over" from "exactly at".
export const SIZE_MAX = 5 * 1024 * 1024;
export const ROWS_MAX = 2000;
export const PREVIEW_ROWS = 10;

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} bytes`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1).replace(/\.0$/, "")} MB`;
}
