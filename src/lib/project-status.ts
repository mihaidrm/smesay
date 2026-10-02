// A project's status for the list (stories/E3-1, acceptance 1 and the technical notes): Sample
// when is_sample; Draft until an instrument is published (a link exists, E6); Open while a link
// is open (not revoked, opened, not yet closed); Closed when every link is closed or revoked.
// Pure, so the list and the tests share one rule.
export type ProjectStatus = "Sample" | "Draft" | "Open" | "Closed";
export type LinkWindow = { opensAt: Date | null; closesAt: Date | null; revokedAt: Date | null };

export function isLinkOpen(link: LinkWindow, now: Date): boolean {
  if (link.revokedAt) return false;
  if (link.opensAt && link.opensAt > now) return false;
  if (link.closesAt && link.closesAt <= now) return false;
  return true;
}

export function projectStatus(project: { isSample: boolean }, links: LinkWindow[], now = new Date()): ProjectStatus {
  if (project.isSample) return "Sample";
  if (links.length === 0) return "Draft";
  return links.some((l) => isLinkOpen(l, now)) ? "Open" : "Closed";
}
