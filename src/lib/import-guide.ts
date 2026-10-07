// The guide through the Import page (design note 110; Mihai, 2026-10-07: "keep each section
// collapsed ... and we guide the user through them"). The page's cards are collapsible
// (src/components/app/collapsible-card.tsx); the card whose work comes next is open and the
// others are closed with a one-line summary. Pure: the page reads the stage from its data and
// this gives the open cards and the summaries. Copy: docs/copy/app.md, Import.
import { CONTEXT_MAX, contextCount } from "@/lib/project-context";

// noList: nothing uploaded or pasted yet. mapping: an upload without a text column picked
// (or an empty sheet). ready: the mapping has a text column and the check can run. imported:
// the latest upload is the latest version.
export type ImportStage = "noList" | "mapping" | "ready" | "imported";

export type ImportCards = { versions: boolean; about: boolean; list: boolean; preview: boolean; mapping: boolean; check: boolean };

export function importStage(d: { hasUpload: boolean; mappingReady: boolean; imported: boolean }): ImportStage {
  if (!d.hasUpload) return "noList";
  if (d.imported) return "imported";
  return d.mappingReady ? "ready" : "mapping";
}

// Which cards open at a stage. canUpload is false on the sample project, which has no list
// card: About is then the one card with work in it.
export function openCards(stage: ImportStage, { canUpload = true }: { canUpload?: boolean } = {}): ImportCards {
  const none: ImportCards = { versions: false, about: false, list: false, preview: false, mapping: false, check: false };
  switch (stage) {
    case "noList": return { ...none, list: canUpload, about: !canUpload };
    case "mapping": return { ...none, preview: true, mapping: true };
    case "ready": return { ...none, check: true };
    case "imported": return { ...none, versions: true };
  }
}

const n = (x: number) => x.toLocaleString("en-GB");

export const IMPORT_CARD_COPY = {
  versions: { title: "Versions", summary: (version: number, items: number) => `Version ${version}, ${n(items)} ${items === 1 ? "item" : "items"}` },
  about: {
    title: "About this project",
    summary: (goal: string, terms: string) => (goal.trim() === "" && terms.trim() === "" ? "Nothing written yet" : contextCount(goal.trim(), terms.trim())),
    max: CONTEXT_MAX,
  },
  list: { title: "The list", summary: (filename: string | null) => filename ?? "No list yet" },
  preview: {
    title: "Preview",
    summary: (p: { kind: "xlsx" | "csv" | "pasted"; rows: number; headerRow: number | null }) =>
      p.kind === "pasted" ? `${n(p.rows)} ${p.rows === 1 ? "item" : "items"}` : `${n(p.rows)} ${p.rows === 1 ? "row" : "rows"}, ${p.headerRow ? `header on row ${p.headerRow}` : "no header row"}`,
  },
  mapping: {
    title: "Column mapping",
    summary: (mapped: number, columns: number, hasText: boolean) => (hasText ? `${n(mapped)} of ${n(columns)} columns mapped` : "No text column yet"),
  },
  check: {
    title: "Check before import",
    summary: (items: number | null, importedVersion: number | null) =>
      importedVersion !== null ? `Imported as version ${importedVersion}` : items === null ? "Waiting for the text column" : `${n(items)} ${items === 1 ? "item" : "items"} ready`,
  },
} as const;
