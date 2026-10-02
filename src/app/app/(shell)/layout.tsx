// The signed-in shell (stories/E2-1, acceptance 5; stories/E2-3, acceptance 3): the PM app
// board's frame, a 240 px sidebar with the lockup, the workspace block (the name, or the
// switcher when the person belongs to more than one), the member count, the project list, and
// the signed-in email with Sign out. Route group, so /app/new and /app/switch render without
// it (node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route-groups.md).
// Copy: docs/copy/app.md.
import Link from "next/link";
import { Lockup } from "@/components/brand/mark";
import { NeutralPill } from "@/components/ui/status-pill";
import { members, projects } from "@/db/queries";
import { requireCurrentWorkspace } from "@/lib/current-workspace";
import { SignOutButton } from "../sign-out-button";
import { WorkspaceSwitcher } from "./workspace-switcher";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { session, memberships, current } = await requireCurrentWorkspace("/app");
  const [memberRows, projectRows] = await Promise.all([members.list(current.ws), projects.list(current.ws)]);
  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 shrink-0 flex-col gap-6 border-r border-hairline bg-grey-50 px-4 py-5 text-sm">
        <Lockup />
        <div className="flex flex-col gap-1">
          <div className="text-xs text-ink-muted">Workspace</div>
          <div className="flex items-center justify-between gap-2">
            {memberships.length > 1
              ? <WorkspaceSwitcher current={current.workspace.id} options={memberships.map((w) => ({ id: w.id, name: w.name }))} />
              : <div className="font-medium">{current.workspace.name}</div>}
            <Link href="/app/settings" className="shrink-0 px-2 text-[13px] font-medium text-teal-700">Settings</Link>
          </div>
          <div className="text-xs text-ink-muted">{memberRows.length === 1 ? "1 member" : `${memberRows.length} members`}</div>
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <div className="text-xs text-ink-muted">Projects</div>
            <Link href="/app" className="px-2 text-[13px] font-medium text-teal-700">All</Link>
          </div>
          {projectRows.filter((p) => p.archivedAt === null).map((p) => (
            <Link key={p.id} href={`/app/projects/${p.id}/import`} className="flex min-h-9 items-center justify-between gap-2 rounded-md px-2.5 py-2 text-ink-soft hover:bg-white">
              <span className="truncate">{p.name}</span>
              {p.isSample && <NeutralPill className="h-[18px] text-[11px]">Sample</NeutralPill>}
            </Link>
          ))}
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
