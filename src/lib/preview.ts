// What the builder's preview shows (stories/E5-6): the project's draft as a respondent would
// get it, read for the workspace in the preview token. Import and Shape show the latest list
// (what the PM is changing there); Build and Share the list the draft is built on. Before
// Build has opened a draft the instrument's defaults stand in (the schema's: MoSCoW, the
// proposal shown, chapters, the default fields, the default Closing card), so Import and
// Shape have a preview from the first import. The project's link, when it has one, gives the
// closing date the header shows, and a revoked link shows the withdrawn page (decision 0021).
// Share previews the instrument holding the link in force, as its card shows it. The sample
// project has no preview (decision 0021, item 1): its data shows only under the watermark.
import { createHash, createHmac } from "node:crypto";
import { instruments, invites, projects } from "@/db/queries";
import type { Instrument } from "@/db/queries/instruments";
import type { WorkspaceId } from "@/db/types";
import { readAuthEnv } from "@/lib/auth";
import { PREVIEW_TTL_MS, previewToken } from "@/lib/preview-token";
import { DEFAULT_CLOSING } from "@/lib/closing";
import { latestSet } from "@/lib/imports";
import { DEFAULT_FIELDS } from "@/lib/respondent-fields";
import { itemsFor } from "@/lib/respondent";
import type { AreaMeta, RespondentItem } from "@/lib/respondent-rules";
import { linkState } from "@/lib/sharing";

export const PREVIEW_STEPS = ["import", "shape", "build", "share"] as const;
export type PreviewStep = (typeof PREVIEW_STEPS)[number];
export const PREVIEW_RINGS = ["nav", "cards", "wording", "rating", "fields", "closing", "note"] as const;
export type PreviewRing = (typeof PREVIEW_RINGS)[number];

// What each step changes, ringed in the preview (acceptance 2; decision 0021). Build rings the
// rating row and the chapter row (its Layout card changes the row), the About you fields and
// the Closing card's part of the Wrap up, as its own preview did (E5-1 to E5-5).
export const STEP_RINGS: Record<PreviewStep, PreviewRing[]> = {
  import: ["nav", "cards"],
  shape: ["wording"],
  build: ["rating", "nav", "fields", "closing"],
  share: ["note"],
};

export const parseRings = (v: string | string[] | undefined): PreviewRing[] =>
  typeof v === "string" ? v.split(",").filter((r): r is PreviewRing => (PREVIEW_RINGS as readonly string[]).includes(r)) : [];

export type PreviewSpec = Pick<Instrument, "title" | "intro" | "respondentFields" | "perspectives" | "method" | "scaleLabels" | "showProposed" | "layout" | "closing" | "itemSetId">;

export type PreviewView =
  | { kind: "none" }
  | { kind: "noList"; projectName: string }
  | { kind: "revoked" }
  | { kind: "ready"; spec: PreviewSpec; items: RespondentItem[]; areas: AreaMeta[]; closesAt: Date | null };

export async function loadPreview(ws: WorkspaceId, projectId: string, step: PreviewStep, now = new Date()): Promise<PreviewView> {
  const project = await projects.get(ws, projectId);
  if (!project || project.isSample) return { kind: "none" };
  const latest = await latestSet(ws, project.id);
  if (!latest) return { kind: "noList", projectName: project.name };
  const newest = await instruments.latestForProject(ws, project.id);
  const link = newest ? await invites.livePublic(ws, project.id) : null;
  if (step === "share" && linkState(link, now) === "revoked") return { kind: "revoked" };
  const instrument = step === "share" && link && newest && link.instrumentId !== newest.id ? ((await instruments.get(ws, link.instrumentId)) ?? newest) : newest;
  const base: PreviewSpec = instrument ?? { title: project.name, intro: null, respondentFields: DEFAULT_FIELDS, perspectives: [], method: "moscow", scaleLabels: null, showProposed: true, layout: "chapters", closing: DEFAULT_CLOSING, itemSetId: latest.id };
  const spec = step === "import" || step === "shape" ? { ...base, itemSetId: latest.id } : base;
  const { items, areas } = await itemsFor(ws, spec);
  return { kind: "ready", spec, items, areas, closesAt: link?.closesAt ?? null };
}

// The key the preview tokens are signed with: derived from the session secret, so a preview
// token is never valid as anything else (as the passcode proof's key, src/lib/link-access.ts).
export const previewKey = (): string => createHmac("sha256", readAuthEnv().secret).update("smesay-preview-token").digest("hex");

// The source of a step's preview, for this PM, with the step and its rings. It stays the same
// while what the preview shows stays the same (the token is made for the current hour and
// lasts through the next, so one to two hours, and `v` is a digest of the view), so a render of the step page that
// changes nothing does not reload the preview, and a save that changes it does.
export async function previewSrc(claim: { project: string; ws: WorkspaceId; user: string }, step: PreviewStep, now = Date.now()): Promise<string> {
  const view = await loadPreview(claim.ws, claim.project, step, new Date(now));
  const v = createHash("sha256").update(JSON.stringify(view)).digest("base64url").slice(0, 12);
  const hour = Math.floor(now / PREVIEW_TTL_MS) * PREVIEW_TTL_MS;
  return `/r/${previewToken(claim, previewKey(), hour + PREVIEW_TTL_MS)}?step=${step}&ring=${STEP_RINGS[step].join(",")}&v=${v}`;
}
