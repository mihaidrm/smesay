"use client";
// The builder's preview panel (stories/E5-6, acceptance 1, 3 and 5; the PM app board, note
// 13): 460 px on the right of Import, Shape, Build and Share. "Preview", Desktop and Phone
// (desktop first), "Open full size" (the same preview in a new tab, for the device chosen),
// the step's caption, and the real respondent app in an iframe: on desktop the 1032 px column
// (a 1000 px chapter card with its 16 px sides, decision 0052) at 40.7 percent (CSS transform: developer.mozilla.org/docs/Web/CSS/transform-function/scale),
// on a phone 390 px at true size, scrolling inside the panel. The source changes only when
// what the preview shows does (src/lib/preview.ts previewSrc), and the iframe is keyed by it:
// a new source is a new frame, so a save does not add an entry to the tab's history (the
// iframe's first load replaces about:blank; html.spec.whatwg.org, "process the iframe
// attributes"). The panel sticks below the project header (the PM app shell, decision 0021).
// The Closing card on Build focused or clicked opens the Wrap up (E5-5, acceptance 3), and
// any other control of the step page the first screen again: PreviewScreen holds the choice
// for the step page (a part marked data-preview-screen="wrap" asks for the Wrap up), and the
// frame passes it as ?screen=. React's onFocus bubbles, unlike the browser's focus event
// (react.dev/reference/react-dom/components/common#focusevent-handler); the click covers
// Safari, which does not focus a button on click (MDN, <button>, "Clicking and focus").
import { createContext, useContext, useState } from "react";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { PREVIEW_COPY } from "@/lib/build-copy";

type Device = "desktop" | "phone";
export type PreviewScreenChoice = "start" | "wrap";

const ScreenContext = createContext<{ screen: PreviewScreenChoice; setScreen: (s: PreviewScreenChoice) => void }>({ screen: "start", setScreen: () => {} });

const usePreviewScreen = () => useContext(ScreenContext);

export function PreviewScreen({ children }: { children: React.ReactNode }) {
  const [screen, setScreen] = useState<PreviewScreenChoice>("start");
  return <ScreenContext.Provider value={{ screen, setScreen }}>{children}</ScreenContext.Provider>;
}

// The step page's column: where the focus lands sets the preview's screen; a click inside the
// Wrap up's card opens it (a click on its heading too), and a click on plain text elsewhere
// changes nothing.
const inWrap = (target: EventTarget) => target instanceof Element && target.closest('[data-preview-screen="wrap"]') !== null;
export function PreviewColumn({ children }: { children: React.ReactNode }) {
  const { setScreen } = usePreviewScreen();
  return (
    <div onFocus={(e) => setScreen(inWrap(e.target) ? "wrap" : "start")} onClick={(e) => { if (inWrap(e.target)) setScreen("wrap"); }} className="flex min-w-0 grow flex-col gap-5">
      {children}
    </div>
  );
}

// The frame and its loading state (CLAUDE.md, PM side): keyed by the address, so a new
// address starts loading again; the note shows until the page in it has loaded. It is for the
// eye only (aria-hidden): the frame reloads after every save, and a status line each time would
// talk over the step page's own "Saved." (E8 status lines are role="status").
function Frame({ url, className }: { url: string; className: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <>
      {!loaded && <p aria-hidden="true" className="absolute inset-x-0 top-1/3 text-center text-sm text-ink-muted" data-testid="preview-loading">{PREVIEW_COPY.loading}</p>}
      <iframe src={url} title={PREVIEW_COPY.frameTitle} onLoad={() => setLoaded(true)} className={className} data-testid="preview-iframe" />
    </>
  );
}

export function PreviewFrame({ src, caption }: { src: string; caption: string }) {
  const [device, setDevice] = useState<Device>("desktop");
  const { screen } = usePreviewScreen();
  const url = `${src}&device=${device}${screen === "wrap" ? "&screen=wrap" : ""}`;
  return (
    <aside className="sticky top-28 flex max-h-[calc(100vh-8rem)] w-[460px] shrink-0 flex-col gap-3 self-start overflow-y-auto rounded-2xl border border-hairline bg-surface p-4" aria-labelledby="preview-panel-title" data-testid="preview-panel">
      <div className="flex items-center justify-between gap-3">
        <h2 id="preview-panel-title" className="text-[15px] font-bold">{PREVIEW_COPY.title}</h2>
        <a href={url} target="_blank" rel="noopener" className="rounded-sm text-sm font-semibold text-violet-text outline-none hover:underline focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface" data-testid="preview-full-size">{PREVIEW_COPY.fullSize}<span className="sr-only"> {PREVIEW_COPY.newTab}</span></a>
      </div>
      <SegmentedControl value={device} onChange={setDevice} label={PREVIEW_COPY.device} options={[{ value: "desktop", label: PREVIEW_COPY.desktop }, { value: "phone", label: PREVIEW_COPY.phone }]} className="self-start" />
      <p className="text-sm text-ink-muted" data-testid="preview-caption">{caption}</p>
      {device === "desktop" ? (
        <div className="relative h-[560px] w-[420px] shrink-0 overflow-hidden rounded-xl border border-hairline-strong bg-ground" data-testid="preview-desktop">
          <Frame key={url} url={url} className="h-[1376px] w-[1032px] origin-top-left scale-[0.407] border-0" />
        </div>
      ) : (
        <div className="relative mx-auto h-[720px] w-[390px] shrink-0 overflow-hidden rounded-[28px] border border-hairline-strong bg-ground" data-testid="preview-phone">
          <Frame key={url} url={url} className="h-full w-[390px] border-0" />
        </div>
      )}
    </aside>
  );
}
