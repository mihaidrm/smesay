// The upload limits (stories/E3-2, acceptance 1; SECURITY.md, Data): 5 MB and 2,000 rows. The
// row limit counts the rows below the header of every sheet, whichever sheet or header row the
// PM picks (src/lib/uploads.ts checks at upload and again at each pick).
export const SIZE_MAX = 5 * 1024 * 1024;
export const ROWS_MAX = 2000;
export const PREVIEW_ROWS = 10;

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} bytes`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  // A size just over the limit must not read as the limit ("5 MB. The limit is 5 MB."), so a
  // size within 0.05 MB above it is given in KB, rounded up.
  if (n > SIZE_MAX && Math.round(n / (1024 * 1024) * 10) === Math.round(SIZE_MAX / (1024 * 1024) * 10)) return `${Math.ceil(n / 1024).toLocaleString("en-GB")} KB`;
  return `${(n / (1024 * 1024)).toFixed(1).replace(/\.0$/, "")} MB`;
}
