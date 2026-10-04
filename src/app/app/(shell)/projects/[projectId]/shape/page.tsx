// Shape (stories/E4-2; PM app board, Shape): the title with "Shape with AI" or "Run again",
// the grouped line, then the areas in the model's order, each with its rationale and its
// items; an item can be dragged to another area or moved with "Move to". Each item shows
// its reader version with Accept, Edit, Reject and Undo, and the title row has Accept all
// and Reject all with the counter under it (stories/E4-3). Without a set the page points to
// Import. The context line (stories/E4-5) says what the AI was given, or where to add it;
// the sample, which no run can use, has none.
// The sample is read-only (E8-8): its reader versions are shown as accepted, with no
// controls. Copy: docs/copy/app.md (Shape).
import Link from "next/link";
import { notFound } from "next/navigation";
import { instruments, items, itemSets, projects } from "@/db/queries";
import { requireCurrentWorkspace } from "@/lib/current-workspace";
import { latestSet } from "@/lib/imports";
import { PROJECTS_COPY } from "@/lib/projects-copy";
import { isPublished } from "@/lib/instruments";
import { PERSPECTIVES_COPY } from "@/lib/perspectives";
import { hasReaderVersion, readerCounts, readerIsOriginal } from "@/lib/item-text";
import { areaNames, contextLine, flagsFor, groupByArea, hadImportedAreas, SHAPE_COPY } from "@/lib/shaping";
import { Board } from "./board";
import { FlagBanners } from "./flags";
import { ReaderAll } from "./reader-all";
import { ShapeButton } from "./shape-button";

