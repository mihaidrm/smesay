"use client";
// The item detail's frame (stories/E8-5): a 560 px panel on the right of the viewport, labelled
// by the item's text, which takes the focus when it opens (the heading) and closes on Escape
// back to the tab (router.push to the URL without the item). It is a dialog that leaves the
// page usable (aria-modal false: developer.mozilla.org/docs/Web/Accessibility/ARIA/Reference/
// Roles/dialog_role), so the tab behind can still be read and the filter changed.
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

export function DetailShell({ closeHref, titleId, children }: { closeHref: string; titleId: string; children: React.ReactNode }) {
  const router = useRouter();
  const panel = useRef<HTMLElement>(null);
  // Focus on opening only: the panel is remounted for another item (its boundary is keyed by
  // the item), and a filter change with the panel open leaves the focus where the PM is.
  useEffect(() => {
    panel.current?.querySelector<HTMLElement>(`#${titleId}`)?.focus();
  }, [titleId]);
  return (
    <aside ref={panel} role="dialog" aria-modal="false" aria-labelledby={titleId}
      onKeyDown={(e) => { if (e.key === "Escape") router.push(closeHref, { scroll: false }); }}
      className="fixed inset-y-0 right-0 z-30 flex w-[560px] max-w-full flex-col gap-4 overflow-y-auto border-l border-hairline bg-surface p-6 shadow-card"
      data-testid="detail-panel">
      {children}
    </aside>
  );
}
