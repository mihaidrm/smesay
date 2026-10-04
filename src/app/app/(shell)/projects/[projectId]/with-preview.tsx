// The step page and, on its right, the builder's preview (stories/E5-6, acceptance 1): Import,
// Shape, Build and Share wrap their content in this; Results, Projects and Settings do not.
// The source is made here for the signed-in PM, in their current workspace, so the preview
// shows only what they can see; it changes only when what the preview shows does
// (src/lib/preview.ts previewSrc).
import { PreviewFrame } from "@/components/app/preview-frame";
import { PREVIEW_COPY } from "@/lib/build-copy";
import { requireCurrentWorkspace } from "@/lib/current-workspace";
import { previewSrc, type PreviewStep } from "@/lib/preview";

export async function WithPreview({ projectId, step, children }: { projectId: string; step: PreviewStep; children: React.ReactNode }) {
  const { session, current } = await requireCurrentWorkspace(`/app/projects/${projectId}/${step}`);
  return (
    <div className="flex items-start gap-6">
      <div className="flex min-w-0 grow flex-col gap-5">{children}</div>
      <PreviewFrame src={await previewSrc({ project: projectId, ws: current.ws, user: session.user.id }, step)} caption={PREVIEW_COPY.caption[step]} />
    </div>
  );
}
