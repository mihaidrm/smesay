// A respondent's link (stories/E6-1, acceptance 2 to 4; stories/E7-1 fills the About you
// page in with Start, the device token and the header note): the token names the link
// (src/lib/link-access.ts, no session), and each state has a page: unknown token, not yet
// open, closed, inactive (revoked, E6-4), passcode required, and the instrument's About you
// page (the component the Build preview draws, src/components/respondent/about-you.tsx).
// Every page is a page, never data (SECURITY.md). Dates are shown in UTC
// (src/lib/sharing.ts formatUtc). Copy: docs/copy/errors.md (Respondent link states),
// docs/copy/app.md (About you).
import { cookies } from "next/headers";
import { items, itemSets } from "@/db/queries";
import { AboutYou } from "@/components/respondent/about-you";
import { LinkPage } from "@/components/respondent/link-page";
import { effectiveAccent } from "@/lib/brand-rules";
import { PASSCODE_COOKIE, viewLink } from "@/lib/link-access";
import { areaNames } from "@/lib/shaping";
import { formatUtc } from "@/lib/sharing";
import { LINK_PAGE_COPY } from "@/lib/sharing-copy";
import { PasscodeForm } from "./passcode-form";

export const dynamic = "force-dynamic";

export default async function LinkRoute({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const view = await viewLink(token, (await cookies()).get(PASSCODE_COOKIE)?.value);
  if (view.kind === "unknown") {
    return <LinkPage workspaceName={null} accent="" title={LINK_PAGE_COPY.unknownTitle} line={LINK_PAGE_COPY.unknownLine} />;
  }
  const { link } = view;
  const accent = effectiveAccent(link.brand.accentHex);
  if (view.kind === "revoked") return <LinkPage workspaceName={link.brand.name} accent={accent} title={LINK_PAGE_COPY.revokedTitle} line={LINK_PAGE_COPY.revokedLine(link.brand.name)} />;
  if (view.kind === "notOpen") return <LinkPage workspaceName={link.brand.name} accent={accent} title={LINK_PAGE_COPY.notOpenTitle(formatUtc(link.invite.opensAt!))} line={LINK_PAGE_COPY.notOpenLine} />;
  if (view.kind === "closed") return <LinkPage workspaceName={link.brand.name} accent={accent} title={LINK_PAGE_COPY.closedTitle} line={LINK_PAGE_COPY.closedLine(link.brand.name, link.project.name, formatUtc(view.closedAt))} />;
  if (view.kind === "passcode") {
    return (
      <LinkPage workspaceName={link.brand.name} accent={accent} title={LINK_PAGE_COPY.passcodeTitle} line={LINK_PAGE_COPY.passcodeLine}>
        <PasscodeForm token={token} />
      </LinkPage>
    );
  }
  // The scoped helpers take the link's workspace id; the token is what proved the access.
  const set = await itemSets.get(link.ws, link.instrument.itemSetId);
  const rows = set ? await items.forSet(link.ws, set.id) : [];
  const firstChapter = set ? (areaNames(set, rows)[0] ?? null) : null;
  return (
    <div className="mx-auto min-h-screen w-full max-w-[560px] bg-ground">
      <AboutYou workspaceName={link.brand.name} accent={accent} headerNote={link.invite.closesAt ? LINK_PAGE_COPY.closes(formatUtc(link.invite.closesAt)) : null} title={link.instrument.title} intro={link.instrument.intro} fields={link.instrument.respondentFields} firstChapter={firstChapter} perspectives={link.instrument.perspectives} className="min-h-screen" />
    </div>
  );
}
