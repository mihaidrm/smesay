// A respondent page that is not the instrument (stories/E6-1, acceptance 3; E7-1 acceptance
// 3): unknown link, not yet open, closed, inactive, and the passcode step. The workspace's
// name in the header when it is known, a title, one line, and "Powered by SMEsay" while the
// workspace is on the Free plan (none on the unknown-link page, which has no workspace); phone
// first; from a 576 px column the centered card of ./frame.ts, as About you (decision 0051;
// docs/design-system.md, Respondent columns). Returns
// a page, never data (SECURITY.md).
import type { ReactNode } from "react";
import { Mark } from "@/components/brand/mark";
import { RespondentHeader } from "./respondent-header";
import { cn } from "cn";
import { FRAME_CARD, FRAME_HEADER, FRAME_OUTER, FRAME_POWERED } from "./frame";
import { PoweredBy } from "./powered-by";

export function LinkPage({ workspaceName, accent, logoUrl = null, title, line, children, poweredBy = true }: { workspaceName: string | null; accent: string; logoUrl?: string | null; title: string; line: string; children?: ReactNode; poweredBy?: boolean }) {
  return (
    <div className={cn(FRAME_OUTER, "mx-auto w-full max-w-[752px]")} data-testid="link-page">
      <div className={FRAME_CARD}>
      {workspaceName ? (
        <RespondentHeader workspaceName={workspaceName} accent={accent} logoUrl={logoUrl} className={FRAME_HEADER} />
      ) : (
        <header className={cn("flex items-center gap-2.5 border-b border-hairline bg-surface px-5 pt-4 pb-3", FRAME_HEADER)}><span className="inline-flex items-center gap-2 text-[15px] font-bold"><Mark size={22} /> SMEsay</span></header>
      )}
      <main className="flex w-full grow flex-col gap-4 px-5 pt-6 pb-8 @xl:px-8">
        <h1 className="text-[22px] leading-7 font-extrabold tracking-[-0.025em]">{title}</h1>
        <p className="text-[17px] leading-[26px] text-ink-muted">{line}</p>
        {children}
      </main>
      </div>
      <PoweredBy show={poweredBy} className={FRAME_POWERED} />
    </div>
  );
}
