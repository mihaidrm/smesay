"use client";
// One file's download on the Export tab (stories/E10-1): a link to the export route, so it works
// before the page's script loads; with the script, the click fetches the file, saves it under
// the name the route gives (Content-Disposition, filename*) through an object URL
// (developer.mozilla.org/docs/Web/API/URL/createObjectURL_static), shows "Preparing the file"
// while it waits, and says so when the route fails (docs/copy/errors.md, Export failed). The
// fetch does not follow a redirect (redirect: "manual", developer.mozilla.org/docs/Web/API/
// RequestInit#redirect): a signed-out session is sent to the sign-in page, which must not be
// saved as the file, so a redirect counts as a failure.
import { useState } from "react";
import { buttonVariants } from "@/components/ui/button";

const nameOf = (disposition: string | null, fallback: string) => {
  const star = disposition?.match(/filename\*=UTF-8''([^;]+)/i);
  if (star) return decodeURIComponent(star[1]);
  return disposition?.match(/filename="([^"]+)"/i)?.[1] ?? fallback;
};

// pages (E10-3): the page limit and the note with "{pages}" where the count goes; the note shows
// when the route's x-summary-pages header is over the limit.
export const pagesNote = (count: number, pages?: { limit: number; note: string }) =>
  pages && count > pages.limit ? pages.note.replace("{pages}", String(count)) : null;

export function ExportDownload({ href, label, srLabel, busyLabel, failed, testId, fallbackName, pages }: { href: string; label: string; srLabel: string; busyLabel: string; failed: string; testId: string; fallbackName: string; pages?: { limit: number; note: string } }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  async function download(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    // Inside the disabled content of an admin's view (E14-4) a download writes the export log,
    // so it does nothing; the link is drawn disabled (data-download, src/app/globals.css).
    if (busy || e.currentTarget.closest("fieldset:disabled")) return;
    setBusy(true);
    setError(false);
    setNote(null);
    try {
      const res = await fetch(href, { cache: "no-store", redirect: "manual" });
      if (!res.ok) throw new Error(String(res.status));
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = nameOf(res.headers.get("content-disposition"), fallbackName);
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setNote(pagesNote(Number(res.headers.get("x-summary-pages")), pages));
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="flex flex-col gap-2">
      <a href={href} download onClick={download} aria-busy={busy || undefined} className={buttonVariants({ variant: "secondary", size: "small", className: "self-start" })} data-testid={testId} data-download>
        {busy ? busyLabel : label}<span className="sr-only"> {srLabel}</span>
      </a>
      {note && <p role="status" className="rounded-lg bg-sun-soft px-3 py-2 text-sm text-sun-text" data-testid={`${testId}-pages`}>{note}</p>}
      {error && <p role="alert" className="rounded-lg bg-unclear-tint px-3 py-2 text-sm text-unclear-text" data-testid={`${testId}-error`}>{failed}</p>}
    </div>
  );
}
