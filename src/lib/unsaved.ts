// The unsaved changes registry of the project frame (stories/E5-9; design note 112): the
// forms of Import, Build and Share that hold changes not yet saved, and how many clicks on a
// link were stopped since the last time every form was clean. Pure: the React side is
// src/components/app/unsaved.tsx. Copy: docs/copy/app.md (Projects and the project frame).

export type UnsavedForm = { id: string; label: string; dirty: boolean };
export type UnsavedState = { forms: UnsavedForm[]; blocked: number };
export type UnsavedAction =
  | { type: "register"; form: UnsavedForm }
  | { type: "forget"; id: string }
  | { type: "block" };

export const UNSAVED_COPY = {
  label: "Not saved",
  banner: (labels: string[]) => `Save or discard your changes before you leave: ${labels.join(", ")}.`,
  discard: "Discard",
};

export const EMPTY_UNSAVED: UnsavedState = { forms: [], blocked: 0 };

export const dirtyForms = (state: UnsavedState): UnsavedForm[] => state.forms.filter((f) => f.dirty);
export const hasUnsaved = (state: UnsavedState): boolean => state.forms.some((f) => f.dirty);
// The banner, the borders and the labels show from the first stopped click until every form
// is clean again (the reducer puts blocked back to 0 then).
export const isFlagged = (state: UnsavedState): boolean => state.blocked > 0;
export const isFormFlagged = (state: UnsavedState, id: string): boolean => state.blocked > 0 && state.forms.some((f) => f.id === id && f.dirty);

const settle = (state: UnsavedState): UnsavedState => (hasUnsaved(state) || state.blocked === 0 ? state : { ...state, blocked: 0 });

export function reduceUnsaved(state: UnsavedState, action: UnsavedAction): UnsavedState {
  switch (action.type) {
    case "register": {
      const index = state.forms.findIndex((f) => f.id === action.form.id);
      const forms = index === -1 ? [...state.forms, action.form] : state.forms.map((f, i) => (i === index ? action.form : f));
      return settle({ ...state, forms });
    }
    case "forget":
      return settle({ ...state, forms: state.forms.filter((f) => f.id !== action.id) });
    case "block":
      return hasUnsaved(state) ? { ...state, blocked: state.blocked + 1 } : state;
  }
}

// What a form counts as unsaved: a change since the last save, a save on its way, a save the
// server refused (the text is still on screen), or a save that found the session ended
// (stories/E11-6: the text is kept for after the sign-in).
export const isUnsaved = (dirty: boolean, pending: boolean, state: { error: string | null; signedOut?: boolean }): boolean =>
  dirty || pending || state.error !== null || Boolean(state.signedOut);
