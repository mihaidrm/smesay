"use client";
// "Include unsubmitted answers" (stories/E8-1, acceptance 7; decision 0030): on by default;
// the choice is kept per PM per instrument (saveIncludeUnsubmitted), then the page reloads its
// numbers without the URL's own unsubmitted parameter, so the stored choice applies.
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Toggle } from "@/components/app/toggle";
import { RESULTS_COPY } from "@/lib/results-copy";
import { saveIncludeUnsubmitted } from "./actions";

export function UnsubmittedSwitch({ projectId, on }: { projectId: string; on: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const change = (next: boolean) => startTransition(async () => {
    const result = await saveIncludeUnsubmitted(projectId, next);
    if (result.error) return;
    const q = new URLSearchParams(params.toString());
    q.delete("unsubmitted");
    const s = q.toString();
    router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false });
    router.refresh();
  });
  return (
    <div className="flex items-center gap-2.5">
      <Toggle checked={on} onChange={change} disabled={pending} aria-labelledby="include-unsubmitted" />
      <span id="include-unsubmitted" className="text-sm font-semibold">{RESULTS_COPY.includeUnsubmitted}</span>
    </div>
  );
}
