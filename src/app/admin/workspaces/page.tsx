// The Workspaces list (stories/E14-2, acceptance 1): every workspace, deleted ones too, with its
// plan, owners and usage, by last activity; searched by name, slug or a member's email through
// the address (?q=), a GET form that works before any script loads. The figures are E2-6's
// usage, as on the Overview (src/db/queries/admin.ts workspaceDirectory). Empty, loading and
// error states: the lines below, the Suspense fallback, src/app/error.tsx. Copy: docs/copy/
// app.md, Admin workspaces.
import Link from "next/link";
import { Suspense } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { workspaceDirectory } from "@/db/queries/admin";
import type { AdminProof } from "@/db/types";
import { requireAdmin } from "@/lib/admin";
import { WORKSPACE_ADMIN_COPY as C } from "@/lib/admin-copy";
import { formatEur } from "@/lib/ai/prices";

export const dynamic = "force-dynamic";

const DAY = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

export default async function WorkspacesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { proof } = await requireAdmin();
  const raw = (await searchParams).q;
  const q = ((Array.isArray(raw) ? raw[0] : raw) ?? "").trim().slice(0, 200);
  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-8 py-6" data-testid="admin-workspaces-page">
      <div className="flex flex-col gap-1">
        <div className="text-[13px] text-ink-muted">{C.crumb}</div>
        <h1 className="text-[30px] font-extrabold leading-9 tracking-[-0.03em]">{C.listTitle}</h1>
        <p className="text-ink-muted">{C.listIntro}</p>
      </div>
      <form method="get" action="/admin/workspaces" role="search" className="flex items-center gap-3">
        <Input name="q" defaultValue={q} placeholder={C.search} aria-label={C.search} className="max-w-md" />
        <button type="submit" className={buttonVariants({ variant: "secondary" })}>{C.searchButton}</button>
        {q && <Link href="/admin/workspaces" className={buttonVariants({ variant: "tertiary" })}>{C.clear}</Link>}
      </form>
      <Suspense key={q} fallback={<p className="text-ink-muted" aria-busy="true" data-testid="admin-loading">{C.loading}</p>}>
        <List proof={proof} q={q} />
      </Suspense>
    </main>
  );
}

async function List({ proof, q }: { proof: AdminProof; q: string }) {
  const rows = await workspaceDirectory(proof, { q });
  if (rows.length === 0) return <p className="card px-5 py-4 text-ink-muted" data-testid="workspaces-empty">{q ? C.noMatch(q) : C.none}</p>;
  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-sm" data-testid="workspaces-table">
        <thead>
          <tr className="text-left text-xs font-semibold text-ink-muted">
            <th className="px-4 py-2.5">{C.columns.name}</th>
            <th className="px-3 py-2.5">{C.columns.plan}</th>
            <th className="px-3 py-2.5">{C.columns.created}</th>
            <th className="px-3 py-2.5">{C.columns.owners}</th>
            <th className="px-3 py-2.5 text-right">{C.columns.members}</th>
            <th className="px-3 py-2.5 text-right">{C.columns.projects}</th>
            <th className="px-3 py-2.5 text-right">{C.columns.published}</th>
            <th className="px-3 py-2.5 text-right">{C.columns.responses}</th>
            <th className="px-3 py-2.5 text-right">{C.columns.cost}</th>
            <th className="px-3 py-2.5">{C.columns.last}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-hairline align-top" data-testid="workspace-row">
              <td className="px-4 py-2">
                <Link href={`/admin/workspaces/${r.id}`} className="font-semibold text-violet-text underline-offset-4 hover:underline">{r.name}</Link>
                <div className="font-mono text-xs text-ink-muted">{r.slug}</div>
                {r.deletedAt && <div className="text-xs text-danger">{C.deletedOn(DAY.format(r.deletedAt))}</div>}
              </td>
              <td className="px-3 py-2">{C.plans[r.plan]}</td>
              <td className="whitespace-nowrap px-3 py-2">{DAY.format(r.createdAt)}</td>
              <td className="px-3 py-2">{r.owners.map((o) => <div key={o}>{o}</div>)}</td>
              <td className="px-3 py-2 text-right font-mono">{r.members}</td>
              <td className="px-3 py-2 text-right font-mono">{r.projects}</td>
              <td className="px-3 py-2 text-right font-mono">{r.published}</td>
              <td className="px-3 py-2 text-right font-mono">{r.responsesThisMonth}</td>
              <td className="px-3 py-2 text-right font-mono">{formatEur(r.aiCostCentsThisMonth)}</td>
              <td className="whitespace-nowrap px-3 py-2">{DAY.format(r.lastActivity)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
