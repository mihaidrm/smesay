// Import (stories/E3-1, acceptance 3; stories/E3-2; decision 0020): the "About this project"
// card, then the upload card, the preview of the latest upload, its column mapping
// (stories/E3-3) and the check before import with the Import button (stories/E3-5). Once a
// set exists the imported line sits under the title, the stepper is on Shape (layout.tsx) and
// the import log lists every version (stories/E3-6).
// The sample project has no upload card (it is read-only, stories/E8-8). Copy: docs/copy/app.md.
import { notFound } from "next/navigation";
import { projects, uploads } from "@/db/queries";
import { requireCurrentWorkspace } from "@/lib/current-workspace";
import { checkUpload, IMPORT_COPY, importLog, latestSet } from "@/lib/imports";
import { mappingError } from "@/lib/import/mapping";
import { rememberedFrom } from "@/lib/uploads";
import { CheckCard } from "./check-card";
import { ImportLog } from "./import-log";
import { ContextForm } from "./context-form";
import { MappingCard } from "./mapping";
import { PasteForm } from "./paste-form";
import { UploadPreview } from "./preview";
import { UploadForm } from "./upload-form";

const DATE = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

export default async function ImportPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const { current } = await requireCurrentWorkspace(`/app/projects/${projectId}/import`);
  const project = await projects.get(current.ws, projectId);
  if (!project) notFound();
  const upload = project.isSample ? null : await uploads.latestForProject(current.ws, project.id);
  const remembered = upload ? await rememberedFrom(current.ws, upload) : null;
  const set = project.isSample ? null : await latestSet(current.ws, project.id);
  const check = upload && upload.mapping && !mappingError(upload.mapping) ? await checkUpload(upload) : null;
  const log = project.isSample ? { versions: [], diffText: null } : await importLog(current.ws, project.id);
  const setItems = log.versions[0]?.items ?? 0;
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-normal">Import the list</h2>
        {set && (
          <p data-testid="imported-line" className="text-ink-muted">
            {IMPORT_COPY.imported(setItems, set.version, DATE.format(set.importedAt))}{" "}
            <a href="#upload-title" className="underline underline-offset-4">{IMPORT_COPY.newVersion}</a>
          </p>
        )}
      </div>
      <ImportLog projectId={project.id} versions={log.versions} diffText={log.diffText} />
      <section className="flex flex-col gap-3 rounded-md border border-hairline p-4" aria-labelledby="about-title">
        <div className="flex flex-col gap-1">
          <h3 id="about-title" className="font-medium">About this project</h3>
          <p className="text-[13px] text-ink-muted">A few words on what the list is for and who answers. The AI reads this when it groups and rewrites the items and when it writes the actions. It is not shown to respondents; the intro they see is set in Build.</p>
        </div>
        <ContextForm projectId={project.id} goal={project.contextGoal ?? ""} terms={project.contextTerms ?? ""} readOnly={project.isSample} />
      </section>
      {!project.isSample && (
        <section className="flex flex-col gap-3 rounded-md border border-hairline p-4" aria-labelledby="upload-title">
          <div className="flex flex-col gap-1">
            <h3 id="upload-title" className="font-medium">The list</h3>
            <p className="text-[13px] text-ink-muted">Upload the spreadsheet you already have. We find the header row and show the first ten rows before anything is imported.</p>
          </div>
          <UploadForm projectId={project.id} hasUpload={upload !== null} />
          <PasteForm projectId={project.id} />
        </section>
      )}
      {upload && <UploadPreview upload={upload} />}
      {upload && upload.mapping && upload.preview.columns.length > 0 && (
        <MappingCard key={upload.id} uploadId={upload.id} columns={upload.preview.columns} mapping={upload.mapping} rememberedFrom={remembered ? DATE.format(remembered) : null} />
      )}
      {upload && upload.mapping && upload.preview.columns.length > 0 && (
        <CheckCard uploadId={upload.id} check={check} importedVersion={set && set.uploadId === upload.id ? set.version : null} />
      )}
    </div>
  );
}
