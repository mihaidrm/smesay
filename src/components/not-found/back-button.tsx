"use client";
// "Go back" on the 404 (stories/E11-7): the browser's previous page (history.back,
// developer.mozilla.org/docs/Web/API/History/back). Shown only when there is one to go back
// to, so a 404 opened in a new tab offers only "Go to your projects". Where the browser has the
// Navigation API, navigation.canGoBack says so (developer.mozilla.org/docs/Web/API/Navigation/
// canGoBack); elsewhere history.length over 1, which also counts pages ahead of this one.
// Read with useSyncExternalStore (react.dev/reference/react/useSyncExternalStore): false on the
// server, the browser's value after hydration, without a state update in an effect.
import { useSyncExternalStore } from "react";
import { NOT_FOUND_SCENE } from "@/lib/error-pages-copy";

const subscribe = () => () => {};
const canGoBack = () => {
  const nav = (window as { navigation?: { canGoBack?: boolean } }).navigation;
  return typeof nav?.canGoBack === "boolean" ? nav.canGoBack : window.history.length > 1;
};

export function BackButton() {
  const can = useSyncExternalStore(subscribe, canGoBack, () => false);
  if (!can) return null;
  return (
    <button type="button" onClick={() => window.history.back()} className="inline-flex h-[50px] items-center justify-center rounded-full border border-[#46445F] bg-white/[0.03] px-[26px] text-[16px] font-bold text-[#F3F1FA] transition-[border-color,background-color] duration-150 hover:border-[#9B86FF] hover:bg-[#9B86FF]/15 outline-none focus-visible:ring-2 focus-visible:ring-[#9B86FF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#16152A]!">
      {NOT_FOUND_SCENE.goBack}
    </button>
  );
}
