"use client";
// The 404's scene (stories/E11-7; design note 92). The page is dark and the pointer is a torch:
// the big 404 is drawn twice, a faint fill that is always there and a lit copy shown only
// inside a 220 px circle round the pointer (a CSS mask, developer.mozilla.org/docs/Web/CSS/
// mask-image), so moving the pointer looks for the page. The three digits sit at different
// depths and drift against the pointer, and the robot leans the other way (the layered
// parallax of GitHub's 404). The pointer is read on pointermove
// (developer.mozilla.org/docs/Web/API/Element/pointermove_event) and written as CSS variables
// inside requestAnimationFrame (developer.mozilla.org/docs/Web/API/Window/requestAnimationFrame),
// so nothing re-renders; a scroll repaints the light at the same place. On a touch screen and
// under reduced motion (both read through matchMedia, developer.mozilla.org/docs/Web/API/
// Window/matchMedia, and followed when they change) the 404 is fully lit and nothing moves, the robot's float included; the
// server render is that still page. data-checked marks that the check ran (the tests wait on it). Under it, the missing page is an item
// card with the respondent's own rating row (src/components/respondent/rating-row.tsx), MoSCoW
// with Must proposed; the answer is classified the way the product classifies it
// (src/lib/scoring.ts classify) and the robot changes pose and says one line (aria-live
// polite, after "You rated it [VALUE]." for screen readers, so two answers of one kind are
// both read out). Nothing is sent or stored. The page's title, line and buttons come in as children,
// under the 404 on the left.
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Mascot, type MascotPose } from "@/components/app/mascot";
import { RatingRow } from "@/components/respondent/rating-row";
import { NOT_FOUND_SCENE as COPY } from "@/lib/error-pages-copy";
import { classify, labelFor } from "@/lib/scoring";
import type { AnswerKind } from "@/db/types";

const VIOLET = "#6D4CF5";
// The pose the robot takes for each answer: it waves at an agreement, has an idea at a new
// priority, shows the numbers at a disagreement and goes back to reading at a question.
export const POSE_FOR: Record<"idle" | "agree" | "change" | "disagree" | "unclear", MascotPose> = { idle: "reading", agree: "hi", change: "idea", disagree: "analysis", unclear: "reading" };
// How far each digit drifts, in pixels at the edge of the screen: the middle 0 is deepest.
const DEPTH = [14, 26, 18];
// The scene moves only with a pointer that hovers and without reduced motion, read through
// useSyncExternalStore (react.dev/reference/react/useSyncExternalStore) so a change of either
// setting while the page is open stops or starts it; false on the server.
const QUERIES = ["(hover: hover)", "(prefers-reduced-motion: reduce)"];
const motionAllowed = () => window.matchMedia(QUERIES[0]).matches && !window.matchMedia(QUERIES[1]).matches;
const subscribeMotion = (changed: () => void) => {
  const lists = QUERIES.map((q) => window.matchMedia(q));
  lists.forEach((l) => l.addEventListener("change", changed));
  return () => lists.forEach((l) => l.removeEventListener("change", changed));
};

export type Reacted = Exclude<AnswerKind, "pick">;
export const reactionFor = (picked: string): Reacted => classify({ method: "moscow", showProposed: true, proposed: "M", picked }).kind as Reacted;
// The robot's line and pose for a rating (picked is a MoSCoW code or "unclear").
export const robotFor = (picked: string | null): { line: string; pose: MascotPose } => {
  if (!picked) return { line: COPY.idle, pose: POSE_FOR.idle };
  const kind = reactionFor(picked);
  return { line: COPY.reactions[kind], pose: POSE_FOR[kind] };
};

