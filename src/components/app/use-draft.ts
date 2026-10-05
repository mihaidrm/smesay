"use client";
// A form's draft in the tab's session storage (stories/E11-6, acceptance 3): every change is
// written under smesay-draft:[KEY], so a reload after signing in again finds what was typed; the
// form clears it once the server has saved. sessionStorage lives as long as the tab and is not
// shared with other tabs (developer.mozilla.org/docs/Web/API/Window/sessionStorage); access can
// throw when storage is blocked, so every call is guarded and the form works without it.
// The draft is read after the first render, so the server's markup and the browser's first
// render agree (react.dev/reference/react-dom/client/hydrateRoot, "Hydrating server-rendered
// HTML").
import { useCallback, useEffect, useState } from "react";

const storageKey = (key: string) => `smesay-draft:${key}`;

function read(key: string): Record<string, string> | null {
  try {
    const raw = window.sessionStorage.getItem(storageKey(key));
    const value: unknown = raw ? JSON.parse(raw) : null;
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    return Object.values(value).every((v) => typeof v === "string") ? (value as Record<string, string>) : null;
  } catch {
    return null;
  }
}

export function useDraft<T extends Record<string, string>>(key: string, initial: T) {
  const [values, setValues] = useState<T>(initial);
  const [restored, setRestored] = useState(false);
  useEffect(() => {
    const draft = read(key);
    if (!draft) return;
    const next = { ...initial, ...Object.fromEntries(Object.keys(initial).filter((k) => k in draft).map((k) => [k, draft[k]])) } as T;
    if (Object.keys(initial).some((k) => next[k] !== initial[k])) {
      // The one place a stored draft replaces what the server rendered.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setValues(next);
      setRestored(true);
    }
    // Only on mount and when the form's key changes; initial is the server's value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const set = useCallback((name: keyof T, value: string) => {
    setValues((current) => {
      const next = { ...current, [name]: value };
      try { window.sessionStorage.setItem(storageKey(key), JSON.stringify(next)); } catch { /* storage blocked: the form keeps the text in memory */ }
      return next;
    });
  }, [key]);
  const clear = useCallback(() => {
    try { window.sessionStorage.removeItem(storageKey(key)); } catch { /* nothing stored */ }
    setRestored(false);
  }, [key]);
  return { values, set, restored, clear };
}
