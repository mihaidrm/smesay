"use client";
// Reveal on scroll, once (design note 33, Motion; stories/E12-1, acceptance 2): a section
// rises 18 px and fades in over 700 ms the first time it enters the viewport, children
// staggered by 120 ms. The hiding class is set on the client only, after the component has
// checked for IntersectionObserver and for reduced motion, so a page without JavaScript or
// with reduced motion shows everything at rest (developer.mozilla.org/docs/Web/API/
// IntersectionObserver).
import { useEffect, useRef, useState } from "react";
import { cn } from "cn";

export function Reveal({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"rest" | "hidden" | "shown">("rest");
  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const already = el.getBoundingClientRect().top < window.innerHeight;
    if (already) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { setState("shown"); observer.disconnect(); }
    }, { rootMargin: "0px 0px -10% 0px" });
    // The hiding state is applied in the same tick as the observer starts, so nothing is
    // hidden without a watcher to show it again.
    setState("hidden");
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      data-reveal={state}
      style={{ transitionDelay: state === "shown" ? `${delay}ms` : undefined }}
      className={cn("transition-[opacity,transform] duration-700 ease-out", state === "hidden" && "translate-y-[18px] opacity-0", className)}
    >
      {children}
    </div>
  );
}
