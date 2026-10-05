"use client";
// The guide card (stories/E15-1, acceptance 1; design note 39): the robot in its pose on the
// left, one line from docs/copy/guide.md (by id, src/lib/guide-lines.ts), at most one action
// (the first-project path's start alone may add "Try it on the sample first", E15-2 acceptance
// 4), and Dismiss, on the soft violet gradient of the Banner. Never a modal, never an overlay,
// nothing that moves or pulses (E15-3 acceptance 4). The caller decides whether the tip is
// visible for the person (src/lib/guide.ts tipVisible, pathHidden) and renders the card only
// then, on the server, so a dismissed tip never flashes. Dismiss hides it at once, moves the
// focus to the page's title and stores the dismissal (./guide-actions.ts); if the store fails
// the card comes back with a line saying so. New to the design system: design note 89.
import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { Mascot } from "@/components/app/mascot";
import { buttonVariants } from "@/components/ui/button";
import { GUIDE_COPY, GUIDE_LINES, type TipId } from "@/lib/guide-lines";
import { dismissTipAction } from "@/app/app/(shell)/guide-actions";
import { cn } from "cn";

export type GuideAction = { label: string; href: string };

export function GuideCard({ id, action, secondary, children, className }: { id: TipId; action?: GuideAction; secondary?: GuideAction; children?: React.ReactNode; className?: string }) {
  const [hidden, setHidden] = useState(false);
  const [failed, setFailed] = useState(false);
  const [, start] = useTransition();
  const card = useRef<HTMLElement>(null);
  if (hidden) return null;
  const tip = GUIDE_LINES[id];
  const dismiss = () => {
    // The focus goes to the page's title, not to the top of the document.
    const title = card.current?.closest("main")?.querySelector<HTMLElement>("h1, h2");
    if (title) { title.tabIndex = -1; title.focus(); }
    setHidden(true);
    start(async () => {
      try { await dismissTipAction(id); setFailed(false); } catch { setHidden(false); setFailed(true); }
    });
  };
  return (
    <section ref={card} aria-label={GUIDE_COPY.cardName} data-testid="guide-card" data-tip={id}
      className={cn("flex items-start gap-4 rounded-2xl border border-hairline bg-[linear-gradient(135deg,var(--violet-soft),var(--surface))] p-4 text-sm text-ink shadow-card", className)}>
      <Mascot pose={tip.pose} size={88} />
      <div className="flex min-w-0 flex-grow flex-col gap-3">
        {children}
        <p className="text-[15px] leading-[22px]" data-testid="guide-line">{tip.line}</p>
        <div className="flex flex-wrap items-center gap-2">
          {action && <Link href={action.href} className={buttonVariants({ size: "small" })} data-testid="guide-action">{action.label}</Link>}
          {secondary && id === "path.start" && <Link href={secondary.href} className={buttonVariants({ variant: "secondary", size: "small" })}>{secondary.label}</Link>}
          <button type="button" className={buttonVariants({ variant: "tertiary", size: "small" })} data-testid="guide-dismiss" onClick={dismiss}>{GUIDE_COPY.dismiss}</button>
        </div>
        {failed && <p role="alert" className="text-sm text-danger">{GUIDE_COPY.notSaved}</p>}
      </div>
    </section>
  );
}
