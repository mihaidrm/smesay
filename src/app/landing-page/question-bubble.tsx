"use client";
// The question bubble of the landing page (stories/E12-5; decision 0049; copy in
// docs/copy/landing.md, Question bubble, through src/lib/support-copy.ts). A 56 px round
// button at the bottom right (16 px from the edges on a phone, 24 px from 768 px) opens a
// panel anchored to the bottom: the full width on a phone, 360 px on a desktop. It is a
// non-modal dialog (role dialog with a name, developer.mozilla.org/docs/Web/Accessibility/
// ARIA/Reference/Roles/dialog_role): focus moves to the email field when it opens and back to
// the button when it closes; Escape and Close close it. The panel stays mounted while closed
// (hidden), so the typed text is kept. Send posts JSON to /api/support (src/app/api/support/
// route.ts); a hidden "website" field a person never fills is sent with it. The landing page
// keeps its own colours whatever the app's mode (decision 0041), so they are written out.
// The page renders this only when NEXT_PUBLIC_SUPPORT_EMAIL is set (acceptance 1).
import { MessageCircle, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "cn";
import { buttonVariants } from "@/components/ui/button";
import { QUESTION_MAX, SUPPORT_COPY, SUPPORT_PER_ADDRESS } from "@/lib/support-copy";

type State = { kind: "idle" } | { kind: "sending" } | { kind: "sent"; email: string } | { kind: "error"; message: string; field?: "email" | "question" };

const FIELD = "w-full rounded-xl border border-[#CFCBE0] bg-white px-3.5 text-[16px] text-[#15131F] outline-none focus-visible:border-[#6D4CF5] focus-visible:ring-2 focus-visible:ring-[#6D4CF5] focus-visible:ring-offset-2 focus-visible:ring-offset-white aria-[invalid=true]:border-[#C2412D]";

export function QuestionBubble({ supportEmail }: { supportEmail: string }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [question, setQuestion] = useState("");
  const [website, setWebsite] = useState("");
  const [state, setState] = useState<State>({ kind: "idle" });
  const button = useRef<HTMLButtonElement>(null);
  const emailField = useRef<HTMLInputElement>(null);
  const wasOpen = useRef(false);
  const id = useId();

  useEffect(() => {
    if (open) emailField.current?.focus();
    else if (wasOpen.current) button.current?.focus();
    wasOpen.current = open;
  }, [open]);

  const close = () => {
    setOpen(false);
    // A sent message is kept until the panel closes; the next opening starts a new one.
    setState((s) => (s.kind === "sent" ? { kind: "idle" } : s));
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state.kind === "sending") return;
    const typed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(typed)) return setState({ kind: "error", field: "email", message: SUPPORT_COPY.emailMissing });
    if (!question.trim()) return setState({ kind: "error", field: "question", message: SUPPORT_COPY.questionEmpty });
    if (question.trim().length > QUESTION_MAX) return setState({ kind: "error", field: "question", message: SUPPORT_COPY.questionLong(QUESTION_MAX) });
    setState({ kind: "sending" });
    try {
      const res = await fetch("/api/support", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: typed, question, website, page: window.location.pathname }) });
      if (res.ok) {
        setQuestion("");
        return setState({ kind: "sent", email: typed });
      }
      if (res.status === 429) return setState({ kind: "error", message: SUPPORT_COPY.tooMany(SUPPORT_PER_ADDRESS, supportEmail) });
      const body = (await res.json().catch(() => ({}))) as { problem?: string };
      if (body.problem === "email") return setState({ kind: "error", field: "email", message: SUPPORT_COPY.emailMissing });
      if (body.problem === "questionEmpty") return setState({ kind: "error", field: "question", message: SUPPORT_COPY.questionEmpty });
      if (body.problem === "questionLong") return setState({ kind: "error", field: "question", message: SUPPORT_COPY.questionLong(QUESTION_MAX) });
      setState({ kind: "error", message: SUPPORT_COPY.failed(supportEmail) });
    } catch {
      setState({ kind: "error", message: SUPPORT_COPY.failed(supportEmail) });
    }
  };

  const fieldError = state.kind === "error" ? state.field : undefined;
  return (
    <>
      <button ref={button} type="button" onClick={() => (open ? close() : setOpen(true))} aria-expanded={open} aria-controls={`${id}-panel`} aria-label={SUPPORT_COPY.button}
        className="fixed right-4 bottom-4 z-40 grid size-14 place-items-center rounded-full bg-[#6D4CF5] text-white shadow-[0_10px_30px_rgba(22,21,42,0.35)] outline-none transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-[#9B86FF] focus-visible:ring-offset-2 focus-visible:ring-offset-white motion-reduce:transition-none md:right-6 md:bottom-6" data-testid="question-bubble">
        {open ? <X aria-hidden="true" className="size-6" /> : <MessageCircle aria-hidden="true" className="size-6" />}
      </button>
      <div id={`${id}-panel`} role="dialog" aria-labelledby={`${id}-title`} hidden={!open} onKeyDown={(e) => { if (e.key === "Escape") { e.stopPropagation(); close(); } }}
        className="fixed inset-x-0 bottom-0 z-50 flex max-h-[calc(100dvh-16px)] flex-col gap-3 overflow-y-auto rounded-t-[20px] border border-[#E4E1EE] bg-white p-5 text-[#15131F] shadow-[0_-10px_40px_rgba(22,21,42,0.25)] md:inset-x-auto md:right-6 md:bottom-24 md:w-[360px] md:rounded-[20px]" data-testid="question-panel">
        <div className="flex items-start justify-between gap-3">
          <h2 id={`${id}-title`} className="text-[18px] leading-6 font-extrabold tracking-[-0.02em]">{SUPPORT_COPY.title}</h2>
          <button type="button" onClick={close} className="-m-2 grid size-10 shrink-0 place-items-center rounded-full text-[#5E5A72] outline-none hover:bg-[#F2F0F8] focus-visible:ring-2 focus-visible:ring-[#6D4CF5]" data-testid="question-close">
            <X aria-hidden="true" className="size-5" /><span className="sr-only">{SUPPORT_COPY.close}</span>
          </button>
        </div>
        <p className="text-[14px] leading-5 text-[#5E5A72]">{SUPPORT_COPY.line}</p>
        {state.kind === "sent" ? (
          <p role="status" className="rounded-xl bg-[#E6F7F1] px-3.5 py-3 text-[15px] leading-[22px] font-semibold text-[#0F6B53]" data-testid="question-sent">{SUPPORT_COPY.sent(state.email)}</p>
        ) : (
          <form onSubmit={send} noValidate className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor={`${id}-email`} className="text-[14px] font-semibold">{SUPPORT_COPY.email}</label>
              <input ref={emailField} id={`${id}-email`} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={fieldError === "email" || undefined} aria-describedby={fieldError === "email" ? `${id}-error` : undefined} className={cn(FIELD, "h-12")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor={`${id}-question`} className="text-[14px] font-semibold">{SUPPORT_COPY.question}</label>
              <textarea id={`${id}-question`} rows={4} value={question} onChange={(e) => setQuestion(e.target.value)} aria-invalid={fieldError === "question" || undefined} aria-describedby={fieldError === "question" ? `${id}-error` : undefined} className={cn(FIELD, "min-h-[104px] resize-y py-3 leading-[22px]")} />
            </div>
            {/* A field a person never sees or fills (stories/E12-5, acceptance 3). */}
            <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
              <label htmlFor={`${id}-website`}>Website</label>
              <input id={`${id}-website`} name="website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
            </div>
            {state.kind === "error" && <p id={`${id}-error`} role="alert" className="text-[14px] leading-5 text-[#B42318]" data-testid="question-error">{state.message}</p>}
            <p className="text-[13px] leading-5 text-[#5E5A72]">{SUPPORT_COPY.privacyLine} <Link href="/legal/privacy" className="font-semibold text-[#5A3BE0] underline underline-offset-4">{SUPPORT_COPY.privacy}</Link></p>
            <button type="submit" disabled={state.kind === "sending"} aria-busy={state.kind === "sending" || undefined} className={buttonVariants({ variant: "primary", className: "h-12 w-full text-base focus-visible:ring-offset-white" })} data-testid="question-send">
              {state.kind === "sending" ? SUPPORT_COPY.sending : SUPPORT_COPY.send}
            </button>
          </form>
        )}
      </div>
    </>
  );
}
