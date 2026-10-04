"use client";
// "Include unsubmitted answers" (stories/E8-1, acceptance 7; decision 0030): on by default;
// the choice is kept per PM per instrument (saveIncludeUnsubmitted), then the page reloads its
// numbers without the URL's own unsubmitted parameter, so the stored choice applies (one
// request: a new URL renders the page, the same URL is refreshed). A choice the server did
// not save says so.
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Toggle } from "@/components/app/toggle";
import { RESULTS_COPY } from "@/lib/results-copy";
import { saveIncludeUnsubmitted } from "./actions";

export function UnsubmittedSwitch({ projectId, on }: { projectId: string; on: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const change = (next: boolean) => startTransition(async () => {
    setError(null);
    const result = await saveIncludeUnsubmitted(projectId, next).catch(() => ({ error: RESULTS_COPY.saveFailed }));
    if (result.error) { setError(result.error); return; }
    if (!params.has("unsubmitted")) { router.refresh(); return; }
    const q = new URLSearchParams(params.toString());
    q.delete("unsubmitted");
    const s = q.toString();
    router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false });
  });
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <Toggle checked={on} onChange={change} disabled={pending} aria-labelledby="include-unsubmitted" />
      <span id="include-unsubmitted" className="text-sm font-semibold">{RESULTS_COPY.includeUnsubmitted}</span>
      {error && <span role="alert" className="text-sm text-danger">{error}</span>}
    </div>
  );
}
