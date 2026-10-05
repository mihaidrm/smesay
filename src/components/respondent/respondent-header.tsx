// The respondent pages' header (stories/E7-1, acceptance 1; E7-7, acceptance 5; the
// respondent board, note 12): the PM's logo at 24 px when the workspace has one, else the
// workspace's initials on its accent, the workspace's name, and a note on the right (the
// close date, the progress, the save state), then the light and dark switch (design note 97).
// The logo comes from the workspace row through
// the link (/brand/[workspaceId]/logo, E2-5), never from the URL. Server and client safe.
import { cn } from "cn";
import { initials } from "@/components/app/tiles";
import { ACCENT_FILL, accentVars } from "@/lib/brand-rules";
import { ModeButton } from "./mode-button";

export function RespondentHeader({ workspaceName, accent, logoUrl = null, note = null, noteTestId = "respondent-note", children, className }: { workspaceName: string; accent: string; logoUrl?: string | null; note?: React.ReactNode; noteTestId?: string; children?: React.ReactNode; className?: string }) {
  return (
    <header className={cn("flex items-center gap-2.5 border-b border-hairline bg-surface px-5 pt-4 pb-3", className)} data-testid="respondent-header">
      {logoUrl ? (
        // A plain img: the logo is the workspace's own file, served by its route with its size.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt="" className="size-6 shrink-0 rounded-md object-contain" data-testid="respondent-logo" />
      ) : (
        <span aria-hidden="true" className={cn("flex size-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-extrabold", ACCENT_FILL)} style={accentVars(accent) as React.CSSProperties}>{initials(workspaceName)}</span>
      )}
      <span className="min-w-0 grow text-[15px] font-bold wrap-break-word hyphens-auto">{workspaceName}</span>
      {note && <span className="max-w-[40%] shrink-0 text-right font-mono text-xs text-ink-muted" data-testid={noteTestId}>{note}</span>}
      {children}
      <ModeButton />
    </header>
  );
}

export const logoUrlFor = (workspaceId: string, logoObjectKey: string | null): string | null => (logoObjectKey ? `/brand/${workspaceId}/logo?v=${encodeURIComponent(logoObjectKey.slice(-20))}` : null);
