// The check before import and the commit (stories/E3-5). checkUpload() re-reads the stored
// file (the preview holds ten rows only), applies the upload's mapping and runs the pure
// check (src/lib/import/report.ts); commitUpload() runs the same check again and writes the
// set in one transaction (src/db/queries/importCommit.ts), so the stored report is the one
// the PM saw. Messages: docs/copy/app.md and errors.md, Import.
import { items, itemSets, uploads } from "@/db/queries";
import type { ItemSetVersion } from "@/db/queries/itemSets";
import { diffLine, diffVersions, type DiffCounts } from "@/lib/import/diff";
import { commitImport } from "@/db/queries/importCommit";
import type { ItemSet } from "@/db/queries/itemSets";
import type { Upload } from "@/db/queries/uploads";
import type { WorkspaceId } from "@/db/types";
import { NotFoundError } from "@/lib/errors";
import { mappingError } from "@/lib/import/mapping";
import { parseFile } from "@/lib/import/parse";
import { checkRows, type CheckResult } from "@/lib/import/report";
import { getObject } from "@/lib/storage";

export const IMPORT_COPY = {
  logTitle: "Versions",
  diff: (text: string, from: number, to: number) => `Version ${from} to ${to}: ${text}.`,
  button: (n: number) => `Import ${n.toLocaleString("en-GB")} ${n === 1 ? "item" : "items"}`,
  nothing: "Nothing to import: every row is empty in the item text column.",
  imported: (n: number, version: number, date: string) => `Imported ${n.toLocaleString("en-GB")} ${n === 1 ? "item" : "items"} as version ${version} on ${date}.`,
  counts: (r: { emptyRows: number; exactDuplicates: number; overLimit: number; unrecognisedValues: number }) => ({
    empty: `${r.emptyRows.toLocaleString("en-GB")} empty ${r.emptyRows === 1 ? "row" : "rows"}, skipped.`,
    duplicates: `${r.exactDuplicates.toLocaleString("en-GB")} exact ${r.exactDuplicates === 1 ? "duplicate" : "duplicates"}, imported once.`,
    long: `${r.overLimit.toLocaleString("en-GB")} ${r.overLimit === 1 ? "item" : "items"} over 1,000 characters, imported whole; consider splitting them in Shape.`,
    values: `${r.unrecognisedValues.toLocaleString("en-GB")} proposed ${r.unrecognisedValues === 1 ? "value" : "values"} not recognised, kept as written.`,
  }),
};

export async function checkUpload(upload: Upload): Promise<CheckResult | null> {
  if (!upload.mapping || mappingError(upload.mapping)) return null;
  const object = await getObject(upload.objectKey);
  if (!object) throw new NotFoundError();
  const parsed = await parseFile(upload.kind, object.body);
  const sheet = parsed.sheets.find((s) => s.name === upload.sheet) ?? parsed.sheets[0];
  if (!sheet) return null;
  const rows = sheet.rows.slice(upload.headerRow ?? 0);
  return checkRows(upload.preview.columns, upload.mapping, rows, (upload.headerRow ?? 0) + 1, upload.headerRow);
}

export async function commitUpload(ws: WorkspaceId, uploadId: string, userId: string): Promise<{ error: string } | { set: ItemSet }> {
  const upload = await uploads.get(ws, uploadId);
  if (!upload) throw new NotFoundError();
  const check = await checkUpload(upload);
  if (!check) return { error: mappingError(upload.mapping ?? {}) ?? IMPORT_COPY.nothing };
  if (check.items.length === 0) return { error: IMPORT_COPY.nothing };
  const set = await commitImport(ws, {
    projectId: upload.projectId, uploadId: upload.id, source: upload.kind, filename: upload.kind === "pasted" ? null : upload.filename,
    report: check.report, userId,
    items: check.items.map((it) => ({ ref: it.ref, text: it.text, area: it.area, value: it.value, custom: it.custom })),
  });
  if (!set) throw new NotFoundError();
  return { set };
}

// The import log (stories/E3-6, acceptance 2): every version of the project with its counts,
// and the diff between the two latest versions as counts (acceptance 4).
export async function importLog(ws: WorkspaceId, projectId: string): Promise<{ versions: ItemSetVersion[]; diff: DiffCounts | null; diffText: string | null }> {
  const versions = await itemSets.versions(ws, projectId);
  if (versions.length < 2) return { versions, diff: null, diffText: null };
  const [latest, previous] = versions;
  const all = (await items.list(ws)).filter((i) => i.itemSetId === latest.id || i.itemSetId === previous.id);
  const of = (setId: string) => all.filter((i) => i.itemSetId === setId).sort((x, y) => x.position - y.position).map((i) => ({ ref: i.sourceRef, text: i.originalText }));
  const diff = diffVersions(of(previous.id), of(latest.id));
  return { versions, diff, diffText: diffLine(diff) };
}

// The latest set of a project, for the Import page's imported line and the stepper.
export async function latestSet(ws: WorkspaceId, projectId: string): Promise<ItemSet | null> {
  const sets = (await itemSets.list(ws)).filter((s) => s.projectId === projectId);
  return sets.sort((a, b) => b.version - a.version)[0] ?? null;
}
