// The step page and, on its right, the builder's preview (stories/E5-6, acceptance 1): Import,
// Shape, Build and Share wrap their content in this; Results, Projects and Settings do not,
// nor does the sample project (decision 0021, item 1: its data shows only under the
// watermark). The source is made here for the signed-in PM, in their current workspace, so
// the preview shows only what they can see; it changes only when what the preview shows does
// (src/lib/preview.ts previewSrc).
import { PreviewColumn, PreviewFrame, PreviewScreen } from "@/components/app/preview-frame";
import { projects } from "@/db/queries";
import { PREVIEW_COPY } from "@/lib/build-copy";
import { requireCurrentWorkspace } from "@/lib/current-workspace";
import { previewSrc, type PreviewStep } from "@/lib/preview";

export async function WithPreview({ projectId, step, children }: { projectId: string; step: PreviewStep; children: React.ReactNode }) {
  const { session, current } = await requireCurrentWorkspace(`/app/projects/${projectId}/${step}`);
  const project = await projects.get(current.ws, projectId);
  if (!project || project.isSample) return <div className="flex min-w-0 flex-col gap-5">{children}</div>;
  return (
    <PreviewScreen>
      <div className="flex items-start gap-6">
        <PreviewColumn>{children}</PreviewColumn>
        <PreviewFrame src={await previewSrc({ project: projectId, ws: current.ws, user: session.user.id }, step)} caption={PREVIEW_COPY.caption[step]} />
      </div>
    </PreviewScreen>
  );
}
