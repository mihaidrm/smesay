// The builder's preview (stories/E5-6, acceptance 3 to 5 and 7): /r/[preview token] renders
// the real respondent app (respondent-app.tsx) for the project's draft, in preview mode, for
// the PM the token was made for, in their current workspace (the iframe sends their session;
// src/lib/preview-token.ts). It opens on the first chapter with the step's rings
// (?ring=...), the workspace's current brand, and on a phone (?device=phone) in a 390 px
// column; ?screen=wrap opens the Wrap up (the Closing card focused on Build). The panel asks
// for the compact view (?compact=1, decision 0061): the band, the header, the chapter row and
// the first card only, no rings; the full view (the panel's link) is the whole app with the
// rings. The band that says nothing is saved sits above the app, as the sample's does. A token that is
// expired or not this PM's shows the expired page, this PM's for another workspace a page
// saying to switch workspace (previewAccess); a revoked
// link on Share shows the withdrawn page (decision 0021, item 3). Nothing is stored: the app
// keeps everything in memory and the write routes refuse a preview token.
import { SampleBand } from "@/components/app/sample-band";
import { LinkPage } from "@/components/respondent/link-page";
import { logoUrlFor } from "@/components/respondent/respondent-header";
import { effectiveAccent, showsPoweredBy } from "@/lib/brand-rules";
import { ABOUT_YOU_COPY } from "@/lib/build-copy";
import { getAppContext } from "@/lib/current-workspace";
import { loadPreview, parseRings, PREVIEW_STEPS, previewKey, type PreviewStep } from "@/lib/preview";
import { previewAccess, readPreviewToken } from "@/lib/preview-token";
import { EMPTY_WRAP } from "@/lib/respondent-rules";
import { formatUtc } from "@/lib/sharing";
import { LINK_PAGE_COPY, PREVIEW_PAGE_COPY } from "@/lib/sharing-copy";
import { RespondentApp } from "./respondent-app";

type Query = { ring?: string | string[]; step?: string | string[]; device?: string | string[]; screen?: string | string[]; compact?: string | string[] };

export async function PreviewRoute({ token, query }: { token: string; query: Query }) {
  const claim = readPreviewToken(token, previewKey());
  const ctx = claim ? await getAppContext(`/app/projects/${claim.project}`) : null;
  const access = previewAccess(claim, ctx ? { user: ctx.session.user.id, ws: ctx.current?.ws ?? null } : null);
  if (access === "otherWorkspace") return <LinkPage workspaceName={null} accent="" title={PREVIEW_PAGE_COPY.otherWorkspaceTitle} line={PREVIEW_PAGE_COPY.otherWorkspaceLine} poweredBy={false} />;
  if (access === "expired" || !claim || !ctx?.current) return <LinkPage workspaceName={null} accent="" title={PREVIEW_PAGE_COPY.expiredTitle} line={PREVIEW_PAGE_COPY.expiredLine} poweredBy={false} />;
  const { workspace, ws } = ctx.current;
  const step: PreviewStep = typeof query.step === "string" && (PREVIEW_STEPS as readonly string[]).includes(query.step) ? (query.step as PreviewStep) : "build";
  const view = await loadPreview(ws, claim.project, step);
  const accent = effectiveAccent(workspace.accentHex);
  const page = { workspaceName: workspace.name, accent, logoUrl: logoUrlFor(ws, workspace.logoObjectKey), poweredBy: showsPoweredBy(workspace.plan) };
  if (view.kind === "none") return <LinkPage {...page} title={LINK_PAGE_COPY.unknownTitle} line={LINK_PAGE_COPY.unknownLine} />;
  if (view.kind === "noList") return <LinkPage {...page} title={view.projectName} line={PREVIEW_PAGE_COPY.noList} />;
  if (view.kind === "revoked") return <LinkPage {...page} title={LINK_PAGE_COPY.revokedTitle} line={LINK_PAGE_COPY.revokedLine(workspace.name)} />;
  const { spec } = view;
  const phone = query.device === "phone";
  const compact = query.compact === "1";
  return (
    <div className={phone ? "mx-auto w-full max-w-[390px]" : undefined} data-preview-device={phone ? "phone" : "desktop"} data-preview-compact={compact || undefined}>
      <SampleBand text={ABOUT_YOU_COPY.previewNote} testId="preview-note" className="rounded-none border-x-0 border-t-0 text-center" />
      <RespondentApp
        token={token}
        workspaceName={workspace.name}
        accent={accent}
        logoUrl={page.logoUrl}
        headerNote={view.closesAt ? LINK_PAGE_COPY.closes(formatUtc(view.closesAt)) : null}
        instrument={{ title: spec.title, intro: spec.intro, fields: spec.respondentFields, perspectives: spec.perspectives, method: spec.method, labels: spec.scaleLabels, showProposed: spec.showProposed, layout: spec.layout, reasonRule: spec.reasonRule }}
        prefilled={undefined}
        items={view.items}
        areas={view.areas}
        started
        initialFields={{}}
        initialPicks={[]}
        initialScreen={view.items.length === 0 ? { kind: "about" } : query.screen === "wrap" ? { kind: "wrap" } : { kind: "chapter", index: 0 }}
        initialItem={0}
        answers={{}}
        versions={{}}
        wrap={EMPTY_WRAP}
        wrapSync={{ version: 0, writer: null, writerSeq: 0 }}
        responseId={null}
        closing={spec.closing}
        welcome={null}
        submitted={null}
        changedSince={false}
        closesAt={view.closesAt ? view.closesAt.toISOString() : null}
        poweredBy={page.poweredBy}
        preview={{ rings: compact ? [] : parseRings(query.ring), compact }}
      />
    </div>
  );
}
