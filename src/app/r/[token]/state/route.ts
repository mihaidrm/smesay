// The link's state for the respondent app (stories/E6-4, acceptance 4): GET /r/[token]/state
// gives { state } with 200 (open, notOpen, passcode), 404 (unknown) or 410 (revoked,
// closed), never anything about the project or the answers (SECURITY.md: a revoked or
// closed link returns a page or a status, not data). The open page polls it every
// LINK_POLL_SECONDS (link-watch.tsx) and reloads itself on anything but 200; E7-3's
// autosave route uses the same check before a write. Not cached. Route handlers:
// node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md.
import { linkStatus, PASSCODE_COOKIE } from "@/lib/link-access";
import { cookieValue } from "@/lib/request-cookies";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const result = await linkStatus(token, cookieValue(request, PASSCODE_COOKIE));
  return Response.json({ state: result.state }, { status: result.status, headers: { "cache-control": "no-store" } });
}
