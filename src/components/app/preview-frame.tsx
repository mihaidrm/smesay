"use client";
// The builder's preview panel (stories/E5-6, acceptance 1, 3 and 5; the PM app board, note
// 13): 460 px on the right of Import, Shape, Build and Share. "Preview", Desktop and Phone
// (desktop first), "Open full size" (the same preview in a new tab, for the device chosen),
// the step's caption, and the real respondent app in an iframe: on desktop the 1000 px column
// at 42 percent (CSS transform: developer.mozilla.org/docs/Web/CSS/transform-function/scale),
// on a phone 390 px at true size, scrolling inside the panel. The page renders a fresh source
// on every render (a new preview token), so a save on the step reloads the preview and a new
// step starts it again.
import { useState } from "react";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { PREVIEW_COPY } from "@/lib/build-copy";

type Device = "desktop" | "phone";

export function PreviewFrame({ src, caption }: { src: string; caption: string }) {
  const [device, setDevice] = useState<Device>("desktop");
  const url = `${src}&device=${device}`;
  return (
    <aside className="sticky top-4 flex w-[460px] shrink-0 flex-col gap-3 self-start rounded-2xl border border-hairline bg-surface p-4" aria-labelledby="preview-title" data-testid="preview-panel">
      <div className="flex items-center justify-between gap-3">
        <h2 id="preview-title" className="text-[15px] font-bold">{PREVIEW_COPY.title}</h2>
        <a href={url} target="_blank" rel="noopener" className="rounded-sm text-sm font-semibold text-violet-text outline-none hover:underline focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface" data-testid="preview-full-size">{PREVIEW_COPY.fullSize}</a>
      </div>
      <SegmentedControl value={device} onChange={setDevice} label={PREVIEW_COPY.device} options={[{ value: "desktop", label: PREVIEW_COPY.desktop }, { value: "phone", label: PREVIEW_COPY.phone }]} className="self-start" />
      <p className="text-sm text-ink-muted" data-testid="preview-caption">{caption}</p>
      {device === "desktop" ? (
        <div className="h-[560px] w-[420px] overflow-hidden rounded-xl border border-hairline-strong bg-ground" data-testid="preview-desktop">
          <iframe src={url} title={PREVIEW_COPY.frameTitle} className="h-[1333px] w-[1000px] origin-top-left scale-[0.42] border-0" data-testid="preview-iframe" />
        </div>
      ) : (
        <div className="mx-auto h-[720px] w-[390px] overflow-hidden rounded-[28px] border border-hairline-strong bg-ground" data-testid="preview-phone">
          <iframe src={url} title={PREVIEW_COPY.frameTitle} className="h-full w-[390px] border-0" data-testid="preview-iframe" />
        </div>
      )}
    </aside>
  );
}
