// Import a project (stories/E10-2, acceptance 2): the JSON file of Whole project, recreated
// under the current workspace with new ids and tokens; its links come in revoked, so the PM
// publishes again. Copy: docs/copy/app.md, Projects.
import { requireCurrentWorkspace } from "@/lib/current-workspace";
import { EXPORT_COPY } from "@/lib/export/copy";
import { ImportProjectForm } from "./form";

export default async function ImportProjectPage() {
  const { current } = await requireCurrentWorkspace("/app/projects/import");
  const C = EXPORT_COPY.importPage;
  return (
    <main className="flex flex-col gap-5 px-8 py-6">
      <div className="flex flex-col gap-1">
        <div className="text-xs text-ink-muted" data-testid="breadcrumb">{current.workspace.name}</div>
        <h1 className="text-[30px] font-extrabold leading-9 tracking-[-0.03em]">{C.title}</h1>
        <p className="max-w-2xl text-ink-muted">{C.line}</p>
      </div>
      <ImportProjectForm />
    </main>
  );
}
