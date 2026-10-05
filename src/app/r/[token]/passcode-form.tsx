"use client";
// The passcode form of a link (stories/E6-1, acceptance 4): one 48 px field and Continue;
// a wrong passcode shows the line from docs/copy/errors.md. On success the server action
// sets the cookie and the page re-renders as the instrument (router.refresh). From a 576 px
// column Continue is centered and at least 320 px wide, under the field, and the focus rings
// are offset on the card's white (decision 0052).
import { useActionState, useEffect, useId } from "react";
import { useRouter } from "next/navigation";
import { cn } from "cn";
import { FRAME_PRIMARY, FRAME_RING_OFFSET } from "@/components/respondent/frame";
import { LINK_PAGE_COPY } from "@/lib/sharing-copy";
import { enterPasscodeAction, type PasscodeState } from "./actions";

export function PasscodeForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState<PasscodeState, FormData>(enterPasscodeAction, { error: null, ok: false });
  const router = useRouter();
  const id = useId();
  useEffect(() => { if (state.ok) router.refresh(); }, [state.ok, router]);
  return (
    <form action={action} noValidate className="flex flex-col gap-3" data-testid="passcode-form">
      <input type="hidden" name="token" value={token} />
      <label htmlFor={`${id}-passcode`} className="text-sm font-semibold">{LINK_PAGE_COPY.passcodeLabel}</label>
      <input id={`${id}-passcode`} name="passcode" type="password" autoComplete="off" required className={"h-12 w-full rounded-xl border border-hairline-strong bg-surface px-4 text-[17px] text-ink focus:outline-hidden transition-colors focus-visible:border-violet focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 " + FRAME_RING_OFFSET} data-testid="passcode-field" />
      {state.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}
      <button type="submit" disabled={pending} className={cn("h-12 self-start rounded-full bg-ink px-6 text-base font-bold text-ground transition-opacity focus:outline-hidden focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 disabled:opacity-40 @xl:self-center", FRAME_RING_OFFSET, FRAME_PRIMARY)} data-testid="passcode-continue">{LINK_PAGE_COPY.passcodeButton}</button>
    </form>
  );
}
