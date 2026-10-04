// The Export tab (stories/E10-1, acceptance 1; the PM app board, Export): one card per CSV file
// (Answers, Items with totals, People, Missing items), each a download from the export route with
// the page's own query (export-download.tsx), so a file holds what the page shows. The sample's files start with the
// watermark line (acceptance 4). Copy: docs/copy/app.md, Results, Export.
import { EXPORT_FILES } from "@/db/types";
import { EXPORT_COPY } from "@/lib/export/copy";
import { ExportDownload } from "./export-download";

export function ExportTab({ projectId, query, sample }: { projectId: string; query: string; sample: boolean }) {
  const T = EXPORT_COPY.tab;
  return (
    <div className="flex flex-col gap-4" data-testid="export-tab">
      <p className="text-sm text-ink-muted">{T.line}</p>
      {sample && <p className="text-sm text-ink-muted" data-testid="export-sample">{T.sample}</p>}
      <ul className="grid gap-3 md:grid-cols-2">
        {EXPORT_FILES.map((file) => (
          <li key={file} className="card flex flex-col gap-2 p-4" data-testid={`export-${file}`}>
            <h3 className="text-[15px] font-bold">{T.files[file].title}</h3>
            <p className="text-sm text-ink-muted">{T.files[file].line}</p>
            <ExportDownload href={`/api/projects/${projectId}/export/${file}${query ? `?${query}` : ""}`} label={T.download} srLabel={T.files[file].title} busyLabel={T.downloading} failed={T.failed} testId={`export-${file}-download`} fallbackName={`${file}.csv`} />
          </li>
        ))}
      </ul>
    </div>
  );
}
