"use client";
// The respondent journey on an open link (stories/E7-1 onwards), one client component
// over the screens: About you, the chapters, and from E7-5 the Wrap up. The page renders it
// on the server with the response this device has (null before Start), so the first paint
// carries the screen; moving between screens is in the browser, with the address kept in
// step through the history API so Back and a reload land on the same screen
// (?at=about, ?at=[chapter number]; the native history API in Next:
// node_modules/next/dist/docs/01-app/02-guides/single-page-applications.md). Start posts
// About you to /r/[token]/start and lands on the first chapter (E7-1, acceptance 6). The
// first load writes ?at= into its own history entry (replaceState), so Back from the first
// chapter returns to About you. About you again after Start shows the values and picks
// Start saved; picks ticked there change the chapters only when Start saves them.
// The desktop column is 560 px for About you and 1000 px for a chapter
// (docs/design-system.md, Respondent columns).
import { useEffect, useMemo, useState } from "react";
import { cn } from "cn";
import { AboutYou } from "@/components/respondent/about-you";
import { ChapterScreen } from "@/components/respondent/chapter-screen";
import { RespondentHeader } from "@/components/respondent/respondent-header";
import type { Layout, RespondentFieldSpec, ResponseFields, ScaleLabels, ScoringMethod } from "@/db/types";
import { PERSPECTIVES_COPY } from "@/lib/perspectives";
import { chaptersFor, parseScreen, RESPONDENT_COPY, screenParam, type AreaMeta, type RespondentItem, type Screen } from "@/lib/respondent-rules";

export type RespondentAppProps = {
  token: string;
  workspaceName: string;
  accent: string;
  logoUrl: string | null;
  headerNote: string | null;
  instrument: { title: string; intro: string | null; fields: RespondentFieldSpec[]; perspectives: string[]; method: ScoringMethod; labels: ScaleLabels | null; showProposed: boolean; layout: Layout };
  prefilled: ResponseFields | undefined;
  items: RespondentItem[];
  areas: AreaMeta[];
  started: boolean;
  initialFields: ResponseFields;
  initialPicks: string[];
  initialScreen: Screen;
};

export function RespondentApp(props: RespondentAppProps) {
  const { token, workspaceName, accent, logoUrl, headerNote, instrument, prefilled, items, areas } = props;
  const [started, setStarted] = useState(props.started);
  const [picks, setPicks] = useState<string[]>(props.initialPicks);
  const [savedPicks, setSavedPicks] = useState<string[]>(props.initialPicks);
  const [fields, setFields] = useState<ResponseFields>(props.initialFields);
  const [screen, setScreen] = useState<Screen>(props.initialScreen);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const chapters = useMemo(() => chaptersFor(areas, items, savedPicks), [areas, items, savedPicks]);

  const go = (next: Screen) => {
    // About you shows what Start saved; picks ticked and not saved are dropped.
    if (next.kind === "about") setPicks(savedPicks);
    setScreen(next);
    window.history.pushState(null, "", `?at=${screenParam(next)}`);
    window.scrollTo(0, 0);
  };
  // The first entry carries its screen too, so Back from a pushed screen lands on it.
  useEffect(() => {
    const url = new URL(window.location.href);
    const at = screenParam(props.initialScreen);
    if (url.searchParams.get("at") !== at) { url.searchParams.set("at", at); window.history.replaceState(null, "", url); }
  }, [props.initialScreen]);
  // Back and Forward in the browser move between screens.
  useEffect(() => {
    const onPop = () => setScreen(parseScreen(new URLSearchParams(window.location.search).get("at"), started, chapters.length));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [started, chapters.length]);

  const start = async (values: ResponseFields, chosen: string[]) => {
    setStarting(true);
    setStartError(null);
    try {
      const response = await fetch(`/r/${encodeURIComponent(token)}/start`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ fields: values, perspectives: chosen }) });
      const body = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!response.ok || !body.ok) {
        // A link that changed (closed, revoked) since the page opened: the page shows its state.
        if (response.status === 410 || response.status === 404 || response.status === 403 || response.status === 409) { window.location.reload(); return; }
        setStartError(response.status === 422 && body.error ? body.error : RESPONDENT_COPY.startFailed);
        return;
      }
      setPicks(chosen);
      setSavedPicks(chosen);
      setFields(Object.fromEntries(Object.entries(values).map(([k, v]) => [k, v.trim()])));
      setStarted(true);
      go({ kind: "chapter", index: 0 });
    } catch {
      setStartError(RESPONDENT_COPY.startFailed);
    } finally {
      setStarting(false);
    }
  };

  const firstChapter = chaptersFor(areas, items, picks)[0]?.name ?? null;
  const wide = screen.kind === "chapter" && Boolean(chapters[screen.index]);
  return (
    <div className={cn("mx-auto min-h-screen w-full bg-ground", wide ? "max-w-[1000px]" : "max-w-[560px]")}>
      {screen.kind === "about" ? (
        <AboutYou workspaceName={workspaceName} logoUrl={logoUrl} accent={accent} headerNote={headerNote} title={instrument.title} intro={instrument.intro} fields={instrument.fields} prefilled={prefilled} initialValues={fields} initialPicks={picks} firstChapter={firstChapter} perspectives={instrument.perspectives} picked={picks} onPickPerspectives={setPicks} starting={starting} startError={startError} onStart={start} className="min-h-screen" />
      ) : chapters[screen.index] ? (
        <ChapterScreen workspaceName={workspaceName} accent={accent} logoUrl={logoUrl} headerNote={headerNote} title={instrument.title} chapter={chapters[screen.index]} method={instrument.method} labels={instrument.labels} showProposed={instrument.showProposed} onBack={() => go(screen.index === 0 ? { kind: "about" } : { kind: "chapter", index: screen.index - 1 })} />
      ) : (
        <div className="flex min-h-screen flex-col" data-testid="nothing-to-rate">
          <RespondentHeader workspaceName={workspaceName} accent={accent} logoUrl={logoUrl} note={headerNote} />
          <main className="flex flex-col gap-4 px-5 pt-6">
            <p className="text-[17px] leading-[26px] text-ink-muted">{PERSPECTIVES_COPY.nothingVisible}</p>
            <button type="button" onClick={() => go({ kind: "about" })} className="h-12 self-start rounded-full border border-hairline-strong bg-surface px-6 text-base font-semibold">{RESPONDENT_COPY.aboutYou}</button>
          </main>
        </div>
      )}
    </div>
  );
}
