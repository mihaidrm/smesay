// The loading state of the pages outside the shell (/app/new, /app/switch) and of the shell
// itself while its layout loads (node_modules/next/dist/docs/01-app/03-api-reference/
// 03-file-conventions/loading.md). Copy: docs/copy/app.md.
export default function Loading() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-12" aria-busy="true">
      <p className="text-ink-muted">Loading.</p>
    </main>
  );
}
