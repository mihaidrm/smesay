"use client";
// The cursor light of the dark marketing sections (design note 33, Motion; decision 0041): a
// 760 px radial glow follows the pointer over the section, moved with a transform inside
// requestAnimationFrame, one element and no gradient repaint. The system cursor stays. Not
// rendered on a touch screen (hover: none) and left at its resting place under reduced
// motion; both read through matchMedia on the client, so the server render carries the
// resting glow and nothing else.
import { useEffect, useRef, useState } from "react";

export function CursorLight({ restX = 980, restY = 300 }: { restX?: number; restY?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [live, setLive] = useState(false);
  useEffect(() => {
    const hover = window.matchMedia("(hover: hover)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!hover || reduce) return;
    const spot = ref.current;
    const section = spot?.parentElement;
    if (!spot || !section) return;
    setLive(true);
    let frame = 0, x = 0, y = 0;
    const move = (e: PointerEvent) => {
      const r = section.getBoundingClientRect();
      x = e.clientX - r.left; y = e.clientY - r.top;
      if (frame) return;
      frame = requestAnimationFrame(() => { frame = 0; spot.style.transform = `translate(${x}px, ${y}px)`; });
    };
    const enter = () => { spot.style.opacity = "1"; };
    const leave = () => { spot.style.opacity = "0"; };
    section.addEventListener("pointermove", move);
    section.addEventListener("pointerenter", enter);
    section.addEventListener("pointerleave", leave);
    return () => {
      section.removeEventListener("pointermove", move);
      section.removeEventListener("pointerenter", enter);
      section.removeEventListener("pointerleave", leave);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);
  return (
    <div
      ref={ref}
      aria-hidden="true"
      data-testid="cursor-light"
      className="pointer-events-none absolute top-0 left-0 -mt-[380px] -ml-[380px] size-[760px] rounded-full bg-[radial-gradient(circle,rgba(155,134,255,0.26)_0%,rgba(255,138,120,0.10)_34%,rgba(0,0,0,0)_62%)] transition-opacity duration-500 will-change-transform"
      style={{ transform: `translate(${restX}px, ${restY}px)`, opacity: live ? undefined : 1 }}
    />
  );
}