export default async function ShapePage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const { current } = await requireCurrentWorkspace(`/app/projects/${projectId}/shape`);
  const project = await projects.get(current.ws, projectId);
  if (!project) notFound();
  const set = await latestSet(current.ws, project.id);
  const rows = set ? await items.forSet(current.ws, set.id) : [];
  // The perspectives (stories/E5-4) come from the newest instrument, when it is built on
  // this set and not published; otherwise a line says why there are no chips (the version
  // the instrument is on, with the way to Build, or that it is published).
  const instrument = set ? await instruments.latestForProject(current.ws, project.id) : null;
  const onThisSet = instrument !== null && instrument.itemSetId === set?.id;
  const published = instrument !== null && onThisSet && (await isPublished(current.ws, instrument.id));
  const perspectives = instrument && onThisSet && !published ? instrument.perspectives : [];
  const builtOn = instrument && !onThisSet ? await itemSets.get(current.ws, instrument.itemSetId) : null;
  if (instrument && !onThisSet && !builtOn) notFound();
  const perspectivesNote = !instrument || instrument.perspectives.length === 0 || project.isSample ? null : published ? PERSPECTIVES_COPY.locked : !onThisSet && set && builtOn ? PERSPECTIVES_COPY.otherSet(builtOn.version, set.version) : null;
  const groups = set ? groupByArea(set, rows) : [];
  const shaped = set !== null && set.shapedAt !== null;
  const imported = hadImportedAreas(rows);
  const counts = readerCounts(rows);
  const suggested = rows.filter((it) => hasReaderVersion(it) && it.readerStatus === "suggested").length;
  // The sample's reader versions are accepted in the seed; it shows them without a run.
  const showReaders = shaped || project.isSample;
  // Flags (stories/E4-4): the banners above the areas and a note per flag on the item.
  const flags = flagsFor(rows);
  const notesFor = (id: string) => flags.filter((f) => f.itemId === id).map((f) => (f.kind === "ambiguity" ? SHAPE_COPY.ambiguityNote(SHAPE_COPY.sentence(f.what)) : SHAPE_COPY.duplicateItemNote(f.otherRef)));
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xl font-bold tracking-[-0.02em]">{SHAPE_COPY.title}</h2>
          {set && rows.length > 0 && !project.isSample && (
            <div className="flex flex-wrap items-center gap-2">
              {shaped && <ReaderAll key={suggested} projectId={project.id} suggested={suggested} />}
              <ShapeButton projectId={project.id} shaped={shaped} />
            </div>
          )}
        </div>
        {showReaders ? (
          <p className="text-ink-muted" data-testid="grouped-line">
            {shaped && <>{SHAPE_COPY.grouped(rows.length, set.areas?.length ?? 0)} </>}
            <span data-testid="reader-counter">{SHAPE_COPY.counter(counts.accepted, counts.total)}</span>
            {shaped && <> <span className="text-[13px]">{SHAPE_COPY.runAgainHint}</span></>}
          </p>
        ) : (
          <p className="text-ink-muted">{SHAPE_COPY.intro}</p>
        )}
        {project.isSample && <p className="text-[13px] text-ink-muted" data-testid="sample-read-only">{PROJECTS_COPY.sample}</p>}
        {set && rows.length > 0 && !project.isSample && <ContextLine line={contextLine(set, { goal: project.contextGoal, terms: project.contextTerms })} importHref={`/app/projects/${project.id}/import#about-title`} />}
        {perspectivesNote && (
          <p className="text-[13px] text-ink-muted" data-testid="perspectives-note">
            {perspectivesNote}{!published && <> <Link href={`/app/projects/${project.id}/build`} className="underline underline-offset-4">{PERSPECTIVES_COPY.otherSetLink}</Link></>}
          </p>
        )}
      </div>
      <FlagBanners projectId={project.id} flags={flags} readOnly={project.isSample} />
      {!set || rows.length === 0 ? (
        <div className="flex flex-col items-start gap-2 rounded-2xl border border-dashed border-hairline-strong bg-surface p-6" data-testid="shape-empty">
          <div className="font-semibold">{SHAPE_COPY.noSet}</div>
          <Link href={`/app/projects/${project.id}/import`} className="text-sm underline underline-offset-4">{SHAPE_COPY.noSetLink}</Link>
        </div>
      ) : (
        <Board key={`${set.id}-${set.shapeRuns}`} projectId={project.id} areas={areaNames(set, rows)} groups={groups.map((g) => ({ name: g.name, rationale: g.rationale, items: g.items.map((it) => ({ id: it.id, position: it.position, ref: it.sourceRef, text: it.originalText, placedByAi: imported && it.flags?.areaBy === "ai", moved: it.flags?.areaBy === "pm", reader: { reader: showReaders ? it.readerText : null, status: it.readerStatus, same: readerIsOriginal(it) }, notes: notesFor(it.id), tags: it.perspectives })) }))} readOnly={project.isSample || !shaped} readerOnly={project.isSample} perspectives={perspectives} />
      )}
    </div>
  );
}

// The context line (stories/E4-5; the board's ctxLine): 13 px under the grouped line, the
// label in ink, the rest muted. Not on the sample, which no run can use.
function ContextLine({ line, importHref }: { line: ReturnType<typeof contextLine>; importHref: string }) {
  if (line.kind === "none") {
    return <p className="text-[13px] text-ink-muted" data-testid="context-line">{SHAPE_COPY.noContext} <Link href={importHref} className="underline underline-offset-4">{SHAPE_COPY.noContextLink}</Link></p>;
  }
  return (
    <p className="text-[13px] text-ink-muted" data-testid="context-line">
      <span className="font-medium text-ink">{line.kind === "used" ? SHAPE_COPY.contextUsed : SHAPE_COPY.contextNext}</span> {SHAPE_COPY.sentence(line.goal)}
      {line.terms ? ` ${SHAPE_COPY.keptAsWritten} ${SHAPE_COPY.sentence(line.terms)}` : ""}
      {line.changed && line.kind === "used" ? <> <span data-testid="context-changed">{SHAPE_COPY.contextChanged}</span></> : null}
    </p>
  );
}
