// The signed-in shell (stories/E2-1, acceptance 5): a signed-out person is sent to the sign-in
// page and comes back here afterwards. The sidebar follows the PM app board (240 px, workspace
// header, projects, footer); the workspace and project parts fill in with E2-3.
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Lockup } from "@/components/brand/mark";
import { SignOutButton } from "./sign-out-button";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in?next=/app");
  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 shrink-0 flex-col gap-6 border-r border-hairline bg-grey-50 px-4 py-5 text-sm">
        <Lockup />
        <div className="flex flex-col gap-1">
          <div className="text-xs text-ink-muted">Workspace</div>
          <div className="font-medium">No workspace yet</div>
          <div className="text-xs text-ink-muted">Your first workspace is created with E2-3.</div>
        </div>
        <div className="mt-auto flex flex-col gap-2 text-ink-muted">
          <div className="truncate" title={session.user.email}>{session.user.email}</div>
          <SignOutButton />
        </div>
      </aside>
      <div className="flex min-w-0 flex-grow flex-col">{children}</div>
    </div>
  );
}
