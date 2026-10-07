"use client";
// The unsaved changes guard of the setup steps (stories/E5-9; design note 112). One registry
// for the signed-in shell (UnsavedProvider, in src/app/app/(shell)/layout.tsx, since the
// sidebar's links sit outside the project frame): each form of Import, Build and Share
// registers itself with useUnsavedForm under its card's title; a stepper pill or a sidebar
// link runs useUnsavedGuard's handler first, and while a form is unsaved the click is
// stopped (Next's Link calls onClick and does nothing more once the event's default is
// prevented: node_modules/next/dist/docs/01-app/03-api-reference/02-components/link.md,
// `onNavigate`; node_modules/next/dist/client/app-dir/link.js), the unsaved cards get the
// danger border and the "Not saved" label (UnsavedMark beside the title), shake once, and
// the banner under the project header (UnsavedBanner) names them with Discard beside it.
// Discard remounts each unsaved form with the server's values through a changed key
// (react.dev/learn/preserving-and-resetting-state, "Resetting a form with a key": useDiscard).
// Closing the tab, reloading or typing another address shows the browser's own dialog
// while a form is unsaved (developer.mozilla.org/docs/Web/API/Window/beforeunload_event:
// "best practice is to trigger the dialog by invoking preventDefault() on the event object,
// while also setting returnValue to support legacy cases"). The registry itself is pure:
// src/lib/unsaved.ts. Copy: docs/copy/app.md (Projects and the project frame).
import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, type Dispatch, type MouseEvent, type RefObject } from "react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { dirtyForms, EMPTY_UNSAVED, hasUnsaved, isFlagged, isFormFlagged, reduceUnsaved, UNSAVED_COPY, type UnsavedAction, type UnsavedState } from "@/lib/unsaved";

type Registry = { state: UnsavedState; dispatch: Dispatch<UnsavedAction>; resets: RefObject<Map<string, () => void>> };

// Outside the provider (the admin shell) nothing registers and every link goes through.
const UnsavedContext = createContext<Registry | null>(null);

export function UnsavedProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reduceUnsaved, EMPTY_UNSAVED);
  const resets = useRef(new Map<string, () => void>());
  const unsaved = hasUnsaved(state);
  useEffect(() => {
    if (!unsaved) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Older browsers read returnValue instead (the MDN page above).
      event.returnValue = true;
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [unsaved]);
  const value = useMemo(() => ({ state, dispatch, resets }), [state]);
  return <UnsavedContext.Provider value={value}>{children}</UnsavedContext.Provider>;
}

// A changed key remounts the form, so its values, its dirty flag and its action's last
// result all go back to what the server rendered (the react.dev page above).
export const useDiscard = () => useReducer((n: number) => n + 1, 0);

// A form registers under its card's title; `dirty` is what src/lib/unsaved.ts isUnsaved
// says; `reset` is the discard from useDiscard. Spread `props` on the form element: the ref
// finds the card for the shake, and data-unsaved gives the card its danger border
// (`.card:has([data-unsaved])` in src/app/globals.css).
export function useUnsavedForm({ id, label, dirty, reset }: { id: string; label: string; dirty: boolean; reset: () => void }) {
  const registry = useContext(UnsavedContext);
  const dispatch = registry?.dispatch;
  const resets = registry?.resets;
  const ref = useRef<HTMLFormElement>(null);
  const latestReset = useRef(reset);
  useEffect(() => { latestReset.current = reset; }, [reset]);
  useEffect(() => { dispatch?.({ type: "register", form: { id, label, dirty } }); }, [dispatch, id, label, dirty]);
  useEffect(() => () => dispatch?.({ type: "forget", id }), [dispatch, id]);
  useEffect(() => {
    const map = resets?.current;
    map?.set(id, () => latestReset.current());
    return () => { map?.delete(id); };
  }, [resets, id]);
  const flagged = registry !== null && isFormFlagged(registry.state, id);
  const blocked = registry?.state.blocked ?? 0;
  // The shake runs again on every stopped click: the class comes off, and goes back on two
  // frames later so the browser sees it gone in between (developer.mozilla.org/docs/Web/CSS/
  // CSS_animations/Tips, "Run an animation again"). Under prefers-reduced-motion the base
  // rule in globals.css stops the animation.
  useEffect(() => {
    const card = ref.current?.closest(".card");
    if (!card) return;
    card.classList.remove("unsaved-shake");
    if (!flagged) return;
    let second = 0;
    const first = requestAnimationFrame(() => { second = requestAnimationFrame(() => card.classList.add("unsaved-shake")); });
    return () => { cancelAnimationFrame(first); cancelAnimationFrame(second); };
  }, [blocked, flagged]);
  return { flagged, props: { ref, "data-unsaved": flagged ? "" : undefined } };
}

// The onClick of a link that leaves the step: stops the click while a form is unsaved and
// flags the forms. Outside the provider, or with nothing unsaved, the click goes through.
export function useUnsavedGuard() {
  const registry = useContext(UnsavedContext);
  const unsaved = registry !== null && hasUnsaved(registry.state);
  const dispatch = registry?.dispatch;
  return useCallback((event: MouseEvent<HTMLAnchorElement>) => {
    if (!unsaved) return;
    event.preventDefault();
    dispatch?.({ type: "block" });
  }, [unsaved, dispatch]);
}

export function GuardedLink({ onClick, ...props }: React.ComponentProps<typeof Link>) {
  const guard = useUnsavedGuard();
  return <Link {...props} onClick={(event) => { onClick?.(event); guard(event); }} />;
}

// The red label beside a card's title while its form is flagged.
export function UnsavedMark({ id }: { id: string }) {
  const registry = useContext(UnsavedContext);
  if (registry === null || !isFormFlagged(registry.state, id)) return null;
  return <span className="shrink-0 text-xs font-semibold text-danger" data-testid="unsaved-mark">{UNSAVED_COPY.label}</span>;
}

// The banner under the project header: the unsaved cards by title, Discard beside it.
export function UnsavedBanner({ className }: { className?: string }) {
  const registry = useContext(UnsavedContext);
  if (registry === null || !isFlagged(registry.state)) return null;
  const forms = dirtyForms(registry.state);
  const discard = () => { for (const form of forms) registry.resets.current.get(form.id)?.(); };
  return (
    <div role="alert" data-testid="unsaved-banner" className={cn("flex flex-wrap items-center justify-between gap-3 rounded-xl border border-danger bg-surface px-4 py-2.5 text-sm", className)}>
      <span className="font-semibold text-danger">{UNSAVED_COPY.banner(forms.map((f) => f.label))}</span>
      <Button type="button" variant="secondary" size="small" onClick={discard}>{UNSAVED_COPY.discard}</Button>
    </div>
  );
}
