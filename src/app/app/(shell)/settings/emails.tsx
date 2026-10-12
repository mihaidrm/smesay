"use client";
// Settings, Emails to you (stories/E16-1, acceptance 5): three switches of the person's own,
// one per kind of email, saved at once by setEmailPrefAction and shown from the server's state
// (user.email_prefs). The switch is the mode toggle's (src/components/ui/switch.tsx); a failed
// save puts it back and says so. Disabled during an admin's view (E14-4). Copy:
// src/lib/email-copy.ts, from docs/copy/app.md.
import { useOptimistic, useState, useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { EMAIL_KINDS, type EmailKind, type EmailPrefs } from "@/db/types";
import { EMAIL_COPY as C } from "@/lib/email-copy";
import { setEmailPrefAction } from "./actions";

export function EmailsCard({ prefs, disabled = false }: { prefs: EmailPrefs; disabled?: boolean }) {
  const [shown, setShown] = useOptimistic(prefs);
  const [, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const flip = (kind: EmailKind, on: boolean) => start(async () => {
    setShown({ ...shown, [kind]: on });
    setError(null);
    const result = await setEmailPrefAction(kind, on);
    if (result.error) setError(result.error);
  });
  return (
    <section className="card" aria-labelledby="emails-title" data-testid="emails-card">
      <h2 id="emails-title" className="border-b border-hairline px-4 py-3 font-semibold">{C.settings.title}</h2>
      <div className="flex flex-col gap-4 px-4 py-4 text-sm">
        <p className="text-xs text-ink-muted">{C.settings.line}</p>
        {EMAIL_KINDS.map((kind) => (
          <div key={kind} className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-0.5">
              <span id={`email-${kind}`} className="font-medium">{C.settings.kinds[kind].label}</span>
              <span className="text-xs text-ink-muted">{C.settings.kinds[kind].detail}</span>
            </div>
            <Switch checked={shown[kind]} onCheckedChange={(on) => flip(kind, on)} disabled={disabled} aria-labelledby={`email-${kind}`} data-testid={`email-switch-${kind}`} className="mt-0.5 cursor-pointer" />
          </div>
        ))}
        {error && <p role="alert" className="text-[13px] text-danger">{error}</p>}
      </div>
    </section>
  );
}
