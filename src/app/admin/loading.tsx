// The loading state of every admin page while the admin check and the first reads run
// (CLAUDE.md, PM side; node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/
// loading.md). The admin check runs in the layout first, so anyone else gets the 404 and never
// this line.
export default function AdminLoading() {
  return (
    <main className="px-8 py-6" aria-busy="true">
      <p className="text-ink-muted">Loading.</p>
    </main>
  );
}
