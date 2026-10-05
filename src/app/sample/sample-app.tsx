"use client";
// The visitors' sample in the browser (stories/E12-4): what the tab kept (src/lib/sample-drafts.ts)
// is read once the page has hydrated, then the respondent app starts from it, on the screen the
// address names (?at=, as a live link), so a reload or Back keeps the details, the cards, the
// Wrap up and Done. The server render shows the band and an empty column until then
// (useSyncExternalStore with a server snapshot: react.dev/reference/react/useSyncExternalStore).
import { useMemo, useSyncExternalStore } from "react";
import { DEFAULT_CLOSING } from "@/lib/closing";
import { chaptersFor, parseScreen, screenCount } from "@/lib/respondent-rules";
import { SAMPLE_TOKEN } from "@/lib/sample-copy";
import { readSample } from "@/lib/sample-drafts";
import type { sampleInstrument } from "@/lib/sample-instrument";
import { RespondentApp } from "../r/[token]/respondent-app";

const noSubscribe = () => () => {};

export function SampleApp({ sample, accent }: { sample: ReturnType<typeof sampleInstrument>; accent: string }) {
  const ready = useSyncExternalStore(noSubscribe, () => true, () => false);
  const kept = useMemo(() => (ready ? readSample(sample.items.map((it) => it.id), sample.instrument.fields.map((f) => f.key)) : null), [ready, sample]);
  if (!kept) return <div className="min-h-screen" />;
  const chapters = chaptersFor(sample.areas, sample.items, kept.picks).length;
  const at = new URLSearchParams(window.location.search).get("at");
  const parsed = parseScreen(at, kept.started, screenCount(sample.instrument.layout, chapters));
  const screen = parsed.kind === "done" && !kept.submittedAt ? { kind: "wrap" as const } : parsed;
  return (
    <RespondentApp
      token={SAMPLE_TOKEN}
      workspaceName={sample.workspaceName}
      accent={accent}
      logoUrl={null}
      headerNote={null}
      instrument={sample.instrument}
      prefilled={undefined}
      items={sample.items}
      areas={sample.areas}
      started={kept.started}
      initialFields={kept.fields}
      initialPicks={kept.picks}
      initialScreen={screen}
      initialItem={0}
      initialDrafts={kept.drafts}
      answers={{}}
      versions={{}}
      wrap={kept.wrap}
      wrapSync={{ version: 0, writer: null, writerSeq: 0 }}
      responseId={null}
      closing={{ ...DEFAULT_CLOSING, ...sample.closing }}
      welcome={null}
      submitted={kept.submittedAt ? { at: kept.submittedAt, name: (kept.fields.name ?? "").trim().split(/\s+/)[0] || null, returning: false } : null}
      changedSince={false}
      closesAt={null}
      poweredBy="landing"
      preview={{ rings: [], sample: true }}
    />
  );
}
