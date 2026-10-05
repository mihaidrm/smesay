// The signed-in shell (stories/E2-1, acceptance 5; stories/E2-3, acceptance 3; the PM app
// board, design v2, decision 0041): a 248 px sidebar on the surface with the lockup, the
// workspace chip (initials tile, the name or the switcher when the person belongs to more than
// one, the member count), the nav (Projects, Settings), the project list,
// then at the bottom the sample card, Help (the quickstart, stories/E12-2), Show tips (the
// guide's switch, stories/E15-1), the mode toggle and the signed-in email with Sign out.
// The sample opens on Results from the list and the card (stories/E8-8, acceptance 1).
// The sidebar is pinned to the viewport (sticky, the viewport's height) so the whole menu
// stays in view however long the page is; only its project list scrolls, inside the
// sidebar (Mihai, 2026-10-03).
// Route group, so /app/new and /app/switch render without it (node_modules/next/dist/docs/
// 01-app/03-api-reference/03-file-conventions/route-groups.md). Copy: docs/copy/app.md.
import Link from "next/link";
import { CircleHelp, LayoutGrid, Settings } from "lucide-react";
import { ModeToggle } from "@/components/app/mode-toggle";
import { NavLink } from "@/components/app/nav-link";
import { WorkspaceTile } from "@/components/app/tiles";
import { Lockup } from "@/components/brand/mark";
import { buttonVariants } from "@/components/ui/button";
import { NeutralPill } from "@/components/ui/status-pill";
import { guide, members, projects } from "@/db/queries";
import { ShowTips } from "@/components/app/show-tips";
import { requireCurrentWorkspace } from "@/lib/current-workspace";
import { QUICKSTART_COPY } from "@/lib/quickstart-copy";
import { SignOutButton } from "../sign-out-button";
import { PlausibleScript } from "@/components/analytics/plausible-script";
import { WorkspaceSwitcher } from "./workspace-switcher";
import { Button } from "@/components/ui/button";
import { VIEW_AS_COPY } from "@/lib/view-as-copy";
import { stopViewAction } from "../../admin/view-as/actions";

const VIEW_UNTIL = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { session, memberships, current, viewing } = await requireCurrentWorkspace("/app");
  const [memberRows, projectRows, guideState] = await Promise.all([members.list(current.ws), projects.list(current.ws), guide.state(session.user.id)]);
  const sample = projectRows.find((p) => p.isSample && p.archivedAt === null) ?? null;
  return (
    <div className="flex min-h-screen items-start">
      {!viewing && <PlausibleScript />}
      <aside className="sticky top-0 flex h-screen w-[248px] shrink-0 flex-col gap-1.5 border-r border-hairline bg-surface px-3.5 py-[18px] text-sm" data-testid="sidebar">
        <div className="px-2 pt-1 pb-4"><Lockup text={17} /></div>
        <div className="mb-2.5 flex items-center gap-2.5 rounded-xl bg-tint px-3 py-2.5">
          <WorkspaceTile name={current.workspace.name} />
          <div className="flex min-w-0 flex-grow flex-col">
            <div className="text-xs text-ink-muted">Workspace</div>
            {memberships.length > 1
              ? <WorkspaceSwitcher current={current.workspace.id} options={memberships.map((w) => ({ id: w.id, name: w.name }))} />
              : <div className="truncate font-semibold">{current.workspace.name}</div>}
            <div className="text-xs text-ink-muted">{memberRows.length === 1 ? "1 member" : `${memberRows.length} members`}</div>
          </div>
        </div>
        <NavLink href="/app" exact icon={<LayoutGrid aria-hidden="true" />}>Projects</NavLink>
        <NavLink href="/app/settings" icon={<Settings aria-hidden="true" />}>Settings</NavLink>
        <div className="mt-3 flex min-h-0 flex-col gap-1 overflow-y-auto">
          <div className="flex items-center justify-between px-3">
            <div className="text-xs text-ink-muted">Projects</div>
            <Link href="/app" className="rounded-sm text-xs font-semibold text-violet-text outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface">All</Link>
          </div>
          {projectRows.filter((p) => p.archivedAt === null).map((p) => (
            <Link key={p.id} href={`/app/projects/${p.id}/${p.isSample ? "results" : "import"}`} className="flex min-h-9 items-center justify-between gap-2 rounded-xl px-3 py-2 text-ink-soft transition-colors duration-150 outline-none hover:bg-tint hover:text-ink focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface">
              <span className="truncate">{p.name}</span>
              {p.isSample && <NeutralPill className="h-[18px] text-[11px]">Sample</NeutralPill>}
            </Link>
          ))}
        </div>
        <div className="mt-auto flex flex-col gap-3">
          {sample && (
            <div className="flex flex-col gap-2 rounded-xl border border-hairline-strong bg-[linear-gradient(135deg,var(--violet-soft),var(--surface))] p-3.5" data-testid="sample-card">
              <div className="text-[13px] font-bold">Try the sample</div>
              <div className="text-xs leading-[17px] text-ink-muted">{sample.name} has data on every screen and nothing to set up.</div>
              <Link href={`/app/projects/${sample.id}/results`} className={buttonVariants({ variant: "secondary", size: "small", className: "self-start" })}>Open the sample</Link>
            </div>
          )}
          <NavLink href="/app/quickstart" icon={<CircleHelp aria-hidden="true" />}>{QUICKSTART_COPY.help}</NavLink>
          <ShowTips on={!guideState.tipsOff} disabled={viewing !== null} />
          <ModeToggle />
          <div className="flex flex-col gap-2 px-2.5 text-ink-muted">
            <div className="truncate text-xs" title={session.user.email}>{session.user.email}</div>
            <SignOutButton />
          </div>
        </div>
      </aside>
      {viewing ? (
        <div className="flex min-w-0 flex-grow flex-col">
          {/* An admin's view (stories/E14-4, acceptances 2 and 3): the banner names the workspace and
              stops the view; every form control below is disabled through the fieldset
              (html.spec.whatwg.org/multipage/form-elements.html#the-fieldset-element), shown at
              the 40 percent the buttons take when disabled, while links still go everywhere. */}
          <div role="status" className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline-strong bg-violet-soft px-8 py-2.5 text-sm text-violet-text" data-testid="view-as-banner">
            <span className="font-semibold">{VIEW_AS_COPY.banner(viewing.workspace.name, VIEW_UNTIL.format(viewing.until))}</span>
            <form action={stopViewAction}><Button type="submit" variant="secondary" size="small">{VIEW_AS_COPY.stop}</Button></form>
          </div>
          <fieldset disabled className="flex min-w-0 flex-grow flex-col" data-testid="view-as-content">{children}</fieldset>
        </div>
      ) : <div className="flex min-w-0 flex-grow flex-col">{children}</div>}
    </div>
  );
}
