// A workspace's admin page (stories/E14-2, acceptance 2): its settings, and seen nowhere else
// (decision 0036) its AI budget and spend; the members with roles, the open invitations with
// their expiry, the projects with status, item count and latest version, each project's
// instruments with state, links and dates, the uploads, the last 20 product events and the
// support notes. No respondent names and no answers. The reads compose the product's own
// helpers (members, projects.summaries, usage) with the WorkspaceId adminWorkspace() gives, so a
// bug in a helper shows the same to the owner and the admin. The actions (acceptance 3) are in
// ./actions.ts behind a confirm line (src/app/admin/confirm-form.tsx). Copy: docs/copy/app.md, Admin
// workspace page.
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { projects, workspaceInvites } from "@/db/queries";
import { adminNotes, adminWorkspace, projectVersions, workspaceEvents, workspaceInstruments, workspaceUploads } from "@/db/queries/admin";
import { usage } from "@/db/queries/usage";
import type { AdminProof, WorkspaceId } from "@/db/types";
import type { Workspace } from "@/db/queries/workspaces";
import { requireAdmin } from "@/lib/admin";
import { WORKSPACE_ADMIN_COPY as C, formatBytes, instrumentState } from "@/lib/admin-copy";
import { formatEur } from "@/lib/ai/prices";
import { INVITE_VALID_MINUTES } from "@/lib/invites";
import { listMembersAndInvites } from "@/lib/members";
import { PLANS } from "@/lib/plans";
import { projectStatus } from "@/lib/project-status";
import { addNoteAction, changePlanAction, resendInviteAction, restoreAction, revokeLinkAction, setBudgetAction } from "./actions";
import { ConfirmForm } from "../../confirm-form";

export const dynamic = "force-dynamic";

const DAY = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const TIME = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
const SELECT = "h-8 rounded-xl border border-hairline-strong bg-surface px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-ground";
const TH = "px-3 py-2 text-left text-xs font-semibold text-ink-muted";
const TD = "border-t border-hairline px-3 py-2 align-top";

export default async function WorkspaceAdminPage({ params }: { params: Promise<{ id: string }> }) {
  const { proof } = await requireAdmin();
  const found = await adminWorkspace(proof, (await params).id);
  if (!found) notFound();
  const { workspace: w } = found;
  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-8 py-6" data-testid="admin-workspace">
      <div className="flex flex-col gap-1">
        <Link href="/admin/workspaces" className="self-start text-[13px] text-violet-text underline-offset-4 hover:underline">{C.back}</Link>
        <h1 className="text-[30px] font-extrabold leading-9 tracking-[-0.03em]">{w.name}</h1>
      </div>
      <Suspense fallback={<p className="text-ink-muted" aria-busy="true" data-testid="admin-loading">{C.loading}</p>}>
        <Detail proof={proof} ws={found.ws} w={w} />
      </Suspense>
    </main>
  );
}

