// Import (stories/E3-1, acceptance 3; stories/E3-2; decision 0020): the "About this project"
// card, then the upload card and the preview of the latest upload; the mapping comes with E3-3.
// The sample project has no upload card (it is read-only, stories/E8-8). Copy: docs/copy/app.md.
import { notFound } from "next/navigation";
import { projects, uploads } from "@/db/queries";
import { requireCurrentWorkspace } from "@/lib/current-workspace";
import { ContextForm } from "./context-form";
import { UploadPreview } from "./preview";
import { UploadForm } from "./upload-form";

export default async function ImportPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const { current } = await requireCurrentWorkspace(`/app/projects/${projectId}/import`);
  const project = await projects.get(current.ws, projectId);
  if (!project) notFound();
  const upload = project.isSample ? null : await uploads.latestForProject(current.ws, project.id);
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
      {!project.isSample && (
        <section className="flex flex-col gap-3 rounded-md border border-hairline p-4" aria-labelledby="upload-title">
          <div className="flex flex-col gap-1">
            <h3 id="upload-title" className="font-medium">The list</h3>
            <p className="text-[13px] text-ink-muted">Upload the spreadsheet you already have. We find the header row and show the first ten rows before anything is imported.</p>
          </div>
          <UploadForm projectId={project.id} hasUpload={upload !== null} />
        </section>
      )}
      {upload && <UploadPreview upload={upload} />}
    </div>
  );
}
