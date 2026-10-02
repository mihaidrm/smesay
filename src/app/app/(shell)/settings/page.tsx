// Workspace settings (stories/E2-5, acceptance 1; stories/E2-4, acceptance 1; the PM app board,
// Settings): the brand card (name, logo, accent), the AI budget card with the usage line
// (stories/E2-6, acceptance 3), the Plan card, and the Members
// section. Owners see the forms and controls; members see the values and the list. The server
// refuses what the UI hides (src/lib/brand.ts, src/lib/members.ts). Copy: docs/copy/app.md,
// errors.md.
import { requireCurrentWorkspace } from "@/lib/current-workspace";
import { accentContrast, BRAND_COPY } from "@/lib/brand-rules";
import { listMembersAndInvites } from "@/lib/members";
import { can } from "@/lib/permissions";
import { members } from "@/db/queries";
import { usage } from "@/db/queries/usage";
import { BrandForm } from "./brand";
import { InviteForm, MemberRow } from "./members";

const EUR = (cents: number) => `EUR ${(cents / 100).toFixed(2)}`;

const DATE = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

export default async function SettingsPage() {
  const { session, current } = await requireCurrentWorkspace("/app/settings");
  const me = await members.get(current.ws, session.user.id);
  const manage = me !== null && can(me.role, "members.invite");
  const brandManage = me !== null && can(me.role, "workspace.rename");
  const { members: rows, invited } = await listMembersAndInvites(current.ws);
  const owners = rows.filter((m) => m.role === "owner").length;
  const used = await usage(current.ws);
  const spentCents = used.aiCostCentsThisMonth;
  const n = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;
  const { workspace } = current;
  const logoUrl = workspace.logoObjectKey ? `/brand/${workspace.id}/logo?v=${encodeURIComponent(workspace.logoObjectKey.slice(-20))}` : null;
  const ratio = accentContrast(workspace.accentHex);
  return (
    <main className="flex flex-col gap-5 px-8 py-6">
      <div className="flex flex-col gap-1">
        <div className="text-xs text-ink-muted" data-testid="breadcrumb">{workspace.name}</div>
        <h1 className="text-2xl font-normal">Workspace settings</h1>
        <p className="text-ink-muted">Name, logo and accent appear on every instrument.</p>
      </div>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="rounded-md border border-hairline" aria-labelledby="brand-title">
          <h2 id="brand-title" className="border-b border-hairline px-4 py-3 font-medium">Brand on the respondent side</h2>
          {brandManage ? <BrandForm name={workspace.name} accentHex={workspace.accentHex} logoUrl={logoUrl} /> : (
            <dl className="flex flex-col gap-3 px-4 py-4 text-sm">
              <div><dt className="text-xs text-ink-muted">Workspace name</dt><dd className="font-medium">{workspace.name}</dd></div>
              {/* eslint-disable-next-line @next/next/no-img-element -- the app's own route at 40 px */}
              <div><dt className="text-xs text-ink-muted">Logo</dt><dd>{logoUrl ? <img src={logoUrl} alt="" width={40} height={40} className="size-10 rounded-lg object-contain" /> : "No logo yet"}</dd></div>
              <div><dt className="text-xs text-ink-muted">Accent colour</dt><dd className="flex items-center gap-2">{workspace.accentHex ? <><span className="block size-5 rounded border border-hairline" style={{ background: workspace.accentHex }} aria-hidden="true" /><span className="font-mono">{workspace.accentHex}</span>{ratio !== null && <span className="text-xs text-ink-muted">Contrast on white {ratio.toFixed(2)}:1</span>}</> : BRAND_COPY.noAccent}</dd></div>
            </dl>
          )}
        </section>
        <div className="flex flex-col gap-5">
          <section className="rounded-md border border-hairline" aria-labelledby="budget-title">
            <h2 id="budget-title" className="border-b border-hairline px-4 py-3 font-medium">AI budget</h2>
            <div className="flex flex-col gap-2 px-4 py-4 text-sm">
              <div className="font-mono" data-testid="budget-line">{`EUR ${workspace.aiBudgetEur.toFixed(2)} per month, ${EUR(spentCents)} used this month`}</div>
              <div className="h-1.5 rounded-full bg-greige"><div className="h-1.5 rounded-full bg-ink" style={{ width: `${Math.min(100, Math.max(1, (spentCents / 100) / workspace.aiBudgetEur * 100))}%`, minWidth: 4 }} /></div>
              <div className="text-xs text-ink-muted">The budget is not editable on the Free plan.</div>
              <div className="text-xs text-ink-muted" data-testid="usage-line">{`${n(used.projects, "project", "projects")}, ${n(used.responsesThisMonth, "response", "responses")} this month, ${n(used.aiRunsThisMonth, "AI run", "AI runs")} this month.`}</div>
            </div>
          </section>
          <section className="rounded-md border border-hairline" aria-labelledby="plan-title">
            <h2 id="plan-title" className="border-b border-hairline px-4 py-3 font-medium">Plan</h2>
            <div className="flex flex-col gap-1.5 px-4 py-4 text-sm">
              <div><span className="font-medium">Free</span> <span className="ml-1 rounded-full bg-teal-50 px-2 py-0.5 text-xs text-teal-900">While we build it with the first users</span></div>
              <div className="text-xs text-ink-muted">Paid plans come later. Nothing you build now is lost or locked.</div>
            </div>
          </section>
        </div>
      </div>
      <section className="rounded-md border border-hairline" aria-labelledby="members-title">
        <div className="flex items-center justify-between gap-4 border-b border-hairline px-4 py-3">
          <h2 id="members-title" className="font-medium">Members</h2>
          <span className="text-xs text-ink-muted">Owners manage the workspace and its members. Members can do everything else.</span>
        </div>
        <div className="flex h-8 items-center gap-4 border-b border-hairline bg-grey-50 px-4 text-xs text-ink-muted">
          <div className="flex-grow">Name</div>
          <div className="w-[260px]">Email</div>
          <div className="w-[140px]">Role</div>
          <div className="w-[160px]">Joined</div>
          <div className="w-[90px]"></div>
        </div>
        {rows.map((m) => (
          <MemberRow key={m.userId} userId={m.userId} name={m.name} email={m.email} role={m.role} joined={DATE.format(m.createdAt)}
            manage={manage} self={m.userId === session.user.id} lastOwner={m.role === "owner" && owners <= 1} />
        ))}
        {invited.map((i) => (
          <div key={i.id} data-testid="invited-row" className="flex min-h-9 items-center gap-4 border-b border-grey-100 px-4 py-2 text-ink-muted">
            <div className="flex-grow">Invited</div>
            <div className="w-[260px]">{i.email}</div>
            <div className="w-[140px]">{i.role === "owner" ? "Owner" : "Member"}</div>
            <div className="w-[160px]">{DATE.format(i.invitedAt)}</div>
            <div className="w-[90px]"></div>
          </div>
        ))}
        {manage && <InviteForm />}
      </section>
    </main>
  );
}
