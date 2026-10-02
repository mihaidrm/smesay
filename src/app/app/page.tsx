// The signed-in landing (stories/E2-1). E2-3 replaces it with the workspace step and the project
// list.
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export default async function AppHome() {
  const session = await auth.api.getSession({ headers: await headers() });
  return (
    <main className="flex flex-col gap-2 px-8 py-6">
      <div className="text-xs text-ink-muted">SMEsay</div>
      <h1 className="text-xl font-medium">Signed in</h1>
      <p className="text-ink-muted">You are signed in as {session?.user.email}. Projects arrive with E2-3.</p>
    </main>
  );
}
