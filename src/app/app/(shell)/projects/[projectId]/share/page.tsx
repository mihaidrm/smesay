// Share (stories/E6-1; the PM app board, Share): the public link card with its state pill
// (Draft, Published; Revoked is E6-4), the note for the state, the link with Copy link once
// published, the open and close date-times, the passcode and Publish or Save. Without an
// instrument the page points to Build. The sample shows its link read-only (E8-8). Personal
// invites (E6-2) and reminders (E6-3) come under this card. Copy: docs/copy/app.md (Share).
import Link from "next/link";
import { notFound } from "next/navigation";
import { instruments, invites, itemSets, projects } from "@/db/queries";
import { NeutralPill, StatusPill } from "@/components/ui/status-pill";
import { BUILD_COPY } from "@/lib/build-copy";
import { requireCurrentWorkspace } from "@/lib/current-workspace";
import { readAuthEnv } from "@/lib/auth";
import { formatUtc, linkState, SHARE_COPY } from "@/lib/sharing";
import { CopyLink } from "./copy-link";
import { ShareForm } from "./share-form";

export default async function SharePage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const { current } = await requireCurrentWorkspace(`/app/projects/${projectId}/share`);
  const project = await projects.get(current.ws, projectId);
  if (!project) notFound();
  const instrument = await instruments.latestForProject(current.ws, project.id);
  if (!instrument) {
    return (
      <div className="flex flex-col gap-5">
        <h2 className="text-xl font-bold tracking-[-0.02em]">{SHARE_COPY.title}</h2>
        <div className="flex flex-col items-start gap-2 rounded-2xl border border-dashed border-hairline-strong bg-surface p-6" data-testid="share-empty">
          <div className="font-semibold">{SHARE_COPY.noInstrument}</div>
          <Link href={`/app/projects/${project.id}/build`} className="text-sm underline underline-offset-4">{SHARE_COPY.noInstrumentLink}</Link>
        </div>
      </div>
    );
  }
  const builtOn = await itemSets.get(current.ws, instrument.itemSetId);
  const invite = await invites.publicForInstrument(current.ws, instrument.id);
  const state = linkState(invite);
  const url = invite ? `${readAuthEnv().baseURL}/r/${invite.token}` : null;
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold tracking-[-0.02em]">{SHARE_COPY.title}</h2>
        <p className="text-ink-muted">{SHARE_COPY.line} {builtOn && <span data-testid="share-version">{SHARE_COPY.version(builtOn.version)}</span>}</p>
      </div>
      <section className="card flex max-w-[720px] flex-col gap-4" aria-labelledby="share-link-title" data-testid="link-card" data-state={state}>
        <div className="flex items-center justify-between gap-3">
          <h3 id="share-link-title" className="text-[15px] font-bold">{SHARE_COPY.card}</h3>
          {state === "draft" ? <NeutralPill data-testid="link-state">{SHARE_COPY.states.draft}</NeutralPill> : state === "revoked" ? <NeutralPill data-testid="link-state">{SHARE_COPY.states.revoked}</NeutralPill> : <StatusPill status="agree" data-testid="link-state">{SHARE_COPY.states.published}</StatusPill>}
        </div>
        <p className="text-sm text-ink-muted" data-testid="link-note">
          {state === "draft" ? SHARE_COPY.notes.draft : state === "revoked" ? SHARE_COPY.notes.revoked : state === "closed" ? SHARE_COPY.closedNow : SHARE_COPY.notes.published}
        </p>
        {url && <CopyLink url={url} />}
        {project.isSample ? (
          <ul className="flex flex-col text-sm" data-testid="link-list">
            <li className="flex justify-between gap-4 py-2.5"><span>{SHARE_COPY.opensLabel}</span><span className="text-ink-muted">{invite?.opensAt ? formatUtc(invite.opensAt) : BUILD_COPY.off}</span></li>
            <li className="flex justify-between gap-4 border-t border-hairline py-2.5"><span>{SHARE_COPY.closesLabel}</span><span className="text-ink-muted">{invite?.closesAt ? formatUtc(invite.closesAt) : BUILD_COPY.off}</span></li>
            <li className="py-2.5 text-[13px] text-ink-muted">{BUILD_COPY.sample}</li>
          </ul>
        ) : (
          <ShareForm key={`${instrument.id}-${invite?.id ?? "draft"}-${invite?.passcodeHash ? "p" : "n"}`} projectId={project.id} instrumentId={instrument.id} published={invite !== null} opensAt={invite?.opensAt?.toISOString() ?? null} closesAt={invite?.closesAt?.toISOString() ?? null} hasPasscode={invite?.passcodeHash !== null && invite?.passcodeHash !== undefined} />
        )}
      </section>
    </div>
  );
}
