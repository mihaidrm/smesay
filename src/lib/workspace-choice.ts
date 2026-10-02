// Which workspace a request works in, from the person's memberships and the id stored on the
// session (stories/E2-3, acceptance 3 to 5). Pure, so it is unit tested; src/lib/
// current-workspace.ts applies the result. A fresh session (nothing stored) with one
// membership selects it without asking, because every sign-in starts a new session row. A
// stored id that is no longer among the memberships (the person was removed) goes to the
// chooser, or to the create page when nothing is left.
export type Membership = { id: string };
export type Choice<W extends Membership> =
  | { kind: "current"; workspace: W }
  | { kind: "select"; workspace: W }
  | { kind: "switch" }
  | { kind: "create" };

export function chooseWorkspace<W extends Membership>(memberships: W[], storedId: string | null): Choice<W> {
  if (memberships.length === 0) return { kind: "create" };
  const stored = storedId ? memberships.find((w) => w.id === storedId) : undefined;
  if (stored) return { kind: "current", workspace: stored };
  if (storedId === null && memberships.length === 1) return { kind: "select", workspace: memberships[0] };
  return { kind: "switch" };
}
