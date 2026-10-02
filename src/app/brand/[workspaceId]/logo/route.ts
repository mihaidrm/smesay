// The workspace logo (stories/E2-5): a public route, because the respondent page (E7) shows it
// to people with no session. It reveals the logo of a workspace id and nothing else
// (workspaces.publicBrand). Streamed from the object store with a day of caching; the Settings
// page and the respondent header add a version to the URL so a new logo shows at once. Route
// handlers and the params promise: node_modules/next/dist/docs/01-app/03-api-reference/
// 03-file-conventions/route.md.
import { workspaces } from "@/db/queries";
import { getObject } from "@/lib/storage";

export async function GET(_request: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await params;
  const brand = await workspaces.publicBrand(workspaceId);
  if (!brand?.logoObjectKey) return new Response(null, { status: 404 });
  const object = await getObject(brand.logoObjectKey);
  if (!object) return new Response(null, { status: 404 });
  // A Blob carries the bytes whatever buffer backs them (BodyInit in lib.dom.d.ts).
  return new Response(new Blob([object.body as BlobPart]), {
    headers: { "content-type": object.contentType, "cache-control": "public, max-age=3600", "content-security-policy": "default-src 'none'; sandbox", "x-content-type-options": "nosniff" },
  });
}
