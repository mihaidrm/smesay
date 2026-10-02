// The upload of a list (stories/E3-2): the checks (extension, 5 MB, 2,000 rows), the object in
// the bucket under uploads/<workspace id>/<random>.<xlsx|csv> (SECURITY.md, Data; the key never
// carries the PM's file name), the parse on the server, the preview, the row. The order is
// check, parse, store, insert: a file that fails a check is never written, a store failure
// leaves no row, and a failed insert removes the object again (acceptance 4). The row limit is
// checked on every sheet with its own detected header at upload, and again on the sheet and
// header row the PM picks in rechoose(), which rebuilds the preview from the stored object; a
// pick over the limit is refused and the stored choice stays. Earlier uploads of a project keep
// their rows and objects until the workspace deletion (stories/E11-2). The column mapping
// (stories/E3-3) rides on the upload row: remembered for the headers when the workspace has
// one, guessed from the header names otherwise, saved on every change by saveMapping(), which
// also remembers it for the workspace. Messages: src/lib/import/copy.ts and
// src/lib/import/mapping.ts.
import { randomBytes } from "node:crypto";
import { projects, uploads, workspaceMappings } from "@/db/queries";
import type { Upload } from "@/db/queries/uploads";
import type { ColumnMapping, UploadPreview, WorkspaceId } from "@/db/types";
import type { ParsedFile } from "@/lib/import/parse";
import { NotFoundError } from "@/lib/errors";
import { UPLOAD_COPY } from "@/lib/import/copy";
import { ROWS_MAX, SIZE_MAX } from "@/lib/import/limits";
import { applyMapping, cleanMapping, guessMapping, headersKey, mappingError } from "@/lib/import/mapping";
import { UnreadableFileError, extensionOf, kindOf, parseFile } from "@/lib/import/parse";
import { buildPreview } from "@/lib/import/preview";
import { deleteObject, getObject, putObject } from "@/lib/storage";

export { UPLOAD_COPY };

const CONTENT_TYPES = { xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", csv: "text/csv" } as const;

export type SaveUploadResult = { error: string } | { upload: Upload };

export async function saveUpload(actor: { ws: WorkspaceId; userId: string }, projectId: string, file: { name: string; bytes: Uint8Array }): Promise<SaveUploadResult> {
  const project = await projects.get(actor.ws, projectId);
  if (!project) throw new NotFoundError();
  if (project.isSample) return { error: UPLOAD_COPY.sample };
  const kind = kindOf(file.name);
  if (!kind) return { error: UPLOAD_COPY.notSpreadsheet(extensionOf(file.name)) };
  if (file.bytes.byteLength > SIZE_MAX) return { error: UPLOAD_COPY.tooBig(file.bytes.byteLength) };
  let parsed;
  try {
    parsed = await parseFile(kind, file.bytes);
  } catch (error) {
    if (error instanceof UnreadableFileError) return { error: UPLOAD_COPY.unreadable };
    throw error;
  }
  const over = overRowLimit(parsed);
  if (over) return { error: over };
  const preview = buildPreview(parsed);
  const mapping = await initialMapping(actor.ws, preview);
  const objectKey = `uploads/${actor.ws}/${randomBytes(8).toString("hex")}.${kind}`;
  await putObject(objectKey, file.bytes, CONTENT_TYPES[kind]);
  try {
    const upload = await uploads.create(actor.ws, {
      projectId, objectKey, filename: file.name.slice(0, 255), kind, byteSize: file.bytes.byteLength,
      sheet: preview.sheet, headerRow: preview.headerRow, preview, mapping, createdBy: actor.userId,
    });
    return { upload };
  } catch (error) {
    await deleteObject(objectKey).catch(() => undefined);
    throw error;
  }
}

// The row limit over every sheet, each with its own detected header, so no later pick can
// reach a sheet that was never checked. The message names the sheet for a workbook.
function overRowLimit(parsed: ParsedFile): string | null {
  for (const sheet of parsed.sheets) {
    const { rowsRead } = buildPreview(parsed, { sheet: sheet.name });
    if (rowsRead > ROWS_MAX) return UPLOAD_COPY.tooManyRows(rowsRead, parsed.kind === "xlsx" ? sheet.name : null);
  }
  return null;
}

export async function rechoose(ws: WorkspaceId, uploadId: string, choice: { sheet?: string | null; headerRow?: number | null }): Promise<{ error: string } | { upload: Upload }> {
  const current = await uploads.get(ws, uploadId);
  if (!current) throw new NotFoundError();
  const object = await getObject(current.objectKey);
  if (!object) throw new NotFoundError();
  const parsed = await parseFile(current.kind, object.body);
  const sheetChanged = choice.sheet !== undefined && choice.sheet !== current.sheet;
  const preview: UploadPreview = buildPreview(parsed, { sheet: choice.sheet ?? current.sheet, headerRow: sheetChanged ? null : choice.headerRow });
  if (preview.rowsRead > ROWS_MAX) return { error: UPLOAD_COPY.tooManyRows(preview.rowsRead, current.kind === "xlsx" ? preview.sheet : null) };
  const mapping = await initialMapping(ws, preview);
  const updated = await uploads.update(ws, uploadId, { sheet: preview.sheet, headerRow: preview.headerRow, preview, mapping });
  if (!updated) throw new NotFoundError();
  return { upload: updated };
}

async function initialMapping(ws: WorkspaceId, preview: UploadPreview): Promise<ColumnMapping | null> {
  if (preview.columns.length === 0) return null;
  const remembered = await workspaceMappings.getByHeaders(ws, headersKey(preview.columns));
  return remembered ? applyMapping(preview.columns, remembered.mapping) : guessMapping(preview.columns);
}

// The mapping as the form sent it, cleaned (src/lib/import/mapping.ts), stored on the upload
// and remembered for the workspace under the headers; the error names a missing text column
// but the mapping is saved either way, so the PM can fix one select at a time.
export async function saveMapping(ws: WorkspaceId, uploadId: string, raw: Record<string, unknown>): Promise<{ upload: Upload; error: string | null }> {
  const current = await uploads.get(ws, uploadId);
  if (!current) throw new NotFoundError();
  const mapping = cleanMapping(current.preview.columns, raw);
  const updated = await uploads.update(ws, uploadId, { mapping });
  if (!updated) throw new NotFoundError();
  await workspaceMappings.upsert(ws, headersKey(current.preview.columns), mapping);
  return { upload: updated, error: mappingError(mapping) };
}

// "Mapping remembered from [DATE]": the workspace mapping for this upload's headers when it
// existed before the upload (acceptance 3); null when the mapping was guessed or made here.
export async function rememberedFrom(ws: WorkspaceId, upload: Upload): Promise<Date | null> {
  if (upload.preview.columns.length === 0) return null;
  const row = await workspaceMappings.getByHeaders(ws, headersKey(upload.preview.columns));
  return row && row.updatedAt < upload.createdAt ? row.updatedAt : null;
}
