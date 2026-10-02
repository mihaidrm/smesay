// Choose a workspace (stories/E2-3, acceptance 3 and 5): shown when the person belongs to
// workspaces but none is current, which happens on the first visit after an invite and when
// the current one was removed. With no membership at all the create page is the place. Copy:
// docs/copy/app.md.
import { redirect } from "next/navigation";
import { Lockup } from "@/components/brand/mark";
import { Button } from "@/components/ui/button";
import { getAppContext } from "@/lib/current-workspace";
import { switchWorkspace } from "../actions";
import { SignedInFooter } from "../signed-in-footer";

export default async function SwitchWorkspacePage() {
  const { session, memberships, storedId } = await getAppContext("/app/switch");
  if (memberships.length === 0) redirect("/app/new");
  const removed = storedId !== null && !memberships.some((w) => w.id === storedId);
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-8 px-4 py-12">
      <Lockup />
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-medium tracking-tight">Choose a workspace</h1>
        <p className="text-ink-muted">{removed ? "The workspace you were in is no longer available to you. Pick another one to work in." : "Pick the workspace to work in. You can switch any time from the sidebar."}</p>
      </div>
      <ul className="flex flex-col gap-2">
        {memberships.map((w) => (
          <li key={w.id}>
            <form action={switchWorkspace}>
              <input type="hidden" name="workspaceId" value={w.id} />
              <Button type="submit" variant="secondary" className="w-full justify-start">{w.name}</Button>
            </form>
          </li>
        ))}
      </ul>
      <SignedInFooter email={session.user.email} />
    </main>
  );
}
