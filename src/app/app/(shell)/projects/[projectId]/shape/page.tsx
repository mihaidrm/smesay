// Shape (stories/E4-2; PM app board, Shape): the title with "Shape with AI" or "Run again",
// the grouped line, then the areas in the model's order, each with its rationale and its
// items; an item can be dragged to another area or moved with "Move to". Without a set the
// page points to Import. The sample is read-only (E8-8). Copy: docs/copy/app.md (Shape).
import Link from "next/link";
import { notFound } from "next/navigation";
import { items, projects } from "@/db/queries";
import { requireCurrentWorkspace } from "@/lib/current-workspace";
import { latestSet } from "@/lib/imports";
import { areaNames, groupByArea, SHAPE_COPY } from "@/lib/shaping";
import { Board } from "./board";
import { ShapeButton } from "./shape-button";

export default async function ShapePage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const { current } = await requireCurrentWorkspace(`/app/projects/${projectId}/shape`);
  const project = await projects.get(current.ws, projectId);
  if (!project) notFound();
  const set = await latestSet(current.ws, project.id);
  const rows = set ? await items.forSet(current.ws, set.id) : [];
  const groups = set ? groupByArea(set, rows) : [];
  const shaped = set !== null && set.shapedAt !== null;
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xl font-normal">{SHAPE_COPY.title}</h2>
          {set && rows.length > 0 && !project.isSample && <ShapeButton projectId={project.id} shaped={shaped} />}
        </div>
        {shaped ? (
          <p className="text-ink-muted" data-testid="grouped-line">{SHAPE_COPY.grouped(rows.length, set.areaOrder?.length ?? 0)} <span className="text-[13px]">{SHAPE_COPY.runAgainHint}</span></p>
        ) : (
          <p className="text-ink-muted">{SHAPE_COPY.intro}</p>
        )}
      </div>
      {!set || rows.length === 0 ? (
        <div className="flex flex-col items-start gap-2 rounded-lg border border-dashed border-hairline-strong p-6" data-testid="shape-empty">
          <div className="font-medium">{SHAPE_COPY.noSet}</div>
          <Link href={`/app/projects/${project.id}/import`} className="text-sm underline underline-offset-4">{SHAPE_COPY.noSetLink}</Link>
        </div>
      ) : (
        <Board key={`${set.id}-${set.shapeRuns}`} projectId={project.id} areas={areaNames(set, rows)} groups={groups.map((g) => ({ name: g.name, rationale: g.rationale, items: g.items.map((it) => ({ id: it.id, position: it.position, ref: it.sourceRef, text: it.originalText, placedByAi: it.flags?.placedByAi === true, moved: it.flags?.areaMoved === true })) }))} readOnly={project.isSample || !shaped} />
      )}
    </div>
  );
}
