"use client";
// The respondent journey on an open link (stories/E7-1 onwards), one client component
// over the screens: About you, the chapters, and from E7-4 the Wrap up. The page renders it
// on the server with the response this device has (null before Start), so the first paint
// carries the screen; moving between screens is in the browser, with the address kept in
// step through the history API so Back and a reload land on the same screen
// (?at=about, ?at=[chapter number], ?at=wrap; the native history API in Next:
// node_modules/next/dist/docs/01-app/02-guides/single-page-applications.md). Start posts
// About you to /r/[token]/start and lands on the first chapter (E7-1, acceptance 6). The
// first load writes ?at= into its own history entry (replaceState), so Back from the first
// chapter returns to About you. About you again after Start shows the values and picks
// Start saved; picks ticked there change the chapters only when Start saves them.
// The desktop column is 752 px for About you, 1032 px for a chapter and 792 px for the Wrap
// up, each holding a card 32 px narrower (decisions 0051 and 0052)
// (docs/design-system.md, Respondent columns). The cards' drafts live here and go to the
// server through the saver (answer-saver.ts, E7-2 and E7-3); the saved answers the page
// read seed them (E7-2: a complete answer the server has reads "Saved"), and the answers
// this device had not got to the server yet replace them (E7-3). While answers cannot reach
// the server the header says "Not saved", and offline the banner says why; a browser that
// keeps nothing between visits gets its notice once, on the first screen after About you.
// E7-4: the chapter row and the bar under the header of every screen once started, About
// you included (?at=wrap is the Wrap up), Continue to the next chapter or the Wrap up, the
// footer's count, and a returning visit's "Welcome back" over the chapter or the Wrap up it
// lands on, until the respondent moves. The row and the Wrap up count what the server holds
// complete (the saver's `done`); a card's note says what is missing as the respondent left
// it. A screen change moves focus to the new screen's heading (data-screen-heading, tabIndex
// -1), so a screen reader hears where it landed; a row of "Still to finish" opens its own
// item: the item itself in the one-item layout, otherwise its card scrolled into view with
// focus on its first control. The Wrap up's card is 760 px.
// E7-5: the Wrap up's tally and sections come from the cards; its form (the missing item,
// the closing answer, confidence, the sign-off) is held here; Submit posts it to
// /r/[token]/submit and lands on the Done screen (?at=done: "Thank you, [NAME]." and the
// time in UTC, with Change my answers, which reopens the Wrap up with the sign-off
// cleared). The form is saved as the respondent writes (wrap-saver.ts) and cannot be changed
// while Submit posts. A Submit that fails keeps everything and says so. E7-6: the
// Done screen's summary line, and for a submitted response opened again "Welcome back,
// [NAME]. You submitted on [DATE]. You can change your answers until [CLOSE DATE]." with
// Change.
// E5-6: the builder's preview renders this same app (preview set), started and on the first
// chapter, with the steps' rings; nothing goes to the server (Start, the cards and the Wrap
// up stay in memory, Submit is off) and every screen says so.
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { cn } from "cn";
import { AboutYou } from "@/components/respondent/about-you";
import { ChapterRow } from "@/components/respondent/chapter-row";
import { ChapterScreen } from "@/components/respondent/chapter-screen";
import { answerOfDraft, EMPTY_DRAFT, type CardDraft } from "@/components/respondent/item-card";
import { WrapUp, type WrapSection } from "@/components/respondent/wrap-up";
import { useWrapSaver } from "./wrap-saver";
import { signOffFor } from "@/lib/closing";
import { PoweredBy, type PoweredByShow } from "@/components/respondent/powered-by";
import { RespondentHeader } from "@/components/respondent/respondent-header";
import { FRAME_ACTIONS, FRAME_CARD, FRAME_HEADER, FRAME_OUTER, FRAME_POWERED, FRAME_PRIMARY } from "@/components/respondent/frame";
import type { ClosingSpec, Layout, ReasonRule, RespondentFieldSpec, ResponseFields, ScaleLabels, ScoringMethod } from "@/db/types";
import { PERSPECTIVES_COPY } from "@/lib/perspectives";
import { missingMandatory } from "@/lib/respondent-fields";
import { formatUtc } from "@/lib/sharing-format";
import { SAVE_TIMEOUT_MS } from "@/lib/answer-queue";
import { areasOf, chaptersFor, gapsOf, heardSubmit, showsChanged, startSubmit, type SinceReply, type SubmitSeen, type WrapSync, type WrapValue, isComplete, parseScreen, pickedOf, progressOf, screenCount, tallyOf, type Bucket, RESPONDENT_COPY, RESPONDENT_ERRORS, screenParam, type AnswerState, type AreaMeta, type RespondentItem, type Screen } from "@/lib/respondent-rules";
import { useAnswerSaver } from "./answer-saver";
import type { PreviewRing } from "@/lib/preview";
import { ABOUT_YOU_COPY } from "@/lib/build-copy";
import { keepSample } from "@/lib/sample-drafts";
import { SAMPLE_COPY } from "@/lib/sample-copy";

