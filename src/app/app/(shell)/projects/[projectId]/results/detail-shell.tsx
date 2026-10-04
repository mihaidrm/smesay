"use client";
// The item detail's frame (stories/E8-5; design note 62): a region in place of the tab,
// labelled by the item's text. The heading takes the focus when it opens; Escape inside it
// goes back to the tab (router.push to the URL without the item), and the item link that
// opened it takes the focus again (ReturnFocus, rendered with the tab's content).
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

// The item last opened in this tab of the browser; module state survives client navigation.
let opened: string | null = null;

export function DetailShell({ itemId, closeHref, titleId, children }: { itemId: string; closeHref: string; titleId: string; children: React.ReactNode }) {
  const router = useRouter();
  const region = useRef<HTMLElement>(null);
  // On opening only: the shell is remounted for another item (its boundary is keyed by the
  // item), and a filter change with the detail open leaves the focus where the PM is.
  useEffect(() => {
    opened = itemId;
    region.current?.querySelector<HTMLElement>(`#${titleId}`)?.focus();
  }, [itemId, titleId]);
  return (
    <section ref={region} aria-labelledby={titleId}
      onKeyDown={(e) => { if (e.key === "Escape") router.push(closeHref, { scroll: false }); }}
      className="flex flex-col gap-4" data-testid="detail-panel">
      {children}
    </section>
  );
}

// Back on the tab: the focus returns to the link of the item just closed, when it is shown.
export function ReturnFocus() {
  useEffect(() => {
    if (opened === null) return;
    const id = opened;
    opened = null;
    document.querySelector<HTMLElement>(`[data-item-link="${CSS.escape(id)}"]`)?.focus();
  }, []);
  return null;
}
