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
import { instruments, invites, items, itemSets, projects } from "@/db/queries";
import type { Instrument } from "@/db/queries/instruments";
import type { Item } from "@/db/queries/items";
import type { ItemSet } from "@/db/queries/itemSets";
import type { Project } from "@/db/queries/projects";
import type { ReasonRule, ScaleLabels, ScoringMethod, WorkspaceId } from "@/db/types";
import { BUILD_COPY, INTRO_MAX, TITLE_MAX } from "@/lib/build-copy";
import { CLOSING_COPY, parseClosing } from "@/lib/closing";
import { NotFoundError } from "@/lib/errors";
import { latestSet } from "@/lib/imports";
import { DEFAULT_FIELDS, parseFields } from "@/lib/respondent-fields";
import { parsePerspectives, parseTags, PERSPECTIVES_COPY } from "@/lib/perspectives";
import { isLayout, isMethod, isReasonRule, parseScaleLabels, SCORING_ERRORS } from "@/lib/scoring";

export { BUILD_COPY };

export type Draft = { instrument: Instrument; builtOn: ItemSet; newer: ItemSet | null };

// The draft Build shows. Null when the project has no set yet (the empty state). A project
// with a set and no instrument gets one here, on first open (acceptance 1); the sample
// always has one from the seed, so it is never created here. create false (an admin's
// read-only view, stories/E14-4) never creates one either: Build then shows its empty state.
export async function openDraft(ws: WorkspaceId, project: Project, options: { create?: boolean } = {}): Promise<Draft | null> {
  const latest = await latestSet(ws, project.id);
  if (!latest) return null;
  let instrument = await instruments.latestForProject(ws, project.id);
  if (!instrument) {
    if (project.isSample || options.create === false) return null;
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

// A new draft on the latest set, carrying the old one's title, intro, fields, method, labels,
// perspective names and settings (not the tags: the new set's items are new rows, tagged
// again on Shape, docs/review-list.md); the old instrument stays on its version with its
// responses (E3-6, acceptance 3). Only the
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
    showProposed: previous.showProposed, layout: previous.layout, reasonRule: previous.reasonRule, respondentFields: previous.respondentFields, scaleLabels: previous.scaleLabels, closing: previous.closing,
    perspectives: previous.perspectives,
  });
  if (!instrument) throw new NotFoundError();
  return { instrument };
}

// An instrument is published once it has a link or an invite (E6-1 creates them); the
// sample's come from the seed. Its method, proposal switch, labels and reason rule are then
// locked (stories/E5-2, acceptance 4 and 6): answers are not kept across a method change, and
// a rule changed mid-run would make answers already given complete or not after the fact.
export async function isPublished(ws: WorkspaceId, instrumentId: string): Promise<boolean> {
  return invites.anyForInstrument(ws, instrumentId);
}

// The scoring card (stories/E5-2 and E5-3): the method, whether the proposed value is
// shown, the PM's labels for the method's values, when a reason is required (the
// ReasonRule, E5-2 acceptance 6; a form that posts none keeps the stored one) and the
// layout, validated here. Once published the method, the switch, the labels and the rule
// are locked (answers depend on them) and whatever is posted for them is ignored; the
// layout still changes, since it only shapes
// the screens. Whether it is published is read under the instrument row's lock
// (instruments.updateLocked), the lock publishing takes (E6-1, acceptance 5), so a save
// that waited on a publish in flight writes the layout only.
export async function saveScoring(ws: WorkspaceId, projectId: string, instrumentId: string, rawMethod: unknown, rawShowProposed: unknown, rawLabels: unknown, rawLayout: unknown, rawReasonRule?: unknown): Promise<{ error: string } | { instrument: Instrument }> {
  const owned = await own(ws, projectId, instrumentId);
  if ("error" in owned) return owned;
  if (!isLayout(rawLayout)) return { error: SCORING_ERRORS.badLayout };
  const posted = rawReasonRule !== null && rawReasonRule !== undefined;
  if (posted && !isReasonRule(rawReasonRule)) return { error: SCORING_ERRORS.badReasonRule };
  // The locked form posts nothing for the method (a disabled fieldset is left out of the
  // form data): a missing method is only valid once published. A posted one is checked
  // here and applied only on a draft.
  let full: { method: ScoringMethod; showProposed: boolean; scaleLabels: ScaleLabels | null; reasonRule?: ReasonRule } | null = null;
  if (rawMethod !== null && rawMethod !== undefined) {
    if (!isMethod(rawMethod)) return { error: SCORING_ERRORS.badMethod };
    const showProposed = rawShowProposed === true || rawShowProposed === "true" || rawShowProposed === "on" || rawShowProposed === "1";
    let parsedJson: unknown;
    try { parsedJson = typeof rawLabels === "string" ? JSON.parse(rawLabels) : rawLabels; } catch { return { error: SCORING_ERRORS.badShape }; }
    const labels = parseScaleLabels(rawMethod, parsedJson);
    if ("error" in labels) return { error: labels.error };
    full = { method: rawMethod, showProposed, scaleLabels: labels.labels, ...(isReasonRule(rawReasonRule) ? { reasonRule: rawReasonRule } : {}) };
  }
  const result = await instruments.updateLocked(ws, instrumentId, (published) => (published ? { layout: rawLayout } : full ? { ...full, layout: rawLayout } : null));
  if (!result) throw new NotFoundError();
  if (!result.applied) return { error: SCORING_ERRORS.badMethod };
  return { instrument: result.instrument };
}

