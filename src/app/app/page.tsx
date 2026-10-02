// The signed-in landing (stories/E2-1). E2-3 replaces it with the workspace step and the project
// list. Copy: docs/copy/app.md.
import { requireSession } from "@/lib/session";

export default async function AppHome() {
  const session = await requireSession("/app");
  return (
    <main className="flex flex-col gap-2 px-8 py-6">
      <div className="text-xs text-ink-muted">SMEsay</div>
      <h1 className="text-xl font-medium">Signed in</h1>
      <p className="text-ink-muted">You are signed in as {session.user.email}.</p>
    </main>
  );
}
