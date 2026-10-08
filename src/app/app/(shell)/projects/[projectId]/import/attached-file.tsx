// The attached file tile (stories/E3-2, changed 2026-10-08; design note 119): once a list is
// attached, the card shows it as a tile beside the upload form, not only as a name on the
// title row (Mihai: "make it more obvious that there is a file attached already"). A Lucide
// icon in a tinted square (the spreadsheet for a file, the text page for a pasted list), the
// name, its kind and size, the date, and what the tile means. Copy: src/lib/import/attached.ts.
import { FileSpreadsheet, FileText } from "lucide-react";
import { ATTACHED_COPY, attachedFileMeta } from "@/lib/import/attached";
import { PASTE_COPY } from "@/lib/import/paste";

const DATE = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" });

export function AttachedFile({ upload }: { upload: { filename: string; kind: "xlsx" | "csv" | "pasted"; byteSize: number; preview: { rowsRead: number }; createdAt: Date } }) {
  const pasted = upload.kind === "pasted";
  const Icon = pasted ? FileText : FileSpreadsheet;
  const name = pasted ? PASTE_COPY.filename : upload.filename;
  return (
    <div data-testid="attached-file" className="flex gap-4 rounded-xl border border-hairline bg-tint p-4">
      <div className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-violet-soft text-violet-text" aria-hidden="true"><Icon size={32} strokeWidth={1.75} /></div>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-xs font-semibold text-ink-muted">{ATTACHED_COPY.heading}</span>
        <span className="truncate text-[15px] font-semibold" title={name}>{name}</span>
        <span className="text-[13px] text-ink-muted">{attachedFileMeta(upload)}</span>
        <span className="text-[13px] text-ink-muted">{(pasted ? ATTACHED_COPY.pasted : ATTACHED_COPY.uploaded)(DATE.format(upload.createdAt))}</span>
        <span className="mt-1 text-[13px] text-ink-muted">{ATTACHED_COPY.hint}</span>
      </div>
    </div>
  );
}
