// The admin shell (stories/E14-1, acceptance 2): the PM app's sidebar (the lockup, NavLink
// items, the signed-in email) with the admin pages, and "Back to the app". The admin check runs
// here, so the sidebar is never sent to anyone else, and every page and action runs it again
// itself: a layout's check does not run again on client navigation (node_modules/next/dist/docs/
// 01-app/02-guides/authentication.md, Layouts), so it guards nothing on its own
// (src/app/admin/admin-routes.test.ts checks each file). Desktop only, as the
// PM side in R1 (decision 0020). Each nav item arrived with its page: Workspaces with E14-2,
// People with E14-3. Copy: docs/copy/app.md, Admin shell.
import Link from "next/link";
import { ArrowLeft, Building, LayoutDashboard, ScrollText, Users } from "lucide-react";
import { NavLink } from "@/components/app/nav-link";
import { Lockup } from "@/components/brand/mark";
import { requireAdmin } from "@/lib/admin";
import { ADMIN_SHELL_COPY as C } from "@/lib/admin-copy";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { session } = await requireAdmin();
  return (
    <div className="flex min-h-screen items-start">
      <aside className="sticky top-0 flex h-screen w-[248px] shrink-0 flex-col gap-1.5 border-r border-hairline bg-surface px-3.5 py-[18px] text-sm" data-testid="admin-sidebar">
        <div className="px-2 pt-1 pb-1"><Lockup text={17} /></div>
        <div className="px-2 pb-4 text-xs font-semibold text-ink-muted">{C.area}</div>
        <nav aria-label={C.nav} className="flex flex-col gap-1.5">
          <NavLink href="/admin" exact icon={<LayoutDashboard aria-hidden="true" />}>{C.overview}</NavLink>
          <NavLink href="/admin/workspaces" icon={<Building aria-hidden="true" />}>{C.workspaces}</NavLink>
          <NavLink href="/admin/people" icon={<Users aria-hidden="true" />}>{C.people}</NavLink>
          <NavLink href="/admin/audit" icon={<ScrollText aria-hidden="true" />}>{C.audit}</NavLink>
        </nav>
        <div className="mt-auto flex flex-col gap-3">
          <Link href="/app" className="flex h-10 items-center gap-3 rounded-xl px-3 font-medium text-ink-muted transition-colors duration-150 outline-none hover:bg-tint hover:text-ink focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface [&_svg]:size-[18px]">
            <ArrowLeft aria-hidden="true" />{C.back}
          </Link>
          <div className="truncate px-2.5 text-xs text-ink-muted" title={session.user.email} data-testid="admin-email">{session.user.email}</div>
        </div>
      </aside>
      <div className="flex min-w-0 flex-grow flex-col">{children}</div>
    </div>
  );
}
