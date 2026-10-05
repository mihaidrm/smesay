// The answer to any write during an admin's view (stories/E14-4, acceptance 2): every server
// action and writing route takes its workspace from requireWritableWorkspace
// (src/lib/current-workspace.ts), which sends the request here instead of acting. Outside a
// view the page has nothing to say and goes to the projects. Copy: docs/copy/errors.md.
import Link from "next/link";
import { redirect } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { requireCurrentWorkspace } from "@/lib/current-workspace";
import { VIEW_AS_COPY as C } from "@/lib/view-as-copy";

export default async function ViewOnlyPage() {
  const { viewing } = await requireCurrentWorkspace("/app");
  if (!viewing) redirect("/app");
  return (
    <main className="flex flex-col gap-4 px-8 py-6" data-testid="view-only">
      <h1 className="text-[30px] font-extrabold leading-9 tracking-[-0.03em]">{C.refused(viewing.workspace.name)}</h1>
      <p className="text-ink-muted">{C.refusedLine}</p>
      <Link href="/app" className={buttonVariants({ variant: "secondary", className: "self-start" })}>{C.back}</Link>
    </main>
  );
}
