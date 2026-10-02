// The workspace's brand (stories/E2-5): name, logo and accent, saved by an owner and read by
// the respondent side (E7) through workspaces.publicBrand(). The accent is kept as typed; the
// respondent side uses effectiveAccent(), which falls back to the design system's teal when
// the colour is under 4.5:1 on white (docs/design-system.md, Respondent theming; WCAG 2.1
// contrast through src/lib/contrast.ts), and Settings shows the banner from docs/copy/errors.md.
// The logo goes to the object store under logos/<workspace id>/<random>.<png|svg>; the old
// object is removed after the new one is saved. Validation runs here, on the server.
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { members, workspaces } from "@/db/queries";
import type { WorkspaceId } from "@/db/types";
import { HEX, isReadableAccent, BRAND_COPY } from "@/lib/brand-rules";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { checkLogo } from "@/lib/logo";
import { can } from "@/lib/permissions";
import { deleteObject, putObject } from "@/lib/storage";
import { workspaceNameSchema, WORKSPACE_NAME_ERROR } from "@/lib/workspace-name";

export { accentContrast, BRAND_COPY, DEFAULT_ACCENT, effectiveAccent, HEX, isReadableAccent, MIN_CONTRAST } from "@/lib/brand-rules";

export type BrandInput = { name: unknown; accentHex: unknown; logo: { bytes: Uint8Array } | null; removeLogo: boolean };
export type BrandResult = { ok: true; tooLight: boolean } | { ok: false; error: string; field: "name" | "accentHex" | "logo" };

export async function saveBrand(actor: { ws: WorkspaceId; userId: string }, input: BrandInput): Promise<BrandResult> {
  const membership = await members.get(actor.ws, actor.userId);
  if (!membership) throw new NotFoundError();
  for (const action of ["workspace.rename", "workspace.accent", "workspace.logo"] as const) {
    if (!can(membership.role, action)) throw new ForbiddenError();
  }
  const name = workspaceNameSchema.safeParse(input.name);
  if (!name.success) return { ok: false, error: WORKSPACE_NAME_ERROR, field: "name" };
  const accentText = String(input.accentHex ?? "").trim();
  const accent = accentText === "" ? null : z.string().regex(HEX).safeParse(accentText);
  if (accent && !accent.success) return { ok: false, error: BRAND_COPY.badHex, field: "accentHex" };
  const accentHex = accent ? accent.data.toUpperCase() : null;

  const current = await workspaces.update(actor.ws, {});
  if (!current) throw new NotFoundError();
  let logoObjectKey = current.logoObjectKey;
  if (input.logo) {
    const check = checkLogo(input.logo.bytes);
    if (!check.ok) return { ok: false, error: check.error, field: "logo" };
    logoObjectKey = `logos/${actor.ws}/${randomBytes(8).toString("hex")}.${check.kind}`;
    await putObject(logoObjectKey, input.logo.bytes, check.contentType);
  } else if (input.removeLogo) {
    logoObjectKey = null;
  }
  await workspaces.update(actor.ws, { name: name.data, accentHex, logoObjectKey });
  if (current.logoObjectKey && current.logoObjectKey !== logoObjectKey) await deleteObject(current.logoObjectKey);
  return { ok: true, tooLight: accentHex !== null && !isReadableAccent(accentHex) };
}