// The Perspectives card (stories/E5-4): the names, one per line. A name removed is dropped
// from every item of the instrument's set that carried it, a case-only rename keeps the
// tags, and both happen in one statement under the instrument's lock (instruments.setPerspectives).
// Locked once published, like the method (docs/review-list.md): a tag added mid-run would
// take an item away from respondents who already answered it. Whether it is published is
// read under the same lock publishing takes (E6-1, acceptance 5).
export async function savePerspectives(ws: WorkspaceId, projectId: string, instrumentId: string, rawNames: unknown): Promise<{ error: string } | { instrument: Instrument }> {
  const owned = await own(ws, projectId, instrumentId);
  if ("error" in owned) return owned;
  const parsed = parsePerspectives(rawNames);
  if ("error" in parsed) return { error: parsed.error };
  const result = await instruments.setPerspectives(ws, instrumentId, parsed.names);
  if (!result) throw new NotFoundError();
  if ("refused" in result) return { error: PERSPECTIVES_COPY.locked };
  return { instrument: result.instrument };
}

// The Closing card (stories/E5-5): the closing question, the missing-item form switch and
// the sign-off text, with confidence always on (parseClosing refuses it off). Once
// published the question is locked (its answers are stored per response): the locked form
// posts no question (a disabled input is left out of the form data) and the stored one is
// kept; a stale tab that posts another question is refused; the switch and the sign-off
// still change. Whether it is published is read under the lock publishing takes (E6-1).
export async function saveClosing(ws: WorkspaceId, projectId: string, instrumentId: string, rawQuestion: unknown, rawMissingForm: unknown, rawSignOff: unknown, rawConfidence: unknown): Promise<{ error: string } | { instrument: Instrument }> {
  const owned = await own(ws, projectId, instrumentId);
  if ("error" in owned) return owned;
  const asPosted = parseClosing(rawQuestion, rawMissingForm, rawSignOff, rawConfidence);
  if ("error" in asPosted) return { error: asPosted.error };
  // Under the lock the stored question is read from the locked row, so a stale tab cannot
  // write an older question onto a published instrument.
  const result = await instruments.updateLocked(ws, instrumentId, (published, current) => {
    if (!published) return { closing: asPosted.closing };
    const stored = current.closing.closingQuestion ?? "";
    if (typeof rawQuestion === "string" && rawQuestion.trim() !== stored) return null;
    const asLocked = parseClosing(stored, rawMissingForm, rawSignOff, rawConfidence);
    return "error" in asLocked ? null : { closing: asLocked.closing };
  });
  if (!result) throw new NotFoundError();
  if (!result.applied) return { error: CLOSING_COPY.questionLocked };
  return { instrument: result.instrument };
}

// The chips on an item on Shape (stories/E5-4): the item's tags, each a name of the
// project's newest instrument. An item of the project on another set than the newest
// instrument's gets a message, not a 404: on a newer set, build on it first; on an older
// one (a stale Shape tab after "Build on version N"), reload. An item outside the project
// is 404.
export async function tagItem(ws: WorkspaceId, projectId: string, itemId: string, rawTags: unknown): Promise<{ error: string } | { item: Item }> {
  const project = await projects.get(ws, projectId);
  const target = await items.get(ws, itemId);
  if (!project || !target) throw new NotFoundError();
  const set = await itemSets.get(ws, target.itemSetId);
  if (!set || set.projectId !== project.id) throw new NotFoundError();
  if (project.isSample) return { error: BUILD_COPY.sample };
  const instrument = await instruments.latestForProject(ws, project.id);
  if (!instrument) throw new NotFoundError();
  if (instrument.itemSetId !== target.itemSetId) {
    const builtOn = await itemSets.get(ws, instrument.itemSetId);
    if (!builtOn) throw new NotFoundError();
    return { error: set.version > builtOn.version ? PERSPECTIVES_COPY.otherSet(builtOn.version, set.version) : PERSPECTIVES_COPY.olderSet(set.version, builtOn.version) };
  }
  if (instrument.perspectives.length === 0) return { error: PERSPECTIVES_COPY.noneDefined };
  const parsed = parseTags(rawTags, instrument.perspectives);
  if ("error" in parsed) return { error: parsed.error };
  const result = await instruments.tagItem(ws, instrument.id, itemId, parsed.tags);
  if (!result) throw new NotFoundError();
  if ("refused" in result) return { error: result.refused === "names" ? PERSPECTIVES_COPY.unknownTag : result.refused === "published" ? PERSPECTIVES_COPY.locked : BUILD_COPY.replaced };
  return { item: result.item };
}