export type RespondentAppProps = {
  token: string;
  workspaceName: string;
  accent: string;
  logoUrl: string | null;
  headerNote: string | null;
  instrument: { title: string; intro: string | null; fields: RespondentFieldSpec[]; perspectives: string[]; method: ScoringMethod; labels: ScaleLabels | null; showProposed: boolean; layout: Layout; reasonRule: ReasonRule };
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
  closing: ClosingSpec;
  // A returning visit with answers (E7-4, acceptance 4): the first name and the count.
  welcome: { name: string | null; answered: number; total: number } | null;
  // A response already submitted (E7-5 and E7-6): when, and the first name for the thanks.
  submitted: { at: string; name: string | null; returning: boolean } | null;
  // A submitted response with changes not submitted again (E7-6, acceptance 6).
  changedSince: boolean;
  closesAt: string | null;
  // The Wrap up as the server holds it and its version (E7-5), empty before a save.
  wrap: WrapValue;
  wrapSync: WrapSync;
  poweredBy: PoweredByShow;
  // The visitors' sample (stories/E12-4): the cards as the tab kept them (src/app/sample/).
  initialDrafts?: Record<string, CardDraft>;
  // The builder's preview (stories/E5-6): what its step rings; nothing is saved. sample: the
  // visitors' sample at /sample (stories/E12-4): the answers stay in the tab's session storage,
  // Submit shows Done without sending, and the band says nothing is saved.
  preview?: { rings: PreviewRing[]; sample?: boolean } | null;
};

// The page has hydrated (false in the server render and while hydrating, then true:
// react.dev/reference/react/useSyncExternalStore, getServerSnapshot), as data-ready on the
// root, so a browser test types only into a page that takes the typing.
const noSubscribe = () => () => {};
const firstName = (fields: ResponseFields): string | null => (fields.name ?? "").trim().split(/\s+/)[0] || null;

