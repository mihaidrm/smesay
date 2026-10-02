"use client";
// The Members section's controls (stories/E2-4, acceptance 1, 3 and 4): the invite form with
// its button at 40 percent until the field holds an address (the same zod rule as the server),
// the role control and Remove on each row for owners. Every action answers through form state
// (react.dev/reference/react/useActionState). Components: docs/design-system.md.
import { useActionState, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { INVITE_VALID_MINUTES } from "@/lib/invites";
import { inviteAction, removeAction, roleAction, type MembersState } from "./actions";

const EMAIL = z.email();
const INITIAL: MembersState = { error: null };

export function InviteForm() {
  const [email, setEmail] = useState("");
  const [state, action, pending] = useActionState<MembersState, FormData>(inviteAction, INITIAL);
  const ok = EMAIL.safeParse(email.trim()).success;
  return (
    <div className="flex flex-col gap-3 px-4 py-3">
      <form action={action} noValidate className="flex items-end gap-3" onSubmit={() => setEmail("")}>
        <div className="flex flex-grow flex-col gap-2">
          <Label htmlFor="invite-email">Invite by email</Label>
          <Input id="invite-email" name="email" type="email" autoComplete="off" placeholder="name@company.example" value={email}
            onChange={(e) => setEmail(e.target.value)} aria-invalid={state.error ? true : undefined} aria-describedby={state.error ? "invite-error" : undefined} className="h-9" />
        </div>
        <Button type="submit" loading={pending} disabled={!ok} className={ok ? undefined : "opacity-40"}>Send invite</Button>
      </form>
      {state.error && <p id="invite-error" role="alert" className="text-sm text-danger">{state.error}</p>}
      {!state.error && state.sent && <p role="status" className="text-[13px] text-agree-text">Invite sent. They get a sign-in link that works once and expires in {INVITE_VALID_MINUTES} minutes.</p>}
    </div>
  );
}

export function MemberRow({ userId, name, email, role, joined, manage, self, lastOwner }: {
  userId: string; name: string; email: string; role: "owner" | "member"; joined: string; manage: boolean; self: boolean; lastOwner: boolean;
}) {
  const [roleState, changeRole, rolePending] = useActionState<MembersState, FormData>(roleAction, INITIAL);
  const [removeState, remove, removePending] = useActionState<MembersState, FormData>(removeAction, INITIAL);
  const error = roleState.error ?? removeState.error;
  return (
    <div data-testid="member-row" className="border-b border-grey-100 px-4 py-2">
      <div className="flex min-h-9 items-center gap-4">
        <div className="flex-grow font-medium">{name || <span className="font-normal text-ink-muted">No name yet</span>}{self && <span className="ml-2 text-xs font-normal text-ink-muted">you</span>}</div>
        <div className="w-[260px] text-ink-muted">{email}</div>
        <div className="w-[140px]">
          {manage && !lastOwner ? (
            <form action={changeRole}>
              <input type="hidden" name="userId" value={userId} />
              <select name="role" defaultValue={role} aria-label={`Role of ${email}`} disabled={rolePending} onChange={(e) => e.currentTarget.form?.requestSubmit()}
                className="h-8 rounded-md border border-hairline-strong bg-white px-2 text-sm">
                <option value="owner">Owner</option>
                <option value="member">Member</option>
              </select>
            </form>
          ) : (role === "owner" ? "Owner" : "Member")}
        </div>
        <div className="w-[160px] text-ink-muted">{joined}</div>
        <div className="flex w-[90px] justify-end">
          {manage && !lastOwner && (
            <form action={remove}>
              <input type="hidden" name="userId" value={userId} />
              <Button type="submit" variant="tertiary" size="small" loading={removePending} className="text-danger hover:text-danger">Remove</Button>
            </form>
          )}
        </div>
      </div>
      {error && <p role="alert" className="pb-1 text-sm text-danger">{error}</p>}
    </div>
  );
}
