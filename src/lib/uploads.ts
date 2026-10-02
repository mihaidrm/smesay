// The upload of a list (stories/E3-2): the checks (extension, 5 MB, 2,000 rows), the object in
// the bucket under uploads/<workspace id>/<random>.<xlsx|csv> (SECURITY.md, Data; the key never
// carries the PM's file name), the parse on the server, the preview, the row. The order is
// check, parse, store, insert: a file that fails a check is never written, and a store failure
// leaves no row (acceptance 4). rechoose() rebuilds the preview from the stored object when the
// PM picks another sheet or header row. Messages: docs/copy/errors.md, Import.
import { randomBytes } from "node:crypto";
import { projects, uploads } from "@/db/queries";
import type { Upload } from "@/db/queries/uploads";
import type { UploadPreview, WorkspaceId } from "@/db/types";
import { NotFoundError } from "@/lib/errors";
import { ROWS_MAX, SIZE_MAX, formatBytes } from "@/lib/import/limits";
import { UnreadableFileError, extensionOf, kindOf, parseFile } from "@/lib/import/parse";
import { buildPreview } from "@/lib/import/preview";
import { getObject, putObject } from "@/lib/storage";

export const UPLOAD_COPY = {
  notSpreadsheet: (extension: string) => `This file is ${extension || "without an extension"}. Upload an xlsx or csv, or paste the list instead.`,
  tooBig: (size: number) => `This file is ${formatBytes(size)}. The limit is ${formatBytes(SIZE_MAX)}. Remove sheets or columns you do not need and upload again.`,
  tooManyRows: (rows: string) => `This file has ${rows} rows. The limit is ${ROWS_MAX.toLocaleString("en-GB")}. Split the list and upload the first part.`,
  unreadable: "The file could not be read as a spreadsheet. Export it again as xlsx or csv and upload it.",
  noHeader: "No header row found. Pick the row that holds the column names, or tell us which column is the requirement.",
  sample: "The sample project cannot be edited.",
  interrupted: "The upload stopped before the file arrived. Check your connection and upload it again. Nothing was imported.",
  summary: (filename: string, rows: number, headerRow: number | null) =>
    `${filename}, ${rows.toLocaleString("en-GB")} ${rows === 1 ? "row" : "rows"} read, ${headerRow ? `header found on row ${headerRow}` : "no header row found"}.`,
};

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
  const preview = buildPreview(parsed);
  if (preview.rowsRead > ROWS_MAX) return { error: UPLOAD_COPY.tooManyRows(`over ${ROWS_MAX.toLocaleString("en-GB")}`) };
  const objectKey = `uploads/${actor.ws}/${randomBytes(8).toString("hex")}.${kind}`;
  await putObject(objectKey, file.bytes, CONTENT_TYPES[kind]);
  const upload = await uploads.create(actor.ws, {
    projectId, objectKey, filename: file.name.slice(0, 255), kind, byteSize: file.bytes.byteLength,
    sheet: preview.sheet, headerRow: preview.headerRow, preview, createdBy: actor.userId,
  });
  return { upload };
}

export async function rechoose(ws: WorkspaceId, uploadId: string, choice: { sheet?: string | null; headerRow?: number | null }): Promise<Upload> {
  const current = await uploads.get(ws, uploadId);
  if (!current) throw new NotFoundError();
  const object = await getObject(current.objectKey);
  if (!object) throw new NotFoundError();
  const parsed = await parseFile(current.kind, object.body);
  const sheetChanged = choice.sheet !== undefined && choice.sheet !== current.sheet;
  const preview: UploadPreview = buildPreview(parsed, { sheet: choice.sheet ?? current.sheet, headerRow: sheetChanged ? null : choice.headerRow });
  const updated = await uploads.update(ws, uploadId, { sheet: preview.sheet, headerRow: preview.headerRow, preview });
  if (!updated) throw new NotFoundError();
  return updated;
}
