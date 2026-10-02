// New project (stories/E3-1, acceptance 2): a name only, then the Import step. Copy:
// docs/copy/app.md.
import { requireCurrentWorkspace } from "@/lib/current-workspace";
import { NewProjectForm } from "./form";

export default async function NewProjectPage() {
  const { current } = await requireCurrentWorkspace("/app/projects/new");
  return (
    <main className="flex flex-col gap-5 px-8 py-6">
      <div className="flex flex-col gap-1">
        <div className="text-xs text-ink-muted" data-testid="breadcrumb">{current.workspace.name}</div>
        <h1 className="text-2xl font-normal">New project</h1>
        <p className="text-ink-muted">A name is enough. The list comes on the next step.</p>
      </div>
      <NewProjectForm />
    </main>
  );
}