export function LostPage({ children }: { children: React.ReactNode }) {
  const scene = useRef<HTMLDivElement>(null);
  const lit = useRef<HTMLDivElement>(null);
  const live = useSyncExternalStore(subscribeMotion, motionAllowed, () => false);
  const [picked, setPicked] = useState<string | null>(null);
  useEffect(() => {
    const root = scene.current;
    const layer = lit.current;
    if (!root || !layer) return;
    root.dataset.checked = "true";
    if (!live) return;
    let frame = 0, x = window.innerWidth / 2, y = window.innerHeight / 3;
    const paint = () => {
      frame = 0;
      const r = layer.getBoundingClientRect();
      root.style.setProperty("--lx", `${x - r.left}px`);
      root.style.setProperty("--ly", `${y - r.top}px`);
      root.style.setProperty("--px", `${(x / window.innerWidth - 0.5) * 2}`);
      root.style.setProperty("--py", `${(y / window.innerHeight - 0.5) * 2}`);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(paint); };
    const move = (e: PointerEvent) => { x = e.clientX; y = e.clientY; schedule(); };
    paint();
    window.addEventListener("pointermove", move);
    window.addEventListener("scroll", schedule, { passive: true });
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("scroll", schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [live]);
  const robot = robotFor(picked);
  // Each glyph's ink runs past its advance (the tight tracking), and a clipped background
  // stops at the box: the padding widens the box, the negative margin keeps the spacing.
  const digits = (faint: boolean) => COPY.cardRef.split("").map((d, i) => (
    <span key={i} className="inline-block" style={live ? { transform: `translate(calc(var(--px, 0) * ${-DEPTH[i]}px), calc(var(--py, 0) * ${-DEPTH[i] / 2}px))` } : undefined}>
      <span className={faint ? "-mr-[0.1em] pr-[0.1em] text-[rgba(243,241,250,0.07)]" : "-mr-[0.1em] bg-[linear-gradient(120deg,#B8A8FF_0%,#FF8A78_55%,#FFD36E_100%)] bg-clip-text pr-[0.1em] text-transparent"}>{d}</span>
    </span>
  ));
  const numerals = "text-[150px] leading-[0.85] font-extrabold tracking-[-0.06em] sm:text-[220px] lg:text-[300px]";
  const torch = "radial-gradient(circle 220px at var(--lx, 50%) var(--ly, 40%), #000 0%, rgba(0,0,0,0.55) 45%, transparent 72%)";
  return (
    <div ref={scene} data-testid="lost-page" data-live={live ? "true" : "false"} className="relative grid w-full gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-center lg:gap-14">
      <div className="flex flex-col items-start">
        <div aria-hidden="true" className="relative select-none" data-testid="lost-404">
          {/* The faint fill is the dark of the lights-off page; fully lit it would only blur the edges. */}
          <div className={live ? numerals : `${numerals} invisible`}>{digits(true)}</div>
          <div ref={lit} className={`absolute inset-0 ${numerals}`} style={live ? { maskImage: torch, WebkitMaskImage: torch } : undefined}>
            {digits(false)}
          </div>
        </div>
        {live && <p aria-hidden="true" className="mt-4 font-mono text-[12px] text-[#C9C4E0]" data-testid="lights-off">{COPY.lightsOff}</p>}
        <div className="mt-8 flex max-w-[560px] flex-col items-start gap-4">{children}</div>
      </div>
      <div className="relative flex w-full max-w-[460px] flex-col items-center gap-5 lg:justify-self-end">
        <div style={live ? { transform: "translate(calc(var(--px, 0) * 10px), calc(var(--py, 0) * 6px)) rotate(calc(var(--px, 0) * 4deg))" } : undefined}>
          <Mascot pose={robot.pose} size={120} className={live ? "landing-float" : undefined} />
        </div>
        <p aria-live="polite" data-testid="robot-line" className="min-h-[48px] text-center text-[16px] leading-6 text-[#F3F1FA]">
          {picked && <span className="sr-only">{`You rated it ${labelFor("moscow", null, picked)}. `}</span>}
          {robot.line}
        </p>
        <article data-testid="lost-card" className="w-full rounded-[20px] border border-hairline-strong bg-surface p-5 text-ink shadow-[0_24px_60px_rgba(0,0,0,0.45)] dark:shadow-[0_0_0_1px_rgba(155,134,255,0.25),0_24px_60px_rgba(0,0,0,0.55)]">
          <div className="font-mono text-[11px] text-ink-muted">{COPY.cardRef}</div>
          <h2 className="mt-1 text-[17px] leading-6 font-semibold">{COPY.cardTitle}</h2>
          <p className="mt-1 mb-4 text-[13px] leading-5 text-ink-muted">{COPY.cardLine}</p>
          <RatingRow method="moscow" labels={null} proposed="M" showProposed value={picked} accent={VIOLET} onChange={setPicked} name={COPY.cardTitle} idKey="lost-404" />
          <p className="mt-3 text-[12px] text-ink-muted">{COPY.notSaved}</p>
        </article>
      </div>
    </div>
  );
}