export function RespondentApp(props: RespondentAppProps) {
  const { token, workspaceName, accent, logoUrl, headerNote, instrument, prefilled, items, areas } = props;
  const ready = useSyncExternalStore(noSubscribe, () => true, () => false);
  const preview = props.preview ?? null;
  const rings = new Set(preview?.rings ?? []);
  const sample = preview?.sample === true;
  const [started, setStarted] = useState(props.started);
  const [picks, setPicks] = useState<string[]>(props.initialPicks);
  const [savedPicks, setSavedPicks] = useState<string[]>(props.initialPicks);
  const [fields, setFields] = useState<ResponseFields>(props.initialFields);
  const [screen, setScreen] = useState<Screen>(props.initialScreen);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const chapters = useMemo(() => chaptersFor(areas, items, savedPicks), [areas, items, savedPicks]);
  const [drafts, setDrafts] = useState<Record<string, CardDraft>>(() => props.initialDrafts ?? Object.fromEntries(Object.entries(props.answers).map(([id, a]) => [id, { picked: pickedOf(a), reason: a.reason ?? "", comment: a.comment ?? "" }])));
  const [item, setItem] = useState(props.initialItem);
  const [storageNoticeDone, setStorageNoticeDone] = useState(false);
  const [welcomeDone, setWelcomeDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(props.submitted);
  // E7-6: any change after a Submit takes the sign-off back on the server; the page says so
  // on Done and on the Wrap up until the next Submit, as the server holds it. Every answer to
  // a save, a Start or a stale Submit carries changedSince and the response's latest Submit,
  // and the page counts a "changed" only for the latest Submit it has heard of (heardSubmit,
  // src/lib/respondent-rules.ts), whatever order the answers arrive in. A change undone before
  // it was saved, or kept from an earlier visit and sent on opening, reads as the server has
  // it. The ref holds the latest at once, for answers that arrive before a render.
  const opened: SubmitSeen = { at: props.submitted?.at ?? null, changedFor: props.changedSince && props.submitted ? props.submitted.at : null };
  const seenRef = useRef(opened);
  const [seen, setSeenState] = useState(opened);
  const setSeen = (next: SubmitSeen) => { seenRef.current = next; setSeenState(next); };
  const changedSince = submitted !== null && showsChanged(seen);
  const heard = (reply: SinceReply) => setSeen(heardSubmit(seenRef.current, reply));
  // Nothing on the page can change while a Submit posts: a move between screens is refused
  // then, and the controls that move are disabled.
  const posting = useRef(false);
  const itemIds = useMemo(() => items.map((it) => it.id), [items]);
  const screenRef = useRef(screen);
  useEffect(() => { screenRef.current = screen; }, [screen]);
  const lost = useRef(false);
  const [responseId, setResponseId] = useState<string | null>(props.responseId);
  // The Wrap up as the server holds it; the change this device kept, when the server would
  // still take it, replaces it after the first render (an outside store the server render
  // cannot read). Every change goes to the server within a second (wrap-saver.ts, E7-5).
  const [wrap, setWrapState] = useState<WrapValue>(props.wrap);
  // A missing item's area that the list no longer offers (perspectives changed) is not sent.
  const areaNames = areasOf(chapters);
  const cleanWrap = (w: WrapValue): WrapValue => (w.missing.area === "" || areaNames.includes(w.missing.area) ? w : { ...w, missing: { ...w.missing, area: "" } });
  const wrapSaver = useWrapSaver(token, responseId, { wrap: props.wrap, ...props.wrapSync }, {
    onGone: () => window.location.reload(),
    onNotStarted: () => lostResponse(),
    onRestore: (value) => setWrapState((w) => ({ ...value, signed: w.signed })),
    // Another window or device changed it: the stored one shows, and the sign-off is ticked
    // again for it.
    onStale: (value) => setWrapState({ ...value, signed: false }),
    clean: cleanWrap,
    onSaved: heard,
  });
  const wrapNow = useRef(wrap);
  useEffect(() => { wrapNow.current = wrap; }, [wrap]);
  const setWrap = (next: WrapValue) => { setWrapState(next); setSubmitError(null); if (sample) keepSample({ wrap: next }); else if (!preview) wrapSaver.queue(next); };
  // Whether a Start in this visit has been followed by a save the server took: a "not
  // started" before that means the browser did not keep the device cookie.
  const startedHere = useRef(false);
  const savedSinceStart = useRef(false);
  // The server has no response for this device (its cookie was cleared): About you again,
  // once however many saves were refused; Start then sends the cards' drafts again, so the
  // answers on the page are kept with the new details. Straight after a Start it is the
  // browser refusing the cookie, and the sentence says so instead.
  const saver = useAnswerSaver(token, responseId, started && !preview, itemIds, props.versions, props.answers, Object.fromEntries(Object.keys(props.answers).map((id) => [id, true])), Object.fromEntries(Object.entries(props.answers).map(([id, a]) => [id, isComplete(a, props.instrument.reasonRule)])), {
    onRestore: (found) => setDrafts((d) => ({ ...d, ...found })),
    onStale: (itemId, answer) => setDrafts((d) => ({ ...d, [itemId]: { picked: pickedOf(answer), reason: answer.reason ?? "", comment: answer.comment ?? "" } })),
    onSaved: (reply) => { savedSinceStart.current = true; heard(reply); },
    onGone: () => window.location.reload(),
    onNotStarted: () => lostResponse(),
  });
  // The server has no response for this device, or not the one the page answers for (a card,
  // the Wrap up or Submit said so): About you again, once, with the cards and the Wrap up kept
  // on the page and sent again after Start.
  const lostResponse = () => {
    if (lost.current) return;
    lost.current = true;
    saver.reset();
    wrapSaver.reset();
    setStarted(false);
    setStartError(startedHere.current && !savedSinceStart.current ? RESPONDENT_ERRORS.cookiesBlocked : RESPONDENT_ERRORS.notStarted);
    if (screenRef.current.kind !== "about") go({ kind: "about" }, 0, null, true);
  };
  // The sample keeps every change in the tab (src/lib/sample-drafts.ts); when the browser keeps
  // nothing the cards say so instead of "Saved on this device".
  const [sampleKept, setSampleKept] = useState(true);
  const change = (itemId: string, draft: CardDraft) => {
    setDrafts((d) => ({ ...d, [itemId]: draft }));
    // One change per event, so the page's cards plus this one are what the tab should keep.
    if (sample) setSampleKept(keepSample({ drafts: { ...drafts, [itemId]: draft } }));
    if (!preview) saver.queue(itemId, draft);
  };

  // Focus after a screen change (not on the first paint): the asked-for card, or the heading.
  const moved = useRef(false);
  const target = useRef<string | null>(null);
  const where = screenParam(screen);
  useEffect(() => {
    if (!moved.current) { moved.current = true; return; }
    const itemId = target.current;
    target.current = null;
    const card = itemId ? document.querySelector<HTMLElement>(`[data-item="${CSS.escape(itemId)}"]`) : null;
    if (card) {
      card.scrollIntoView({ block: "start" });
      card.querySelector<HTMLElement>("[tabindex='0'], input:not([tabindex='-1']), textarea, button")?.focus({ preventScroll: true });
      return;
    }
    document.querySelector<HTMLElement>("[data-screen-heading]")?.focus({ preventScroll: true });
  }, [where]);

  const go = (next: Screen, itemIndex = 0, itemId: string | null = null, force = false) => {
    // While a Submit posts the respondent stays on the Wrap up (see `posting`); a lost
    // response still goes to About you (its Submit then stops).
    if (posting.current && !force) return;
    target.current = itemId;
    saver.flush();
    setSubmitError(null);
    setWelcomeDone(true);
    // About you shows what Start saved; picks ticked and not saved are dropped.
    if (next.kind === "about") setPicks(savedPicks);
    // The storage notice shows once: leaving any screen it showed on marks it seen.
    if (saver.storageOff && screen.kind !== "about") setStorageNoticeDone(true);
    setScreen(next);
    setItem(itemIndex);
    // The screen already showing (its own pill tapped) adds no history entry.
    // In the builder's preview a screen replaces the entry and keeps the preview's query, so
    // Back leaves the step page and a reload keeps the step and its rings. The visitors' sample
    // moves like a live link: Back goes to the screen before.
    if (screenParam(next) !== screenParam(screen)) {
      if (preview && !sample) { const url = new URL(window.location.href); url.searchParams.set("at", screenParam(next)); window.history.replaceState(null, "", url); }
      else window.history.pushState(null, "", `?at=${screenParam(next)}`);
    }
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
      // Back or Forward while a Submit posts: the Wrap up stays, with its address.
      if (posting.current) { window.history.pushState(null, "", `?at=${screenParam(screenRef.current)}`); return; }
      if (screenRef.current.kind !== "about") setStorageNoticeDone(true);
      setScreen(parseScreen(new URLSearchParams(window.location.search).get("at"), started, screenCount(instrument.layout, chapters.length)));
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [started, chapters.length, instrument.layout]);

  const start = async (values: ResponseFields, chosen: string[]) => {
    // The preview keeps the details in memory and moves on (stories/E5-6, acceptance 4).
    if (preview) {
      if (sample) keepSample({ fields: values, picks: chosen, started: true });
      setPicks(chosen);
      setSavedPicks(chosen);
      setFields(values);
      setStarted(true);
      go({ kind: "chapter", index: 0 });
      return;
    }
    setStarting(true);
    setStartError(null);
    try {
      const response = await fetch(`/r/${encodeURIComponent(token)}/start`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ fields: values, perspectives: chosen }) });
      const body = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string; response?: string; submittedAt?: unknown; changedSince?: unknown };
      if (!response.ok || !body.ok) {
        // A link that changed (closed, revoked) since the page opened: the page shows its state.
        if (response.status === 410 || response.status === 404 || response.status === 403 || response.status === 409) { window.location.reload(); return; }
        setStartError((response.status === 422 || response.status === 429 || response.status === 503) && body.error ? body.error : RESPONDENT_COPY.startFailed);
        return;
      }
      setPicks(chosen);
      setSavedPicks(chosen);
      setFields(Object.fromEntries(Object.entries(values).map(([k, v]) => [k, v.trim()])));
      // The saver answers for the new response from now, before the drafts go again. Start
      // can name a response other than the one the page answered for (another window
      // replaced the cookie): that is a lost response too, and the cards go again.
      if (typeof body.response === "string") {
        const other = responseId !== null && body.response !== responseId;
        if (other && !lost.current) { saver.reset(); wrapSaver.reset(); lost.current = true; }
        setResponseId(body.response);
        saver.bind(body.response);
        wrapSaver.bind(body.response);
        // The response's Submit and its changes since, as the server holds them after this
        // Start (startSubmit): another response replaces what the page knows; for the same
        // one the page shows the latest Submit it knows.
        const next = startSubmit(submitted?.at ?? null, seenRef.current, body, other);
        if (next.submitted !== "keep") setSubmitted(next.submitted ? { at: next.submitted.at, name: firstName(values) ?? (other ? null : submitted?.name ?? null), returning: true } : null);
        setSeen(next.seen);
      }
      startedHere.current = true;
      savedSinceStart.current = false;
      setStarted(true);
      // After a lost response the cards and the Wrap up on the page go to the new one (the
      // saver holds nothing for it, so whatever the form says is a change).
      if (lost.current) { lost.current = false; saver.resend(drafts); wrapSaver.queue(wrapNow.current); }
      go({ kind: "chapter", index: 0 });
    } catch {
      setStartError(RESPONDENT_COPY.startFailed);
    } finally {
      setStarting(false);
    }
  };

  const firstChapter = chaptersFor(areas, items, picks)[0]?.name ?? null;
  // In the preview the closing date is ringed on Share (the step that sets it).
  const note: React.ReactNode = saver.unsaved || wrapSaver.failed ? RESPONDENT_COPY.notSaved : headerNote && rings.has("note") ? <span className="rounded-md px-1 ring-2 ring-violet ring-offset-2 ring-offset-surface" data-ring>{headerNote}</span> : headerNote;
  const page = instrument.layout === "page";
  const names = chapters.map((c) => c.name ?? instrument.title);
  // What counts as answered: what the server holds complete, or in the preview the cards as
  // they stand (nothing is saved there).
  const done = preview ? Object.fromEntries(items.map((it) => [it.id, isComplete(answerOfDraft(drafts[it.id] ?? EMPTY_DRAFT, instrument.method, instrument.showProposed, it.proposed), instrument.reasonRule)])) : saver.done;
  const progress = progressOf(chapters, done);
  const byId = new Map(items.map((it) => [it.id, it]));
  const gaps = gapsOf(chapters, done, (id) => answerOfDraft(drafts[id] ?? EMPTY_DRAFT, instrument.method, instrument.showProposed, byId.get(id)?.proposed ?? null), instrument.reasonRule);
  // The Wrap up's tally and sections, from the cards as the respondent left them.
  const answersNow = Object.fromEntries(chapters.flatMap((c) => c.items).map((it) => [it.id, answerOfDraft(drafts[it.id] ?? EMPTY_DRAFT, instrument.method, instrument.showProposed, it.proposed)]));
  const buckets = tallyOf(instrument.method, chapters.flatMap((c) => c.items), answersNow, instrument.reasonRule);
  const tally = Object.fromEntries(Object.entries(buckets).map(([k, ids]) => [k, ids.length])) as Record<Bucket, number>;
  const chapterOf = new Map(chapters.flatMap((c, i) => c.items.map((it) => [it.id, i] as const)));
  const sections: WrapSection[] = (["higher", "lower", "notNeeded", "unclear"] as const).flatMap((bucket) => buckets[bucket].map((id) => {
    const it = byId.get(id)!;
    const a = answersNow[id];
    return { bucket, itemId: id, reference: it.reference, title: it.title, value: a?.kind === "unclear" ? null : (a?.value ?? null), text: a?.reason ?? null, chapter: chapterOf.get(id) ?? 0 };
  }));
  const fieldsMissing = missingMandatory(instrument.fields, { ...fields, ...(prefilled ?? {}) }).length > 0;
  // The sample's Submit (stories/E12-4, acceptance 1): Done, with nothing sent or stored.
  const sampleSubmit = () => {
    const at = new Date().toISOString();
    setSubmitted({ at, name: firstName(fields), returning: false });
    keepSample({ submittedAt: at });
    go({ kind: "done" });
  };
  const submit = async () => {
    setSubmitting(true);
    posting.current = true;
    setSubmitError(null);
    try {
      // Every change on the cards and the Wrap up reaches the server first, so the Submit is
      // of what the respondent sees: a change that cannot be saved stops it, and so does one
      // refused or changed elsewhere meanwhile (the card or the Wrap up says which). The form
      // cannot change while Submit posts.
      const cards = await saver.settle();
      if (cards !== "ok") { setSubmitError(cards === "check" ? RESPONDENT_ERRORS.checkCards : RESPONDENT_COPY.submitFailed); return; }
      const held = await wrapSaver.settle();
      if (held !== "ok") { setSubmitError(held === "check" ? wrapSaver.lastProblem() : RESPONDENT_COPY.submitFailed); return; }
      const posted = cleanWrap(wrapNow.current);
      const missing = posted.missing.text.trim() ? { text: posted.missing.text, area: posted.missing.area || null, value: posted.missing.value || null } : null;
      const response = await fetch(`/r/${encodeURIComponent(token)}/submit`, { method: "POST", signal: AbortSignal.timeout(SAVE_TIMEOUT_MS), headers: { "content-type": "application/json" }, body: JSON.stringify({ response: responseId, confidence: posted.confidence, signedOff: posted.signed, signOffText: signOffFor(props.closing), closingAnswer: posted.closingAnswer, missing, ...wrapSaver.claim() }) });
      const body = (await response.json().catch(() => ({}))) as { submittedAt?: string; name?: string | null; error?: string; version?: unknown; wrap?: WrapValue; changedSince?: unknown };
      // Answered: the page can move again.
      posting.current = false;
      if (response.ok && body.submittedAt) {
        // The server holds the Wrap up now; the sign-off is ticked again for the next Submit
        // (Back from Done shows it unticked).
        wrapSaver.submitted(body.version, posted);
        setWrapState((w) => ({ ...w, signed: false }));
        setSeen(heardSubmit(seenRef.current, { submittedAt: body.submittedAt, changedSince: false }));
        setSubmitted({ at: body.submittedAt, name: body.name ?? props.welcome?.name ?? submitted?.name ?? firstName(fields), returning: false });
        go({ kind: "done" });
        return;
      }
      // Another window or device changed the Wrap up since: it shows the stored one.
      if (response.status === 409 && body.error === "stale") { wrapSaver.adopt(body); heard(body); return; }
      if (response.status === 410 || response.status === 404 || (response.status === 403 && body.error !== RESPONDENT_ERRORS.planFull) || (response.status === 409 && body.error === "notOpen")) { window.location.reload(); return; }
      if (response.status === 409) { lostResponse(); return; }
      setSubmitError(body.error ?? RESPONDENT_COPY.submitFailed);
    } catch {
      setSubmitError(RESPONDENT_COPY.submitFailed);
    } finally {
      posting.current = false;
      setSubmitting(false);
    }
  };
  const nav = <ChapterRow accent={accent} chapters={names.map((name) => ({ name }))} progress={progress} screen={screen} showRow={!page} onGo={(next) => go(next)} locked={submitting} ring={rings.has("nav")} />;
  // The visitors' sample has its own band above the header (src/app/sample/page.tsx).
  const previewStrip = preview && !sample ? <div className="bg-sun-soft px-5 py-1.5 text-center text-xs font-semibold text-sun-text" data-testid="preview-note">{ABOUT_YOU_COPY.previewNote}</div> : null;
  const welcome = props.welcome && !welcomeDone && screen.kind !== "about" ? (
    <div className="flex flex-col gap-0.5 border-b border-hairline bg-mint-soft px-5 py-2.5 text-sm text-mint-text @xl:px-8" role="status" data-testid="welcome-back">
      <p className="font-semibold">{RESPONDENT_COPY.welcomeBack(props.welcome.name)}</p>
      <p>{RESPONDENT_COPY.answeredBefore(props.welcome.answered, props.welcome.total)}</p>
    </div>
  ) : null;
  const since = changedSince && submitted && screen.kind === "wrap" ? <p className="border-b border-sun bg-sun-soft px-5 py-2.5 text-sm font-semibold text-sun-text @xl:px-8" role="status" data-testid="changed-since">{RESPONDENT_COPY.changedSince}</p> : null;
  const banner = welcome || since || saver.offline || (saver.storageOff && !storageNoticeDone) ? (
    <>
      {welcome}
      {since}
      {(saver.offline || (saver.storageOff && !storageNoticeDone)) && (
        <div className="flex flex-col gap-1 border-b border-sun bg-sun-soft px-5 py-2.5 text-sm text-sun-text @xl:px-8" role="status" data-testid="saving-banner">
          {saver.offline && <p>{RESPONDENT_COPY.offline}</p>}
          {saver.storageOff && !storageNoticeDone && <p data-testid="storage-notice">{RESPONDENT_COPY.storageOff}</p>}
        </div>
      )}
    </>
  ) : null;
  const chapterScreen = (index: number) => {
    const here = page ? chapters.flatMap((c) => c.items) : chapters[index].items;
    const left = here.filter((it) => !done[it.id]).length;
    const last = page || index >= chapters.length - 1;
    return (
      <ChapterScreen workspaceName={workspaceName} accent={accent} logoUrl={logoUrl} headerNote={note} nav={nav} banner={previewStrip ? <>{previewStrip}{banner}</> : banner} title={instrument.title} layout={instrument.layout} chapters={chapters} index={index} item={item} method={instrument.method} labels={instrument.labels} showProposed={instrument.showProposed} reasonRule={instrument.reasonRule} drafts={drafts} saved={sample ? done : preview ? {} : saver.saved} savedLabel={sample ? (sampleKept ? SAMPLE_COPY.saved : SAMPLE_COPY.notKept) : undefined} errors={saver.errors} unsaved={saver.unsaved} onChange={change} onItem={(i) => { setItem(i); setWelcomeDone(true); }}
        onBack={() => go(index === 0 || page ? { kind: "about" } : { kind: "chapter", index: index - 1 })}
        continueLabel={last ? RESPONDENT_COPY.continueWrap : RESPONDENT_COPY.continueTo(names[index + 1])}
        footerNote={left > 0 ? RESPONDENT_COPY.toRateHere(left, here.length) : page ? RESPONDENT_COPY.allRatedPage(here.length) : RESPONDENT_COPY.allRated(here.length)}
        onContinue={() => go(last ? { kind: "wrap" } : { kind: "chapter", index: index + 1 })} poweredBy={props.poweredBy}
        rings={{ rating: rings.has("rating"), card: rings.has("cards"), wording: rings.has("wording") }} />
    );
  };
  // The builder's preview shows the Wrap up even with nothing to rate, for the Closing card
  // ("No items to review.", E5-5).
  const width = screen.kind === "chapter" && chapters[screen.index] ? "max-w-[1032px]" : (screen.kind === "wrap" || (screen.kind === "done" && !submitted)) && (chapters.length > 0 || preview) ? "max-w-[792px]" : "max-w-[752px]";
  return (
    <div className={cn("mx-auto min-h-screen w-full bg-ground", width)} data-ready={ready || undefined}>
      {screen.kind === "about" ? (
        <AboutYou workspaceName={workspaceName} logoUrl={logoUrl} accent={accent} headerNote={note} title={instrument.title} intro={instrument.intro} fields={instrument.fields} prefilled={prefilled} initialValues={fields} initialPicks={picks} firstChapter={firstChapter} perspectives={instrument.perspectives} picked={picks} onPickPerspectives={setPicks} starting={starting} startError={startError} onStart={start} nav={started ? nav : undefined} className="min-h-screen" poweredBy={props.poweredBy} preview={Boolean(preview) && !sample} ring={rings.has("fields") ? "fields" : undefined} />
      ) : screen.kind === "chapter" && chapters[screen.index] ? (
        chapterScreen(screen.index)
      ) : screen.kind === "done" && submitted ? (
        <div className={FRAME_OUTER} data-testid="done-screen">
          <div className={FRAME_CARD}>
          <RespondentHeader workspaceName={workspaceName} accent={accent} logoUrl={logoUrl} note={note} className={FRAME_HEADER} />
          <main className="flex grow flex-col gap-4 px-5 pt-6 pb-8 @xl:px-8">
            <h1 className="text-[22px] leading-7 font-extrabold tracking-[-0.025em] focus:outline-hidden" tabIndex={-1} data-screen-heading data-testid="done-thanks">{submitted.returning ? RESPONDENT_COPY.welcomeSubmitted(submitted.name) : RESPONDENT_COPY.thanks(submitted.name)}</h1>
            <p className="text-[17px] leading-[26px] text-ink-muted" data-testid="done-when">{sample ? SAMPLE_COPY.notSent : submitted.returning ? RESPONDENT_COPY.submittedOn(formatUtc(new Date(submitted.at)), props.closesAt ? formatUtc(new Date(props.closesAt)) : null) : RESPONDENT_COPY.submittedAt(formatUtc(new Date(submitted.at)))}</p>
            {changedSince && <p className="rounded-xl bg-sun-soft px-4 py-3 text-sm font-semibold text-sun-text" role="status" data-testid="changed-since">{RESPONDENT_COPY.changedSince}</p>}
            <p className="text-[15px] leading-[23px]" data-testid="done-summary">{RESPONDENT_COPY.summary({ agreed: tally.agreed, changed: tally.higher + tally.lower, notNeeded: tally.notNeeded, unclear: tally.unclear, rated: tally.rated, added: wrap.missing.text.trim() ? 1 : 0 }, !instrument.showProposed)}</p>
          </main>
          <div className={FRAME_ACTIONS}>
            <div className="flex flex-wrap items-center gap-3 @xl:justify-center">
              <button type="button" onClick={() => { setWrapState((w) => ({ ...w, signed: false })); go({ kind: "wrap" }); }} className="h-12 rounded-full border border-hairline-strong bg-surface px-6 text-base font-semibold focus:outline-hidden focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface" data-testid="done-change">{RESPONDENT_COPY.changeMine}</button>
              {sample && <a href={SAMPLE_COPY.startHref} rel="noreferrer" className={cn("flex h-12 items-center justify-center rounded-full bg-ink px-6 text-base font-bold text-ground focus:outline-hidden focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface", FRAME_PRIMARY)} data-testid="sample-start-free">{SAMPLE_COPY.startFree}</a>}
            </div>
          </div>
          </div>
          <PoweredBy show={props.poweredBy} privacy className={FRAME_POWERED} />
        </div>
      ) : (screen.kind === "wrap" || screen.kind === "done") && (chapters.length > 0 || preview) ? (
        <WrapUp workspaceName={workspaceName} accent={accent} closing={props.closing} method={instrument.method} labels={instrument.labels} showProposed={instrument.showProposed} chapters={names} areas={areasOf(chapters)} total={chapters.reduce((n, c) => n + c.items.length, 0)} className="min-h-screen"
          top={<><RespondentHeader workspaceName={workspaceName} accent={accent} logoUrl={logoUrl} note={note} className={FRAME_HEADER} />{nav}{banner}</>}
          gaps={gaps}
          onGo={(chapter, itemId) => { const at = itemId ? chapters[chapter].items.findIndex((it) => it.id === itemId) : 0; const one = instrument.layout === "item"; go({ kind: "chapter", index: page ? 0 : chapter }, one ? Math.max(at, 0) : 0, one ? null : itemId ?? null); }}
          onBack={() => go(page ? { kind: "chapter", index: 0 } : { kind: "chapter", index: chapters.length - 1 })}
          tally={tally} sections={sections} value={wrap} onValue={setWrap} fieldsMissing={fieldsMissing} submitting={submitting} submitError={submitError} saveNote={sample ? null : wrapSaver.notice ?? wrapSaver.error} onSubmit={sample ? sampleSubmit : preview ? undefined : submit} poweredBy={props.poweredBy} preview={Boolean(preview) && !sample} ring={rings.has("closing")} />
      ) : (
        <div className={FRAME_OUTER} data-testid="nothing-to-rate">
          <div className={FRAME_CARD}>
          <RespondentHeader workspaceName={workspaceName} accent={accent} logoUrl={logoUrl} note={note} className={FRAME_HEADER} />
          {previewStrip}
          <main className="flex grow flex-col gap-4 px-5 pt-6 pb-8 @xl:px-8">
            <p className="text-[17px] leading-[26px] text-ink-muted">{PERSPECTIVES_COPY.nothingVisible}</p>
          </main>
          <div className={FRAME_ACTIONS}>
            <button type="button" onClick={() => go({ kind: "about" })} className="h-12 self-start rounded-full border border-hairline-strong bg-surface px-6 text-base font-semibold focus:outline-hidden focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface @xl:self-center" data-testid="nothing-about-you">{RESPONDENT_COPY.aboutYou}</button>
          </div>
          </div>
          <PoweredBy show={props.poweredBy} className={FRAME_POWERED} />
        </div>
      )}
    </div>
  );
}
