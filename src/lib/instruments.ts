// The instrument draft (stories/E5-1): Build opens the newest instrument of the project, or
// creates one on the latest set with the project's name as its title and Name and Role as
// its fields; the intro and the fields are saved with the server-side rule
// (src/lib/respondent-fields.ts); a newer set than the one the instrument is built on gets
// "Build on version N" (owed from E3-6, acceptance 3), which copies the draft onto that set.
// The WorkspaceId comes from the session; the project and the instrument ids from the form
// are only ever looked up inside it, so another workspace's id is 404. Only the newest
// instrument of the project can be edited or built on: a stale tab on an older one is
// refused with a message, so a draft that was replaced (and, from E6, published) keeps its
// title, intro and field keys. The sample is read-only on the server too (stories/E8-8,
// acceptance 2). Words: src/lib/build-copy.ts.
import { instruments, invites, itemSets, projects } from "@/db/queries";
import type { Instrument } from "@/db/queries/instruments";
import type { ItemSet } from "@/db/queries/itemSets";
import type { Project } from "@/db/queries/projects";
import type { WorkspaceId } from "@/db/types";
import { BUILD_COPY, INTRO_MAX, TITLE_MAX } from "@/lib/build-copy";
import { NotFoundError } from "@/lib/errors";
import { latestSet } from "@/lib/imports";
import { DEFAULT_FIELDS, parseFields } from "@/lib/respondent-fields";
import { isMethod, parseScaleLabels, SCORING_ERRORS } from "@/lib/scoring";

export { BUILD_COPY };

export type Draft = { instrument: Instrument; builtOn: ItemSet; newer: ItemSet | null };

// The draft Build shows. Null when the project has no set yet (the empty state). A project
// with a set and no instrument gets one here, on first open (acceptance 1); the sample
// always has one from the seed, so it is never created here.
export async function openDraft(ws: WorkspaceId, project: Project): Promise<Draft | null> {
  const latest = await latestSet(ws, project.id);
  if (!latest) return null;
  let instrument = await instruments.latestForProject(ws, project.id);
  if (!instrument) {
    if (project.isSample) return null;
    instrument = await instruments.createOnSet(ws, { projectId: project.id, itemSetId: latest.id, title: project.name, respondentFields: DEFAULT_FIELDS });
    if (!instrument) throw new NotFoundError();
  }
  const builtOn = instrument.itemSetId === latest.id ? latest : await itemSets.get(ws, instrument.itemSetId);
  if (!builtOn) throw new NotFoundError();
  return { instrument, builtOn, newer: builtOn.id === latest.id ? null : latest };
}

// The project and the instrument the form named, both in the workspace and the instrument in
// the project (404 otherwise), and the instrument the project's newest (a message otherwise).
async function own(ws: WorkspaceId, projectId: string, instrumentId: string): Promise<{ error: string } | { project: Project; instrument: Instrument }> {
  const project = await projects.get(ws, projectId);
  const instrument = await instruments.get(ws, instrumentId);
  if (!project || !instrument || instrument.projectId !== project.id) throw new NotFoundError();
  if (project.isSample) return { error: BUILD_COPY.sample };
  const latest = await instruments.latestForProject(ws, project.id);
  if (!latest || latest.id !== instrument.id) return { error: BUILD_COPY.replaced };
  return { project, instrument };
}

export async function saveIntro(ws: WorkspaceId, projectId: string, instrumentId: string, rawTitle: unknown, rawIntro: unknown): Promise<{ error: string } | { instrument: Instrument }> {
  const owned = await own(ws, projectId, instrumentId);
  if ("error" in owned) return owned;
  const title = String(rawTitle ?? "").trim();
  const intro = String(rawIntro ?? "").trim();
  if (title.length < 1 || title.length > TITLE_MAX) return { error: BUILD_COPY.badTitle };
  if (intro.length > INTRO_MAX) return { error: BUILD_COPY.longIntro };
  const instrument = await instruments.update(ws, instrumentId, { title, intro: intro || null });
  if (!instrument) throw new NotFoundError();
  return { instrument };
}

// rawFields is the form's JSON (one object per row, see FieldInput); parseFields applies
// the rule and writes the keys.
export async function saveFields(ws: WorkspaceId, projectId: string, instrumentId: string, rawFields: unknown): Promise<{ error: string } | { instrument: Instrument }> {
  const owned = await own(ws, projectId, instrumentId);
  if ("error" in owned) return owned;
  let parsedJson: unknown;
  try { parsedJson = typeof rawFields === "string" ? JSON.parse(rawFields) : rawFields; } catch { parsedJson = null; }
  const parsed = parseFields(parsedJson);
  if ("error" in parsed) return { error: parsed.error };
  const instrument = await instruments.update(ws, instrumentId, { respondentFields: parsed.fields });
  if (!instrument) throw new NotFoundError();
  return { instrument };
}

// A new draft on the latest set, carrying the old one's title, intro, fields, method, labels and settings;
// the old instrument stays on its version with its responses (E3-6, acceptance 3). Only the
// newest instrument can be built on (own), and createOnSet returns the existing draft when
// two presses race, so the project never gets two drafts on one set.
export async function buildOnLatest(ws: WorkspaceId, projectId: string, instrumentId: string): Promise<{ error: string } | { instrument: Instrument }> {
  const owned = await own(ws, projectId, instrumentId);
  if ("error" in owned) return owned;
  const { project, instrument: previous } = owned;
  const latest = await latestSet(ws, project.id);
  if (!latest || latest.id === previous.itemSetId) return { error: BUILD_COPY.alreadyLatest };
  const instrument = await instruments.createOnSet(ws, {
    projectId: project.id, itemSetId: latest.id, title: previous.title, intro: previous.intro, method: previous.method,
    showProposed: previous.showProposed, layout: previous.layout, respondentFields: previous.respondentFields, scaleLabels: previous.scaleLabels, closing: previous.closing,
  });
  if (!instrument) throw new NotFoundError();
  return { instrument };
}

// An instrument is published once it has a link or an invite (E6-1 creates them); the
// sample's come from the seed. Its method, proposal switch and labels are then locked
// (stories/E5-2, acceptance 4): answers are not kept across a method change.
export async function isPublished(ws: WorkspaceId, instrumentId: string): Promise<boolean> {
  return invites.anyForInstrument(ws, instrumentId);
}

// The scoring card (stories/E5-2): the method, whether the proposed value is shown, and
// the PM's labels for the method's values, validated here.
export async function saveScoring(ws: WorkspaceId, projectId: string, instrumentId: string, rawMethod: unknown, rawShowProposed: unknown, rawLabels: unknown): Promise<{ error: string } | { instrument: Instrument }> {
  const owned = await own(ws, projectId, instrumentId);
  if ("error" in owned) return owned;
  if (await isPublished(ws, instrumentId)) return { error: SCORING_ERRORS.locked };
  if (!isMethod(rawMethod)) return { error: SCORING_ERRORS.badMethod };
  const showProposed = rawShowProposed === true || rawShowProposed === "true" || rawShowProposed === "on" || rawShowProposed === "1";
  let parsedJson: unknown;
  try { parsedJson = typeof rawLabels === "string" ? JSON.parse(rawLabels) : rawLabels; } catch { return { error: SCORING_ERRORS.badShape }; }
  const labels = parseScaleLabels(rawMethod, parsedJson);
  if ("error" in labels) return { error: labels.error };
  const instrument = await instruments.update(ws, instrumentId, { method: rawMethod, showProposed, scaleLabels: labels.labels });
  if (!instrument) throw new NotFoundError();
  return { instrument };
}

