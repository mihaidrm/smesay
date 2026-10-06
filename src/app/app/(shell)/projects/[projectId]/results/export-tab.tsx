// The Export tab (stories/E10-1, acceptance 1; the PM app board, Export): one card per CSV file
// (Answers, Items with totals, People, Missing items), each a download from the export route with
// the page's own query (export-download.tsx), so a file holds what the page shows; then Whole
// project, the JSON file of E10-2, which holds everything whatever the filter; then Summary for
// the deck, the PDF of E10-3 under the page's filter. The sample's files start with the
// watermark line (acceptance 4). Under Names hidden and Anonymous (stories/E5-7, acceptance 5)
// a line says what the files leave out. Copy: docs/copy/app.md, Results, Export.
import { CSV_FILES } from "@/db/types";
import { EXPORT_COPY, SUMMARY_PAGE_LIMIT } from "@/lib/export/copy";
import { ExportDownload } from "./export-download";

export function ExportTab({ projectId, query, sample, namesHidden = false }: { projectId: string; query: string; sample: boolean; namesHidden?: boolean }) {
  const T = EXPORT_COPY.tab;
  return (
    <div className="flex flex-col gap-4" data-testid="export-tab">
      <p className="text-sm text-ink-muted">{T.line}</p>
      {sample && <p className="text-sm text-ink-muted" data-testid="export-sample">{T.sample}</p>}
      {namesHidden && <p className="text-sm text-ink-muted" data-testid="export-names-hidden">{T.namesHidden}</p>}
      <ul className="grid gap-3 md:grid-cols-2">
        {CSV_FILES.map((file) => (
          <li key={file} className="card flex flex-col gap-2 p-4" data-testid={`export-${file}`}>
            <h3 className="text-[15px] font-bold">{T.files[file].title}</h3>
            <p className="text-sm text-ink-muted">{T.files[file].line}</p>
            <ExportDownload href={`/api/projects/${projectId}/export/${file}${query ? `?${query}` : ""}`} label={T.download} srLabel={T.files[file].title} busyLabel={T.downloading} failed={T.failed} testId={`export-${file}-download`} fallbackName={`${file}.csv`} />
          </li>
        ))}
        <li className="card flex flex-col gap-2 p-4" data-testid="export-project">
          <h3 className="text-[15px] font-bold">{T.project.title}</h3>
          <p className="text-sm text-ink-muted">{T.project.line}</p>
          <ExportDownload href={`/api/projects/${projectId}/export/project`} label={T.project.download} srLabel={T.project.title} busyLabel={T.downloading} failed={T.project.failed} testId="export-project-download" fallbackName="project.json" />
        </li>
        <li className="card flex flex-col gap-2 p-4" data-testid="export-summary">
          <h3 className="text-[15px] font-bold">{T.summary.title}</h3>
          <p className="text-sm text-ink-muted">{T.summary.line}</p>
          <ExportDownload href={`/api/projects/${projectId}/export/summary${query ? `?${query}` : ""}`} label={T.summary.download} srLabel={T.summary.title} busyLabel={T.downloading} failed={T.summary.failed} testId="export-summary-download" fallbackName="summary.pdf" pages={{ limit: SUMMARY_PAGE_LIMIT, note: T.summary.overLimit("{pages}") }} />
        </li>
      </ul>
    </div>
  );
}
