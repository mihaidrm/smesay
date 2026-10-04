// A respondent's link (stories/E6-1, acceptance 2 to 4; stories/E7-1): the token names the
// link (src/lib/link-access.ts, no session), and each state has a page: unknown token, not
// yet open, closed, inactive (revoked, E6-4), passcode required, the sample project's link
// (it does not collect answers, E8-8 acceptance 2), and the open instrument. A closed
// personal link whose respondent answered at least one item and did not submit shows the
// respondent's own state (E7-1, acceptance 3; note 12, finding 33), and one with a submitted
// response its submitted line (E7-6), both clearing what the device kept for the link; a
// closed public link shows none (decision 0031). The open
// instrument is the respondent app (respondent-app.tsx) over this device's response (the
// personal invite's, or the one the device cookie names, src/lib/respondent.ts); a
// personal link carries the name and role the PM typed and does not ask them (E6-2). The
// open page watches its link (E6-4, link-watch.tsx). Every page is a page, never data
// (SECURITY.md). A closed, revoked or unknown link's page (a personal link renewed since)
// removes the answers this device kept unsent for it (forget-queue.tsx, E7-3). Dates are shown in UTC (src/lib/sharing.ts formatUtc).
// Copy: docs/copy/errors.md (Respondent link states), docs/copy/app.md (About you).
import { cookies } from "next/headers";
import { LinkPage } from "@/components/respondent/link-page";
import { logoUrlFor } from "@/components/respondent/respondent-header";
import { effectiveAccent } from "@/lib/brand-rules";
import { PASSCODE_COOKIE } from "@/lib/link-access";
import { DEVICE_COOKIE, loadRespondent } from "@/lib/respondent";
import { carriedFields, changedSinceSubmit, chaptersFor, landingOf, RESPONDENT_COPY, type Screen } from "@/lib/respondent-rules";
import { formatUtc } from "@/lib/sharing";
import { LINK_PAGE_COPY } from "@/lib/sharing-copy";
import { ForgetQueue } from "./forget-queue";
import { LinkWatch } from "./link-watch";
import { PasscodeForm } from "./passcode-form";
import { RespondentApp } from "./respondent-app";

export const dynamic = "force-dynamic";

export default async function LinkRoute({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ at?: string }> }) {
  const { token } = await params;
  const { at } = await searchParams;
  const store = await cookies();
  const view = await loadRespondent(token, { passcode: store.get(PASSCODE_COOKIE)?.value, device: store.get(DEVICE_COOKIE)?.value });
  if (view.kind === "unknown") {
    return <><ForgetQueue token={token} /><LinkPage workspaceName={null} accent="" title={LINK_PAGE_COPY.unknownTitle} line={LINK_PAGE_COPY.unknownLine} /></>;
  }
  const { link } = view;
  const accent = effectiveAccent(link.brand.accentHex);
  const logoUrl = logoUrlFor(link.ws, link.brand.logoObjectKey);
  const page = { workspaceName: link.brand.name, accent, logoUrl };
  if (view.kind === "sample") return <LinkPage {...page} title={RESPONDENT_COPY.sampleTitle} line={RESPONDENT_COPY.sampleLine(link.brand.name)} />;
  if (view.kind === "revoked") return <><ForgetQueue token={token} /><LinkPage {...page} title={LINK_PAGE_COPY.revokedTitle} line={LINK_PAGE_COPY.revokedLine(link.brand.name)} /></>;
  if (view.kind === "notOpen") return <LinkPage {...page} title={LINK_PAGE_COPY.notOpenTitle(formatUtc(link.invite.opensAt!))} line={LINK_PAGE_COPY.notOpenLine} />;
  if (view.kind === "closed") return <><ForgetQueue token={token} /><LinkPage {...page} title={LINK_PAGE_COPY.closedTitle} line={LINK_PAGE_COPY.closedLine(link.brand.name, link.project.name, formatUtc(view.closedAt))} /></>;
  if (view.kind === "closedOwn") {
    return (
      <LinkPage {...page} title={LINK_PAGE_COPY.closedTitle} line={LINK_PAGE_COPY.closedLine(link.brand.name, link.project.name, formatUtc(view.closedAt))}>
        <ForgetQueue token={token} />
        <p className="text-[17px] leading-[26px] text-ink-muted" data-testid="closed-own-state">{RESPONDENT_COPY.closedOwnState(view.answered, view.total)}</p>
      </LinkPage>
    );
  }
  if (view.kind === "passcode") {
    return (
      <LinkPage {...page} title={LINK_PAGE_COPY.passcodeTitle} line={LINK_PAGE_COPY.passcodeLine}>
        <PasscodeForm token={token} />
      </LinkPage>
    );
  }
  if (view.kind === "closedSubmitted") return <><ForgetQueue token={token} /><LinkPage {...page} title={LINK_PAGE_COPY.closedTitle} line={RESPONDENT_COPY.closedSubmitted(formatUtc(view.submittedAt), formatUtc(view.closedAt), view.changed)} /></>;
  if (view.kind !== "ready") return null;
  const { instrument } = link;
  const response = view.response;
  const picks = response?.perspectives ?? [];
  const chapters = chaptersFor(view.areas, view.items, picks);
  const prefilled = carriedFields(link.invite, instrument.respondentFields);
  // Where the visit lands, and "Welcome back" when it returns with answers (landingOf: E7-3,
  // acceptance 2; E7-4, acceptance 4); a submitted response lands on Done (E7-5).
  const landing = landingOf(chapters, view.answers, instrument.layout, at, response !== null, Boolean(response?.submittedAt));
  const firstName = (response?.fields.name ?? (link.invite.kind === "personal" ? link.invite.name : null) ?? "").trim().split(/\s+/)[0] || null;
  const welcome = landing.welcome ? { name: firstName, ...landing.welcome } : null;
  const screen: Screen = landing.screen;
  return (
    <>
      <LinkWatch token={token} />
      <RespondentApp
        token={token}
        workspaceName={link.brand.name}
        accent={accent}
        logoUrl={logoUrl}
        headerNote={link.invite.closesAt ? LINK_PAGE_COPY.closes(formatUtc(link.invite.closesAt)) : null}
        instrument={{ title: instrument.title, intro: instrument.intro, fields: instrument.respondentFields, perspectives: instrument.perspectives, method: instrument.method, labels: instrument.scaleLabels, showProposed: instrument.showProposed, layout: instrument.layout }}
        prefilled={link.invite.kind === "personal" ? prefilled : undefined}
        items={view.items}
        areas={view.areas}
        started={response !== null}
        initialFields={response?.fields ?? {}}
        initialPicks={picks}
        initialScreen={screen}
        initialItem={landing.item}
        answers={view.answers}
        versions={view.versions}
        wrap={view.wrap}
        wrapSync={view.wrapSync}
        responseId={response?.id ?? null}
        closing={instrument.closing}
        welcome={welcome}
        submitted={response?.submittedAt ? { at: response.submittedAt.toISOString(), name: firstName, returning: true } : null}
        changedSince={response ? changedSinceSubmit(response) : false}
        closesAt={link.invite.closesAt ? link.invite.closesAt.toISOString() : null}
      />
    </>
  );
}
