// The respondent pages' header (stories/E7-1, acceptance 1; E7-7, acceptance 5; the
// respondent board, note 12): the PM's logo at 24 px when the workspace has one, else the
// workspace's initials on its accent, the workspace's name, and a note on the right (the
// close date, the progress, the save state). The logo comes from the workspace row through
// the link (/brand/[workspaceId]/logo, E2-5), never from the URL. Server and client safe.
import { initials } from "@/components/app/tiles";

export function RespondentHeader({ workspaceName, accent, logoUrl = null, note = null, noteTestId = "respondent-note", children }: { workspaceName: string; accent: string; logoUrl?: string | null; note?: React.ReactNode; noteTestId?: string; children?: React.ReactNode }) {
  return (
    <header className="flex items-center gap-2.5 border-b border-hairline bg-surface px-5 pt-4 pb-3" data-testid="respondent-header">
      {logoUrl ? (
        // A plain img: the logo is the workspace's own file, served by its route with its size.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt="" className="size-6 shrink-0 rounded-md object-contain" data-testid="respondent-logo" />
      ) : (
        <span aria-hidden="true" className="flex size-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-extrabold text-white" style={{ background: accent }}>{initials(workspaceName)}</span>
      )}
      <span className="grow text-[15px] font-bold">{workspaceName}</span>
      {note && <span className="font-mono text-xs text-ink-muted" data-testid={noteTestId}>{note}</span>}
      {children}
    </header>
  );
}

export const logoUrlFor = (workspaceId: string, logoObjectKey: string | null): string | null => (logoObjectKey ? `/brand/${workspaceId}/logo?v=${encodeURIComponent(logoObjectKey.slice(-20))}` : null);
