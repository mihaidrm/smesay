// The loading state of every page under /app (CLAUDE.md, PM side; node_modules/next/dist/docs/
// 01-app/03-api-reference/03-file-conventions/loading.md). Copy: docs/copy/app.md.
export default function Loading() {
  return (
    <main className="px-8 py-6" aria-busy="true">
      <p className="text-ink-muted">Loading.</p>
    </main>
  );
}
