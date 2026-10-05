// Import (stories/E3-1, acceptance 3; stories/E3-2; decision 0020): the "About this project"
// card, then the upload card, the preview of the latest upload, its column mapping
// (stories/E3-3) and the check before import with the Import button (stories/E3-5). Once a
// set exists the imported line sits under the title, the stepper is on Shape (layout.tsx) and
// the import log lists every version (stories/E3-6).
// The sample project has no upload card (it is read-only, stories/E8-8). Copy: docs/copy/app.md.
import { notFound } from "next/navigation";
import { Banner } from "@/components/ui/banner";
import { invites, projects, uploads } from "@/db/queries";
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
import { WithPreview } from "../with-preview";
import { StepTip } from "../step-tip";
import { importTip } from "@/lib/guide";
import { GUIDE_LINES } from "@/lib/guide-lines";

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
  // The banner owed from E3-6 (stories/E6-1): the project has a public link in force.
  const published = set !== null && (await invites.livePublic(current.ws, project.id)) !== null;
  // The guide (stories/E15-3, E15-4): an upload not imported yet, or no list at all.
  const mappable = upload !== null && upload.mapping !== null && upload.preview.columns.length > 0;
  const notImported = upload !== null && !(set && set.uploadId === upload.id);
  const tip = notImported && !mappable ? null : importTip({ hasSet: set !== null, pending: notImported && mappable ? { createdAt: upload.createdAt } : null });
  return (
    <WithPreview projectId={project.id} step="import">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold tracking-[-0.02em]">Import the list</h2>
        {set && (
          <p data-testid="imported-line" className="text-ink-muted">
            {IMPORT_COPY.imported(setItems, set.version, DATE.format(set.importedAt))}{" "}
            <a href="#upload-title" className="underline underline-offset-4">{IMPORT_COPY.newVersion}</a>
          </p>
        )}
      </div>
      {!project.isSample && (
        <StepTip path={`/app/projects/${project.id}/import`} tip={tip}
          action={tip === "rescue.mapping" ? { label: GUIDE_LINES["rescue.mapping"].action, href: "#mapping-title" } : undefined} />
      )}
      {published && <Banner data-testid="published-banner">{IMPORT_COPY.published}</Banner>}
      <ImportLog projectId={project.id} versions={log.versions} diffText={log.diffText} />
      <section className="flex flex-col gap-3 card p-4" aria-labelledby="about-title">
        <div className="flex flex-col gap-1">
          <h3 id="about-title" className="font-semibold">About this project</h3>
          <p className="text-[13px] text-ink-muted">Write a few words on what the list is for and who answers. The AI reads this when it groups and rewrites the items and when it writes the actions. It is not shown to respondents; the intro they see is set in Build.</p>
        </div>
        <ContextForm projectId={project.id} goal={project.contextGoal ?? ""} terms={project.contextTerms ?? ""} readOnly={project.isSample} />
      </section>
      {!project.isSample && (
        <section className="flex flex-col gap-3 card p-4" aria-labelledby="upload-title">
          <div className="flex flex-col gap-1">
            <h3 id="upload-title" className="font-semibold">The list</h3>
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
    </WithPreview>
  );
}
