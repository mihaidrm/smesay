// A project's address opens its current step: Import until the list is in (stories/E3-1);
// the sample opens on Results (stories/E8-8, acceptance 1). A project outside the workspace is
// 404 on the step page.
import { redirect } from "next/navigation";
import { projects } from "@/db/queries";
import { requireCurrentWorkspace } from "@/lib/current-workspace";

export default async function ProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const { current } = await requireCurrentWorkspace(`/app/projects/${projectId}`);
  const project = await projects.get(current.ws, projectId);
  redirect(`/app/projects/${projectId}/${project?.isSample ? "results" : "import"}`);
}
