// The respondent side's one way in (stories/E6-1, E7-1; stories/E1-3 out of scope: "access by
// token, not session"): a link row found by its token, with the instrument, the project and
// the workspace's public brand it belongs to. The token is the credential, 128 bits from
// crypto.randomBytes (SECURITY.md), so this read takes no workspace id; it returns one row
// for a token that exists and null for anything else, and nothing is listed. The rows come
// back with their workspace id as a WorkspaceId (the brand only src/db and
// src/lib/workspace.ts may produce; here the token proved the access, so the respondent
// routes can call the scoped helpers for the link's items); an archived project's link
// comes back too, and src/lib/link-access.ts shows it as closed. Nothing here writes.
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { instrument, invite, project, workspace } from "@/db/schema";
import type { WorkspaceId } from "@/db/types";
import type { Instrument } from "./instruments";
import type { Invite } from "./invites";
import type { Project } from "./projects";
import { unsafeWorkspaceId } from "./scoped";

export type Link = { ws: WorkspaceId; invite: Invite; instrument: Instrument; project: Project; brand: { name: string; accentHex: string | null; logoObjectKey: string | null } };

export const links = {
  byToken: async (token: string): Promise<Link | null> => {
    if (typeof token !== "string" || token.length < 32 || token.length > 128 || !/^[0-9a-f]+$/i.test(token)) return null;
    const rows = await db.select({ invite, instrument, project, name: workspace.name, accentHex: workspace.accentHex, logoObjectKey: workspace.logoObjectKey })
      .from(invite)
      .innerJoin(instrument, eq(instrument.id, invite.instrumentId))
      .innerJoin(project, eq(project.id, instrument.projectId))
      .innerJoin(workspace, eq(workspace.id, invite.workspaceId))
      .where(eq(invite.token, token)).limit(1);
    const row = rows[0];
    if (!row) return null;
    return { ws: unsafeWorkspaceId(row.invite.workspaceId), invite: row.invite, instrument: row.instrument, project: row.project, brand: { name: row.name, accentHex: row.accentHex, logoObjectKey: row.logoObjectKey } };
  },
};
