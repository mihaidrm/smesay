// The workspace invitation's context (stories/E16-1, acceptance 4): sendWorkspaceInvite in
// src/lib/members.ts runs better-auth's signInMagicLink inside run(), and the magic-link hook
// in src/lib/auth.ts reads current() to render the invitation email (10) in place of the
// sign-in email (1). AsyncLocalStorage keeps the context on the one call chain
// (nodejs.org/api/async_context.html, AsyncLocalStorage.run and getStore), so the public
// sign-in endpoint, which never calls run(), cannot be made to send an invitation.
import { AsyncLocalStorage } from "node:async_hooks";

export type Invitation = { inviterName: string; inviterEmail: string; workspaceName: string };

const store = new AsyncLocalStorage<Invitation>();

export const invitationContext = {
  run: <T>(invitation: Invitation, fn: () => Promise<T>): Promise<T> => store.run(invitation, fn),
  current: (): Invitation | null => store.getStore() ?? null,
};
