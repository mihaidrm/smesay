// The unsaved changes registry (stories/E5-9, acceptance 5): register, clear, forget, the
// blocked click, the banner line and what counts as unsaved.
import { describe, expect, it } from "vitest";
import { dirtyForms, EMPTY_UNSAVED, hasUnsaved, isFlagged, isFormFlagged, isUnsaved, reduceUnsaved, UNSAVED_COPY, type UnsavedState } from "./unsaved";

const intro = { id: "intro", label: "Intro", dirty: true };
const scoring = { id: "scoring", label: "Scoring", dirty: false };
const twoForms = (): UnsavedState => reduceUnsaved(reduceUnsaved(EMPTY_UNSAVED, { type: "register", form: intro }), { type: "register", form: scoring });

describe("reduceUnsaved", () => {
  it("registers forms once each, in order, and lists the dirty ones", () => {
    const state = twoForms();
    expect(state.forms.map((f) => f.id)).toEqual(["intro", "scoring"]);
    expect(hasUnsaved(state)).toBe(true);
    expect(dirtyForms(state).map((f) => f.label)).toEqual(["Intro"]);
    const again = reduceUnsaved(state, { type: "register", form: { ...scoring, dirty: true } });
    expect(again.forms).toHaveLength(2);
    expect(dirtyForms(again).map((f) => f.label)).toEqual(["Intro", "Scoring"]);
  });

  it("stops a click only while something is dirty, and counts each stop", () => {
    expect(reduceUnsaved(EMPTY_UNSAVED, { type: "block" })).toBe(EMPTY_UNSAVED);
    const clean = reduceUnsaved(EMPTY_UNSAVED, { type: "register", form: scoring });
    expect(reduceUnsaved(clean, { type: "block" })).toBe(clean);
    expect(isFlagged(clean)).toBe(false);
    const once = reduceUnsaved(twoForms(), { type: "block" });
    const twice = reduceUnsaved(once, { type: "block" });
    expect(once.blocked).toBe(1);
    expect(twice.blocked).toBe(2);
    expect(isFlagged(twice)).toBe(true);
  });

  it("flags only the dirty forms after a stopped click, none before", () => {
    const state = twoForms();
    expect(isFormFlagged(state, "intro")).toBe(false);
    const blocked = reduceUnsaved(state, { type: "block" });
    expect(isFormFlagged(blocked, "intro")).toBe(true);
    expect(isFormFlagged(blocked, "scoring")).toBe(false);
    expect(isFormFlagged(blocked, "closing")).toBe(false);
  });

  it("clears the flag once a save or a discard leaves every form clean", () => {
    const blocked = reduceUnsaved(twoForms(), { type: "block" });
    const saved = reduceUnsaved(blocked, { type: "register", form: { ...intro, dirty: false } });
    expect(saved.blocked).toBe(0);
    expect(isFlagged(saved)).toBe(false);
    expect(hasUnsaved(saved)).toBe(false);
  });

  it("keeps the flag while another form is still dirty", () => {
    const both = reduceUnsaved(twoForms(), { type: "register", form: { ...scoring, dirty: true } });
    const blocked = reduceUnsaved(both, { type: "block" });
    const oneSaved = reduceUnsaved(blocked, { type: "register", form: { ...intro, dirty: false } });
    expect(oneSaved.blocked).toBe(1);
    expect(dirtyForms(oneSaved).map((f) => f.id)).toEqual(["scoring"]);
  });

  it("forgets a form that left the page and settles when nothing dirty remains", () => {
    const blocked = reduceUnsaved(twoForms(), { type: "block" });
    const gone = reduceUnsaved(blocked, { type: "forget", id: "intro" });
    expect(gone.forms.map((f) => f.id)).toEqual(["scoring"]);
    expect(gone.blocked).toBe(0);
    expect(reduceUnsaved(gone, { type: "forget", id: "nobody" })).toEqual(gone);
  });
});

describe("UNSAVED_COPY", () => {
  it("names the cards in the banner line", () => {
    expect(UNSAVED_COPY.banner(["Intro", "Closing"])).toBe("Save or discard your changes before you leave: Intro, Closing.");
    expect(UNSAVED_COPY.label).toBe("Not saved");
    expect(UNSAVED_COPY.discard).toBe("Discard");
  });
});

describe("isUnsaved", () => {
  it("counts a change, a save on its way, a refused save and an ended session", () => {
    const none = { error: null };
    expect(isUnsaved(false, false, none)).toBe(false);
    expect(isUnsaved(true, false, none)).toBe(true);
    expect(isUnsaved(false, true, none)).toBe(true);
    expect(isUnsaved(false, false, { error: "Too long." })).toBe(true);
    expect(isUnsaved(false, false, { error: null, signedOut: true })).toBe(true);
    expect(isUnsaved(false, false, { error: null, signedOut: false })).toBe(false);
  });
});
