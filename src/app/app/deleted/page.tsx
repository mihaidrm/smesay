// The deleted workspace page (stories/E11-2, acceptance 2; docs/copy/errors.md, Everything else):
// shown to every member of a deleted workspace, until they leave it with the button, which ends
// their membership of it and lets the app choose again. Anyone else is sent on to the app.
import { redirect } from "next/navigation";
import { Lockup } from "@/components/brand/mark";
import { Button } from "@/components/ui/button";
import { getAppContext } from "@/lib/current-workspace";
import { WORKSPACE_DATA_COPY } from "@/lib/workspace-data-copy";
import { leaveDeletedWorkspace } from "../actions";
import { SignedInFooter } from "../signed-in-footer";

export default async function DeletedWorkspacePage() {
  const { session, deleted } = await getAppContext("/app/deleted");
  if (!deleted) redirect("/app");
  return (
    <main className="auth-frame">
      <Lockup />
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-medium tracking-tight">{WORKSPACE_DATA_COPY.deletedTitle}</h1>
        <p className="text-ink-muted" data-testid="deleted-line">{WORKSPACE_DATA_COPY.deleted(deleted.deletedAt, deleted.deletedByEmail)}</p>
      </div>
      <form action={leaveDeletedWorkspace}>
        <input type="hidden" name="workspaceId" value={deleted.id} />
        <Button type="submit" variant="primary">{WORKSPACE_DATA_COPY.deletedButton}</Button>
      </form>
      <SignedInFooter email={session.user.email} />
    </main>
  );
}
