// Import (stories/E3-1, acceptance 3; stories/E3-2; decision 0020): the "About this project"
// card, then the upload card, the preview of the latest upload, its column mapping
// (stories/E3-3) and the check before import with the Import button (stories/E3-5). Once a
// set exists the imported line sits under the title, the stepper is on Shape (layout.tsx) and
// the import log lists every version (stories/E3-6).
// Every card is collapsible (design note 110): the card whose work comes next is open and
// the others closed with a one-line summary, by the rule in src/lib/import-guide.ts; any
// card opens by a click.
// The sample project has no upload card (it is read-only, stories/E8-8). Copy: docs/copy/app.md.
import { notFound } from "next/navigation";
import { CollapsibleCard } from "@/components/app/collapsible-card";
import { NextStep } from "@/components/app/next-step";
import { Banner } from "@/components/ui/banner";
import { invites, projects, uploads } from "@/db/queries";
import { requireCurrentWorkspace } from "@/lib/current-workspace";
import { checkUpload, IMPORT_COPY, importLog, latestSet, sheetsError } from "@/lib/imports";
import { IMPORT_CARD_COPY, importStage, openCards } from "@/lib/import-guide";
import { mappingError } from "@/lib/import/mapping";
import { PASTE_COPY } from "@/lib/import/paste";
import { needsSheetStep } from "@/lib/import/sheets";
import { rememberedFrom } from "@/lib/uploads";
import { AttachedFile } from "./attached-file";
import { CheckCard } from "./check-card";
import { ImportLog } from "./import-log";
import { UnsavedMark } from "@/components/app/unsaved";
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
  // Several sheets (stories/E3-7): the mapping and the check wait for the Sheets step; a ticked
  // sheet without the item text column blocks the import; the switch shows when the sheet
  // names can stand in for areas.
  const waitingForSheets = upload !== null && needsSheetStep(upload) && upload.sheets === null;
  const blocked = upload ? sheetsError(upload) : null;
  const sheetAreas = upload && upload.mapping && (upload.preview.perSheet?.length ?? 0) > 1 && !Object.values(upload.mapping).includes("area") ? upload.sheetAreas : null;
  const log = project.isSample ? { versions: [], diffText: null } : await importLog(current.ws, project.id);
  const setItems = log.versions[0]?.items ?? 0;
  // The banner owed from E3-6 (stories/E6-1): the project has a public link in force.
  const published = set !== null && (await invites.livePublic(current.ws, project.id)) !== null;
  // The guide (stories/E15-3, E15-4): an upload not imported yet, or no list at all.
  const mappable = upload !== null && upload.mapping !== null && upload.preview.columns.length > 0;
  const notImported = upload !== null && !(set && set.uploadId === upload.id);
  const tip = notImported && !mappable ? null : importTip({ hasSet: set !== null, pending: notImported && mappable ? { createdAt: upload.createdAt } : null });
  // Which cards are open (design note 110).
  // While the Sheets step waits (E3-7) the stage is "mapping", so the preview card that holds
  // the step is the open one.
  const mappingReady = mappable && !waitingForSheets && upload.mapping !== null && mappingError(upload.mapping) === null;
  const stage = importStage({ hasUpload: upload !== null, mappingReady, imported: upload !== null && !notImported });
  const cards = openCards(stage, { canUpload: !project.isSample });
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
      {/* The latest upload is in: the next-step panel (design note 121). A newer upload not yet
          imported shows the cards instead. */}
      {set && !notImported && !project.isSample && (
        <NextStep done={IMPORT_COPY.done} detail={IMPORT_COPY.doneDetail(setItems, set.version)} href={`/app/projects/${project.id}/shape`} label={IMPORT_COPY.toShape} />
      )}
      {!project.isSample && (
        <StepTip path={`/app/projects/${project.id}/import`} tip={tip}
          action={tip === "rescue.mapping" ? { label: GUIDE_LINES["rescue.mapping"].action, href: "#mapping-title" } : undefined} />
      )}
      {published && <Banner data-testid="published-banner">{IMPORT_COPY.published}</Banner>}
      <ImportLog projectId={project.id} versions={log.versions} diffText={log.diffText} open={cards.versions} />
      <CollapsibleCard title={IMPORT_CARD_COPY.about.title} titleId="about-title" summary={IMPORT_CARD_COPY.about.summary(project.contextGoal ?? "", project.contextTerms ?? "")} open={cards.about} testId="card-about" mark={<UnsavedMark id="import-context" />}>
        <p className="text-[13px] text-ink-muted">Write a few words on what the list is for and who answers. The AI reads this when it groups and rewrites the items and when it writes the actions. It is not shown to respondents; the intro they see is set in Build.</p>
        <ContextForm projectId={project.id} goal={project.contextGoal ?? ""} terms={project.contextTerms ?? ""} readOnly={project.isSample} />
      </CollapsibleCard>
      {!project.isSample && (
        <CollapsibleCard title={IMPORT_CARD_COPY.list.title} titleId="upload-title" summary={IMPORT_CARD_COPY.list.summary(upload ? (upload.kind === "pasted" ? PASTE_COPY.filename : upload.filename) : null)} open={cards.list} testId="card-list" mark={<UnsavedMark id="import-paste" />}>
          <p className="text-[13px] text-ink-muted">Upload the spreadsheet you already have. We find the header row and show the first ten rows before anything is imported.</p>
          {/* With a list attached, the tile stands beside the form (design note 119). */}
          {upload ? (
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
              <div className="flex flex-col gap-3"><UploadForm projectId={project.id} hasUpload /><PasteForm projectId={project.id} /></div>
              <AttachedFile upload={upload} />
            </div>
          ) : (
            <>
              <UploadForm projectId={project.id} hasUpload={false} />
              <PasteForm projectId={project.id} />
            </>
          )}
        </CollapsibleCard>
      )}
      {upload && <UploadPreview upload={upload} open={cards.preview} />}
      {upload && upload.mapping && upload.preview.columns.length > 0 && !waitingForSheets && (
        <MappingCard key={upload.id} uploadId={upload.id} columns={upload.preview.columns} mapping={upload.mapping} rememberedFrom={remembered ? DATE.format(remembered) : null} open={cards.mapping} sheetsError={blocked} sheetAreas={sheetAreas} />
      )}
      {upload && upload.mapping && upload.preview.columns.length > 0 && !waitingForSheets && (
        <CheckCard uploadId={upload.id} check={check} importedVersion={set && set.uploadId === upload.id ? set.version : null} open={cards.check} blocked={blocked} />
      )}
    </WithPreview>
  );
}
