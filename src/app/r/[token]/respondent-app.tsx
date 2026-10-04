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
// (docs/design-system.md, Respondent columns). The cards' drafts live here and go to the
// server through the saver (answer-saver.ts, E7-2 and E7-3); the saved answers the page
// read seed them (E7-2: a complete answer the server has reads "Saved"), and the answers
// this device had not got to the server yet replace them (E7-3). While answers cannot reach
// the server the header says "Not saved", and offline the banner says why; a browser that
// keeps nothing between visits gets its notice once, on the first chapter screen.
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "cn";
import { AboutYou } from "@/components/respondent/about-you";
import { ChapterScreen } from "@/components/respondent/chapter-screen";
import type { CardDraft } from "@/components/respondent/item-card";
import { RespondentHeader } from "@/components/respondent/respondent-header";
import type { Layout, RespondentFieldSpec, ResponseFields, ScaleLabels, ScoringMethod } from "@/db/types";
import { PERSPECTIVES_COPY } from "@/lib/perspectives";
import { chaptersFor, parseScreen, pickedOf, screenCount, RESPONDENT_COPY, RESPONDENT_ERRORS, screenParam, type AnswerState, type AreaMeta, type RespondentItem, type Screen } from "@/lib/respondent-rules";
import { useAnswerSaver } from "./answer-saver";

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
  initialItem: number;
  answers: Record<string, AnswerState>;
  // Each stored answer's version, and the response they belong to (E7-3, the queue).
  versions: Record<string, number>;
  responseId: string | null;
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
  const [drafts, setDrafts] = useState<Record<string, CardDraft>>(() => Object.fromEntries(Object.entries(props.answers).map(([id, a]) => [id, { picked: pickedOf(a), reason: a.reason ?? "", comment: a.comment ?? "" }])));
  const [item, setItem] = useState(props.initialItem);
  const [storageNoticeDone, setStorageNoticeDone] = useState(false);
  const itemIds = useMemo(() => items.map((it) => it.id), [items]);
  const screenRef = useRef(screen);
  useEffect(() => { screenRef.current = screen; }, [screen]);
  const lost = useRef(false);
  const [responseId, setResponseId] = useState<string | null>(props.responseId);
  // Whether a Start in this visit has been followed by a save the server took: a "not
  // started" before that means the browser did not keep the device cookie.
  const startedHere = useRef(false);
  const savedSinceStart = useRef(false);
  // The server has no response for this device (its cookie was cleared): About you again,
  // once however many saves were refused; Start then sends the cards' drafts again, so the
  // answers on the page are kept with the new details. Straight after a Start it is the
  // browser refusing the cookie, and the sentence says so instead.
  const saver = useAnswerSaver(token, responseId, started, itemIds, props.versions, props.answers, Object.fromEntries(Object.keys(props.answers).map((id) => [id, true])), {
    onRestore: (found) => setDrafts((d) => ({ ...d, ...found })),
    onStale: (itemId, answer) => setDrafts((d) => ({ ...d, [itemId]: { picked: pickedOf(answer), reason: answer.reason ?? "", comment: answer.comment ?? "" } })),
    onSaved: () => { savedSinceStart.current = true; },
    onGone: () => window.location.reload(),
    onNotStarted: () => {
      if (lost.current) return;
      lost.current = true;
      saver.reset();
      setStarted(false);
      setStartError(startedHere.current && !savedSinceStart.current ? RESPONDENT_ERRORS.cookiesBlocked : RESPONDENT_ERRORS.notStarted);
      if (screenRef.current.kind !== "about") go({ kind: "about" });
    },
  });
  const change = (itemId: string, draft: CardDraft) => {
    setDrafts((d) => ({ ...d, [itemId]: draft }));
    saver.queue(itemId, draft);
  };

  const go = (next: Screen) => {
    saver.flush();
    // About you shows what Start saved; picks ticked and not saved are dropped.
    if (next.kind === "about") setPicks(savedPicks);
    if (saver.storageOff && screen.kind === "chapter") setStorageNoticeDone(true);
    setScreen(next);
    setItem(0);
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
    const onPop = () => {
      if (screenRef.current.kind === "chapter") setStorageNoticeDone(true);
      setScreen(parseScreen(new URLSearchParams(window.location.search).get("at"), started, screenCount(instrument.layout, chapters.length)));
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [started, chapters.length, instrument.layout]);

  const start = async (values: ResponseFields, chosen: string[]) => {
    setStarting(true);
    setStartError(null);
    try {
      const response = await fetch(`/r/${encodeURIComponent(token)}/start`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ fields: values, perspectives: chosen }) });
      const body = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string; response?: string };
      if (!response.ok || !body.ok) {
        // A link that changed (closed, revoked) since the page opened: the page shows its state.
        if (response.status === 410 || response.status === 404 || response.status === 403 || response.status === 409) { window.location.reload(); return; }
        setStartError(response.status === 422 && body.error ? body.error : RESPONDENT_COPY.startFailed);
        return;
      }
      setPicks(chosen);
      setSavedPicks(chosen);
      setFields(Object.fromEntries(Object.entries(values).map(([k, v]) => [k, v.trim()])));
      // The saver answers for the new response from now, before the drafts go again. Start
      // can name a response other than the one the page answered for (another window
      // replaced the cookie): that is a lost response too, and the cards go again.
      if (typeof body.response === "string") {
        if (responseId !== null && body.response !== responseId && !lost.current) { saver.reset(); lost.current = true; }
        setResponseId(body.response);
        saver.bind(body.response);
      }
      startedHere.current = true;
      savedSinceStart.current = false;
      setStarted(true);
      if (lost.current) { lost.current = false; saver.resend(drafts); }
      go({ kind: "chapter", index: 0 });
    } catch {
      setStartError(RESPONDENT_COPY.startFailed);
    } finally {
      setStarting(false);
    }
  };

  const firstChapter = chaptersFor(areas, items, picks)[0]?.name ?? null;
  const note = saver.unsaved ? RESPONDENT_COPY.notSaved : headerNote;
  const banner = saver.offline || (saver.storageOff && !storageNoticeDone) ? (
    <div className="flex flex-col gap-1 border-b border-sun bg-sun-soft px-5 py-2.5 text-sm text-sun-text" role="status" data-testid="saving-banner">
      {saver.offline && <p>{RESPONDENT_COPY.offline}</p>}
      {saver.storageOff && !storageNoticeDone && <p data-testid="storage-notice">{RESPONDENT_COPY.storageOff}</p>}
    </div>
  ) : null;
  const wide = screen.kind === "chapter" && Boolean(chapters[screen.index]);
  return (
    <div className={cn("mx-auto min-h-screen w-full bg-ground", wide ? "max-w-[1000px]" : "max-w-[560px]")}>
      {screen.kind === "about" ? (
        <AboutYou workspaceName={workspaceName} logoUrl={logoUrl} accent={accent} headerNote={note} title={instrument.title} intro={instrument.intro} fields={instrument.fields} prefilled={prefilled} initialValues={fields} initialPicks={picks} firstChapter={firstChapter} perspectives={instrument.perspectives} picked={picks} onPickPerspectives={setPicks} starting={starting} startError={startError} onStart={start} className="min-h-screen" />
      ) : chapters[screen.index] ? (
        <ChapterScreen workspaceName={workspaceName} accent={accent} logoUrl={logoUrl} headerNote={note} banner={banner} title={instrument.title} layout={instrument.layout} chapters={chapters} index={screen.index} item={item} method={instrument.method} labels={instrument.labels} showProposed={instrument.showProposed} drafts={drafts} saved={saver.saved} errors={saver.errors} unsaved={saver.unsaved} onChange={change} onItem={setItem} onBack={() => go(screen.index === 0 || instrument.layout === "page" ? { kind: "about" } : { kind: "chapter", index: screen.index - 1 })} />
      ) : (
        <div className="flex min-h-screen flex-col" data-testid="nothing-to-rate">
          <RespondentHeader workspaceName={workspaceName} accent={accent} logoUrl={logoUrl} note={note} />
          <main className="flex flex-col gap-4 px-5 pt-6">
            <p className="text-[17px] leading-[26px] text-ink-muted">{PERSPECTIVES_COPY.nothingVisible}</p>
            <button type="button" onClick={() => go({ kind: "about" })} className="h-12 self-start rounded-full border border-hairline-strong bg-surface px-6 text-base font-semibold">{RESPONDENT_COPY.aboutYou}</button>
          </main>
        </div>
      )}
    </div>
  );
}
