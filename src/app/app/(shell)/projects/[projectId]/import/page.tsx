// Import (stories/E3-1, acceptance 3; decision 0020): the "About this project" card above the
// mapping; the upload and the mapping come with E3-2. Copy: docs/copy/app.md.
import { notFound } from "next/navigation";
import { projects } from "@/db/queries";
import { requireCurrentWorkspace } from "@/lib/current-workspace";
import { ContextForm } from "./context-form";

export default async function ImportPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const { current } = await requireCurrentWorkspace(`/app/projects/${projectId}/import`);
  const project = await projects.get(current.ws, projectId);
  if (!project) notFound();
  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-xl font-normal">Import the list</h2>
      <section className="flex flex-col gap-3 rounded-md border border-hairline p-4" aria-labelledby="about-title">
        <div className="flex flex-col gap-1">
          <h3 id="about-title" className="font-medium">About this project</h3>
          <p className="text-[13px] text-ink-muted">A few words on what the list is for and who answers. The AI reads this when it groups and rewrites the items and when it writes the actions. It is not shown to respondents; the intro they see is set in Build.</p>
        </div>
        <ContextForm projectId={project.id} goal={project.contextGoal ?? ""} terms={project.contextTerms ?? ""} readOnly={project.isSample} />
      </section>
    </div>
  );
}
