"use client";
// The collapsible card (design note 110; docs/design-system.md, Components): a card whose
// content opens and closes from its title row. Built on the native details and summary
// elements (developer.mozilla.org/docs/Web/HTML/Reference/Elements/details): the open
// attribute says whether the content shows, the content stays in the DOM while closed, so
// forms keep their state and locators still resolve, and a click or Enter on the summary
// toggles it with no script. The name attribute, which lets one of a group open at a time,
// is not used: any card opens by a click and stays open.
// The summary row: the title (an h3, so aria-labelledby and the page's anchors keep
// working; a summary may hold heading content, developer.mozilla.org/docs/Web/HTML/
// Reference/Elements/summary) with a mono count beside it on the left, a one-line muted
// state summary and Lucide's chevron-down on the right, the hand cursor (the base rule in
// globals.css), the focus ring of every control. The open and close animate over 300 ms in
// src/app/globals.css (.collapsible), not under reduced motion.
// A link to an anchor inside a closed card ("Import a new version" to #upload-title, "Add it
// on Import" to #about-title, the rescue tip to #mapping-title) opens the card: on mount and
// on every hashchange the card opens when the hash's target is inside it.
import { ChevronDown } from "lucide-react";
import { useEffect, useRef } from "react";
import { cn } from "cn";

export function CollapsibleCard({ title, titleId, count, summary, mark, open, testId, className, bodyClassName, children, ...rest }: {
  title: string;
  titleId: string;
  count?: string | null;
  summary?: string | null;
  // mark: a label beside the title, such as the "Not saved" of the unsaved changes guard
  // (stories/E5-9), visible while the card is closed too.
  mark?: React.ReactNode;
  open: boolean;
  testId?: string;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
} & Omit<React.ComponentProps<"details">, "title" | "open" | "children" | "className">) {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const reveal = () => {
      const card = ref.current;
      if (!card || !window.location.hash) return;
      let target: Element | null = null;
      try { target = document.querySelector(window.location.hash); } catch { return; }
      if (target && card.contains(target) && !card.open) card.open = true;
    };
    reveal();
    window.addEventListener("hashchange", reveal);
    return () => window.removeEventListener("hashchange", reveal);
  }, []);
  return (
    <details ref={ref} open={open} className={cn("collapsible card", className)} aria-labelledby={titleId} data-testid={testId} {...rest}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-2xl px-4 py-3 outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-ground [&::-webkit-details-marker]:hidden">
        <span className="flex min-w-0 items-baseline gap-2">
          <h3 id={titleId} className="font-semibold">{title}</h3>
          {count ? <span className="font-mono text-xs text-ink-muted">{count}</span> : null}
          {mark}
        </span>
        <span className="flex min-w-0 shrink items-center gap-2 text-[13px] text-ink-muted">
          {summary ? <span className="truncate" data-testid="card-summary">{summary}</span> : null}
          <ChevronDown aria-hidden="true" className="collapsible-chevron size-4 shrink-0" />
        </span>
      </summary>
      <div className={bodyClassName ?? "flex flex-col gap-3 px-4 pb-4"}>{children}</div>
    </details>
  );
}