function Section({ title, children, testId }: { title: string; children: React.ReactNode; testId: string }) {
  return (
    <section className="card flex flex-col gap-3 px-5 py-4" data-testid={testId}>
      <h2 className="text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}

async function Detail({ proof, ws, w }: { proof: AdminProof; ws: WorkspaceId; w: Workspace }) {
  const [people, invitations, active, archived, instruments, versions, uploads, events, notes, used] = await Promise.all([
    listMembersAndInvites(ws), workspaceInvites.list(ws), projects.summaries(ws), projects.summaries(ws, { archived: true }), workspaceInstruments(proof, ws), projectVersions(proof, ws),
    workspaceUploads(proof, ws), workspaceEvents(proof, ws, 20), adminNotes.list(proof, ws), usage(ws),
  ]);
  const now = new Date();
  // Every invitation not yet accepted, the expired ones too, so one that "did not work" an hour
  // ago can be sent again; listMembersAndInvites gives the ones still within their minutes.
  const waiting = invitations.filter((i) => i.acceptedAt === null).sort((a, b) => b.invitedAt.getTime() - a.invitedAt.getTime());
  const open = new Set(people.invited.map((i) => i.id));
  // Revoke is offered where the product would do it (src/lib/sharing.ts own): not on the sample,
  // an archived project or an instrument replaced by a newer one, and not in a deleted workspace.
  const latest = new Map<string, string>();
  for (const i of instruments) latest.set(i.projectId, i.id);
  const noRevoke = (p: { id: string; isSample: boolean; archivedAt: Date | null }, instrumentId: string): string | null =>
    w.deletedAt ? C.noRevoke.deleted : p.isSample ? C.noRevoke.sample : p.archivedAt ? C.noRevoke.archived : latest.get(p.id) !== instrumentId ? C.noRevoke.replaced : null;
  const hidden = { workspaceId: w.id };
  const all = [...active, ...archived];
  const projectName = new Map(all.map((p) => [p.id, p.name]));
  return (
    <>
      {w.deletedAt && (
        <Section title={C.sections.deleted} testId="admin-deleted">
          <p>{C.deletedLine(TIME.format(w.deletedAt), people.members.find((m) => m.userId === w.deletedBy)?.email ?? null)}</p>
          <ConfirmForm action={restoreAction} hidden={hidden} label={C.restore} confirmLine={C.confirmRestore(w.name)} testId="restore-form" />
        </Section>
      )}
      <div className="grid grid-cols-2 gap-6">
        <Section title={C.sections.settings} testId="admin-settings">
          <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-1 text-sm">
            <dt className="text-ink-muted">{C.settings.slug}</dt><dd className="font-mono">{w.slug}</dd>
            <dt className="text-ink-muted">{C.settings.accent}</dt><dd className="font-mono">{w.accentHex ?? C.settings.accentNone}</dd>
            <dt className="text-ink-muted">{C.settings.logo}</dt><dd>{w.logoObjectKey ? C.settings.logoSet : C.settings.logoNone}</dd>
            <dt className="text-ink-muted">{C.settings.plan}</dt><dd data-testid="admin-plan">{C.plans[w.plan]}</dd>
            <dt className="text-ink-muted">{C.settings.created}</dt><dd>{DAY.format(w.createdAt)}</dd>
          </dl>
          <ConfirmForm action={changePlanAction} hidden={hidden} label={C.changePlan} confirmLine={C.confirmPlan(w.name)} valueField="plan" valueLabels={C.plans} testId="plan-form">
            <label className="flex flex-col gap-1 text-[13px] font-semibold text-ink-muted">
              {C.planLabel}
              <select name="plan" defaultValue={w.plan} className={SELECT}>
                {Object.values(PLANS).map((p) => <option key={p.key} value={p.key}>{p.name}</option>)}
              </select>
            </label>
          </ConfirmForm>
        </Section>
        <Section title={C.sections.budget} testId="admin-budget">
          <p className="text-sm">{C.budgetLine(formatEur(used.aiCostCentsThisMonth), w.aiBudgetEur)}</p>
          <ConfirmForm action={setBudgetAction} hidden={hidden} label={C.setBudget} confirmLine={C.confirmBudget(w.name)} valueField="budget" testId="budget-form">
            <label className="flex flex-col gap-1 text-[13px] font-semibold text-ink-muted">
              {C.budgetLabel}
              <input name="budget" inputMode="numeric" defaultValue={w.aiBudgetEur} className={`${SELECT} w-32`} />
            </label>
          </ConfirmForm>
        </Section>
      </div>
      <Section title={C.sections.members} testId="admin-members">
        {people.members.length === 0 ? <p className="text-sm text-ink-muted">{C.noMembers}</p> : <table className="w-full text-sm">
          <thead><tr><th className={TH}>{C.memberColumns.name}</th><th className={TH}>{C.memberColumns.email}</th><th className={TH}>{C.memberColumns.role}</th><th className={TH}>{C.memberColumns.joined}</th></tr></thead>
          <tbody>{people.members.map((m) => <tr key={m.userId}><td className={TD}>{m.name}</td><td className={TD}>{m.email}</td><td className={TD}>{C.roles[m.role]}</td><td className={TD}>{DAY.format(m.createdAt)}</td></tr>)}</tbody>
        </table>}
      </Section>
      <Section title={C.sections.invites} testId="admin-invites">
        {waiting.length === 0 ? <p className="text-sm text-ink-muted">{C.noInvites}</p> : (
          <table className="w-full text-sm">
            <thead><tr><th className={TH}>{C.inviteColumns.email}</th><th className={TH}>{C.inviteColumns.invited}</th><th className={TH}>{C.inviteColumns.expires}</th><th className={TH} /></tr></thead>
            <tbody>{waiting.map((i) => {
              const expires = TIME.format(new Date(i.invitedAt.getTime() + INVITE_VALID_MINUTES * 60_000));
              return (
                <tr key={i.id} data-testid="admin-invite">
                  <td className={TD}>{i.email}</td><td className={TD}>{TIME.format(i.invitedAt)}</td>
                  <td className={TD}>{open.has(i.id) ? expires : C.expired(expires)}</td>
                  <td className={TD}>{!w.deletedAt && <ConfirmForm action={resendInviteAction} hidden={{ ...hidden, inviteId: i.id }} label={C.resend} confirmLine={C.confirmResend(i.email)} testId="resend-form" />}</td>
                </tr>
              );
            })}</tbody>
          </table>
        )}
      </Section>
      <Section title={C.sections.projects} testId="admin-projects">
        {all.length === 0 ? <p className="text-sm text-ink-muted">{C.noProjects}</p> : all.map((p) => (
          <div key={p.id} className="flex flex-col gap-2 border-t border-hairline pt-3 first-of-type:border-t-0 first-of-type:pt-0" data-testid="admin-project">
            <div className="flex flex-wrap items-baseline gap-x-4 text-sm">
              <span className="font-semibold">{p.name}</span>
              <span>{projectStatus(p, p.links, now)}</span>
              <span className="text-ink-muted">{C.items(p.items)}</span>
              <span className="text-ink-muted">{versions.has(p.id) ? C.version(versions.get(p.id)!) : C.never}</span>
              {p.archivedAt && <span className="text-ink-muted">{C.projectColumns.archived} {DAY.format(p.archivedAt)}</span>}
            </div>
            {instruments.some((i) => i.projectId === p.id) && (
              <table className="w-full text-sm">
                <thead><tr><th className={TH}>{C.instrumentColumns.title}</th><th className={TH}>{C.instrumentColumns.state}</th><th className={TH}>{C.instrumentColumns.version}</th><th className={TH}>{C.instrumentColumns.link}</th><th className={TH}>{C.instrumentColumns.created}</th><th className={TH}>{C.instrumentColumns.published}</th><th className={TH}>{C.instrumentColumns.opens}</th><th className={TH}>{C.instrumentColumns.closes}</th><th className={TH} /></tr></thead>
                <tbody>{instruments.filter((i) => i.projectId === p.id).map((i) => {
                  const state = instrumentState(i.publishedAt, i.publicLink, now);
                  return (
                    <tr key={i.id} data-testid="admin-instrument">
                      <td className={TD}>{i.title}</td><td className={TD}>{C.states[state]}</td><td className={TD}>{C.version(i.version)}</td>
                      <td className={TD}>{C.links(i.publicLink !== null, i.personalLinks)}</td>
                      <td className={TD}>{TIME.format(i.createdAt)}</td>
                      <td className={TD}>{i.publishedAt ? TIME.format(i.publishedAt) : C.never}</td>
                      <td className={TD}>{i.publicLink?.opensAt ? TIME.format(i.publicLink.opensAt) : C.never}</td>
                      <td className={TD}>{i.publicLink?.closesAt ? TIME.format(i.publicLink.closesAt) : C.never}</td>
                      <td className={TD}>{i.publicLink && !i.publicLink.revokedAt && (noRevoke(p, i.id) !== null ? <span className="text-xs text-ink-muted">{noRevoke(p, i.id)}</span> : (
                        <ConfirmForm action={revokeLinkAction} hidden={{ ...hidden, projectId: p.id, instrumentId: i.id, inviteId: i.publicLink.id }} label={C.revoke} confirmLine={C.confirmRevoke(i.title)} variant="destructive" testId="revoke-form" />
                      ))}</td>
                    </tr>
                  );
                })}</tbody>
              </table>
            )}
          </div>
        ))}
      </Section>
      <Section title={C.sections.uploads} testId="admin-uploads">
        {uploads.length === 0 ? <p className="text-sm text-ink-muted">{C.noUploads}</p> : (
          <table className="w-full text-sm">
            <thead><tr><th className={TH}>{C.uploadColumns.file}</th><th className={TH}>{C.projectColumns.name}</th><th className={TH}>{C.uploadColumns.kind}</th><th className={TH}>{C.uploadColumns.size}</th><th className={TH}>{C.uploadColumns.date}</th></tr></thead>
            <tbody>{uploads.map((u) => <tr key={u.id}><td className={TD}>{u.filename}</td><td className={TD}>{projectName.get(u.projectId) ?? ""}</td><td className={TD}>{u.kind}</td><td className={TD}>{formatBytes(u.byteSize)}</td><td className={TD}>{TIME.format(u.createdAt)}</td></tr>)}</tbody>
          </table>
        )}
      </Section>
      <Section title={C.sections.events} testId="admin-events">
        {events.length === 0 ? <p className="text-sm text-ink-muted">{C.noEvents}</p> : (
          <ul className="flex flex-col gap-1 font-mono text-xs">{events.map((e, k) => <li key={k}>{TIME.format(e.createdAt)} {e.name} {Object.entries(e.properties).map(([a, b]) => `${a}=${b}`).join(" ")}</li>)}</ul>
        )}
      </Section>
      <Section title={C.sections.notes} testId="admin-notes">
        {notes.length === 0 ? <p className="text-sm text-ink-muted">{C.noNotes}</p> : (
          <ul className="flex flex-col gap-2 text-sm">{notes.map((n) => <li key={n.id} className="flex flex-col"><span className="text-xs text-ink-muted">{TIME.format(n.createdAt)}, {n.adminEmail ?? C.deletedAdmin}</span><span className="whitespace-pre-wrap">{n.text}</span></li>)}</ul>
        )}
        <ConfirmForm action={addNoteAction} hidden={hidden} label={C.addNote} confirmLine={C.confirmNote} testId="note-form">
          <label className="flex w-full flex-col gap-1 text-[13px] font-semibold text-ink-muted">
            {C.noteLabel}
            <textarea name="note" rows={3} maxLength={2000} className="w-full rounded-xl border border-hairline-strong bg-surface px-3 py-2 text-sm font-normal text-ink outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-ground" />
          </label>
        </ConfirmForm>
      </Section>
    </>
  );
}
