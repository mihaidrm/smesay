// Name the workspace (stories/E2-3, acceptance 1): the first sign-in with no membership lands
// here; the name field starts empty (decision 0047). A person who already has a workspace is
// sent back to the app. Same column as the sign-in page, so a link opened on a phone works.
// Copy: docs/copy/app.md.
import { redirect } from "next/navigation";
import { Lockup } from "@/components/brand/mark";
import { getAppContext } from "@/lib/current-workspace";
import { SignedInFooter } from "../signed-in-footer";
import { PlausibleScript } from "@/components/analytics/plausible-script";
import { GoalOnOpen } from "@/components/analytics/goal-link";
import { GOALS, isFreshSignUp } from "@/lib/plausible";
import { cleanSource } from "@/lib/utm";
import { WorkspaceForm } from "./workspace-form";

export default async function NewWorkspacePage({ searchParams }: { searchParams: Promise<{ source?: string | string[] }> }) {
  const { session, memberships } = await getAppContext("/app/new");
  if (memberships.length > 0) redirect("/app");
  const { source } = await searchParams;
  return (
    <main className="auth-frame">
      <PlausibleScript />
      {/* The sign-up goal (stories/E13-3): an account made in the last 30 minutes, so a reload or
          a return to this step later does not count again. */}
      {isFreshSignUp(session.user.createdAt) && <GoalOnOpen goal={GOALS.signUp} />}
      <Lockup />
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-medium tracking-tight">Name your workspace</h1>
        <p className="text-ink-muted">The sample project comes with it, so there is something to look at.</p>
      </div>
      <WorkspaceForm source={cleanSource(source)} />
      <SignedInFooter email={session.user.email} />
    </main>
  );
}
