// The attached file tile on Import's list card (stories/E3-2, changed 2026-10-08; design note
// 119): the words under the file's name. A pasted list has no file, so its line counts the
// items instead of giving a size. Copy: docs/copy/app.md, Import.
import { formatBytes } from "@/lib/import/limits";

export const ATTACHED_COPY = {
  heading: "The list in use",
  hint: "The cards below read this list. Uploading or pasting another one replaces it here.",
  uploaded: (date: string) => `Uploaded ${date}`,
  pasted: (date: string) => `Pasted ${date}`,
};

export function attachedFileMeta(u: { kind: "xlsx" | "csv" | "pasted"; byteSize: number; preview: { rowsRead: number } }): string {
  if (u.kind === "pasted") return `A pasted list, ${u.preview.rowsRead.toLocaleString("en-GB")} ${u.preview.rowsRead === 1 ? "item" : "items"}`;
  return `${u.kind} file, ${formatBytes(u.byteSize)}`;
}
