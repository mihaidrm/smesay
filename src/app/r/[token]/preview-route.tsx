// The builder's preview (stories/E5-6, acceptance 3 to 5 and 7): /r/[preview token] renders
// the real respondent app (respondent-app.tsx) for the project's draft, in preview mode, for
// the PM the token was made for, in their current workspace (the iframe sends their session;
// src/lib/preview-token.ts). It opens on the first chapter with the step's rings
// (?ring=...), the workspace's current brand, and on a phone (?device=phone) in a 390 px
// column. A token that is expired or not this PM's shows the unknown-link page; a revoked
// link on Share shows the withdrawn page (decision 0021, item 3). Nothing is stored: the app
// keeps everything in memory and the write routes refuse a preview token.
import { LinkPage } from "@/components/respondent/link-page";
import { logoUrlFor } from "@/components/respondent/respondent-header";
import { effectiveAccent, showsPoweredBy } from "@/lib/brand-rules";
import { getAppContext } from "@/lib/current-workspace";
import { loadPreview, parseRings, PREVIEW_STEPS, previewKey, type PreviewStep } from "@/lib/preview";
import { readPreviewToken } from "@/lib/preview-token";
import { EMPTY_WRAP } from "@/lib/respondent-rules";
import { formatUtc } from "@/lib/sharing";
import { LINK_PAGE_COPY, PREVIEW_PAGE_COPY } from "@/lib/sharing-copy";
import { RespondentApp } from "./respondent-app";

type Query = { ring?: string | string[]; step?: string | string[]; device?: string | string[] };

export async function PreviewRoute({ token, query }: { token: string; query: Query }) {
  const claim = readPreviewToken(token, previewKey());
  const ctx = claim ? await getAppContext(`/app/projects/${claim.project}`) : null;
  if (!claim || !ctx?.current || ctx.session.user.id !== claim.user || ctx.current.ws !== claim.ws) {
    return <LinkPage workspaceName={null} accent="" title={PREVIEW_PAGE_COPY.expiredTitle} line={PREVIEW_PAGE_COPY.expiredLine} poweredBy={false} />;
  }
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
  return (
    <div className={phone ? "mx-auto w-full max-w-[390px]" : undefined} data-preview-device={phone ? "phone" : "desktop"}>
      <RespondentApp
        token={token}
        workspaceName={workspace.name}
        accent={accent}
        logoUrl={page.logoUrl}
        headerNote={view.closesAt ? LINK_PAGE_COPY.closes(formatUtc(view.closesAt)) : null}
        instrument={{ title: spec.title, intro: spec.intro, fields: spec.respondentFields, perspectives: spec.perspectives, method: spec.method, labels: spec.scaleLabels, showProposed: spec.showProposed, layout: spec.layout }}
        prefilled={undefined}
        items={view.items}
        areas={view.areas}
        started
        initialFields={{}}
        initialPicks={[]}
        initialScreen={view.items.length > 0 ? { kind: "chapter", index: 0 } : { kind: "about" }}
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
        preview={{ rings: parseRings(query.ring) }}
      />
    </div>
  );
}
