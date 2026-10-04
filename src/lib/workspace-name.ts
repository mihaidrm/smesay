// The workspace name and slug (stories/E2-3, acceptance 1 and the technical notes). The field
// starts empty (decision 0047). The slug is the name in lower case with runs of anything but
// letters and digits turned into one hyphen; a taken slug gets a short random suffix
// (src/db/queries/onboarding.ts). Validation runs on the server (CLAUDE.md, PM side); the
// schema is zod (zod.dev/api).
import { z } from "zod";

export const WORKSPACE_NAME_MAX = 80;

export const workspaceNameSchema = z.string().trim().min(1).max(WORKSPACE_NAME_MAX);
// docs/copy/errors.md, "Sign-in and workspace".
export const WORKSPACE_NAME_ERROR = `Enter a name for your workspace, up to ${WORKSPACE_NAME_MAX} characters.`;

export function slugFromName(name: string): string {
  const slug = name.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return slug || "workspace";
}
