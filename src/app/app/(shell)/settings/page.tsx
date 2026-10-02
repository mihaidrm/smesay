// Workspace settings (stories/E2-4, acceptance 1; the PM app board, Settings): the Members
// section only in this story; E2-5 adds the name, logo, accent and budget above it. Owners see
// the invite form, the role control and Remove; members see the list. The server refuses what
// the UI hides (src/lib/members.ts). Copy: docs/copy/app.md, errors.md.
import { requireCurrentWorkspace } from "@/lib/current-workspace";
import { listMembersAndInvites } from "@/lib/members";
import { can } from "@/lib/permissions";
import { members } from "@/db/queries";
import { InviteForm, MemberRow } from "./members";

const DATE = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

export default async function SettingsPage() {
  const { session, current } = await requireCurrentWorkspace("/app/settings");
  const me = await members.get(current.ws, session.user.id);
  const manage = me !== null && can(me.role, "members.invite");
  const { members: rows, invited } = await listMembersAndInvites(current.ws);
  const owners = rows.filter((m) => m.role === "owner").length;
  return (
    <main className="flex flex-col gap-5 px-8 py-6">
      <div className="flex flex-col gap-1">
        <div className="text-xs text-ink-muted" data-testid="breadcrumb">{current.workspace.name}</div>
        <h1 className="text-2xl font-normal">Workspace settings</h1>
        <p className="text-ink-muted">Who can work in this workspace.</p>
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
