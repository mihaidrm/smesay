// The audit log (stories/E14-1, acceptance 4): every admin action, newest first, 50 a page,
// with the admin's email, the action, the target's name ("deleted" when it is gone) and the
// time; filtered by workspace and by admin through the address (?workspace=, ?admin=, ?page=),
// so a filtered page can be linked. The reads are src/db/queries/admin.ts auditLog and
// auditFilters. Empty, loading and error states (CLAUDE.md, PM side): the empty line below,
// the Suspense fallback, and src/app/error.tsx. Copy: docs/copy/app.md, Admin audit log.
import Link from "next/link";
import { Suspense } from "react";
import { buttonVariants } from "@/components/ui/button";
import { AUDIT_PAGE, auditFilters, auditLog } from "@/db/queries/admin";
import type { AdminProof } from "@/db/types";
import { requireAdmin } from "@/lib/admin";
import { AUDIT_COPY as C, auditChanges } from "@/lib/admin-copy";

export const dynamic = "force-dynamic";

// A native select in a GET form, so the filter works before any script loads; the field look of
// the respondent selects (design note 85).
const SELECT = "h-10 min-w-56 rounded-xl border border-hairline-strong bg-surface px-3 text-sm font-normal text-ink outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-ground";
const TIME = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC" });

type Search = { page?: string; workspace?: string; admin?: string };
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;

export default async function AuditPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { proof } = await requireAdmin();
  const q = await searchParams;
  const search: Search = { page: one(q.page), workspace: one(q.workspace), admin: one(q.admin) };
  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-8 py-6" data-testid="admin-audit">
      <div className="flex flex-col gap-1">
        <div className="text-[13px] text-ink-muted">{C.crumb}</div>
        <h1 className="text-[30px] font-extrabold leading-9 tracking-[-0.03em]">{C.title}</h1>
        <p className="text-ink-muted">{C.intro}</p>
      </div>
      <Suspense key={JSON.stringify(search)} fallback={<p className="text-ink-muted" aria-busy="true" data-testid="admin-loading">{C.loading}</p>}>
        <Log proof={proof} search={search} />
      </Suspense>
    </main>
  );
}

async function Log({ proof, search }: { proof: AdminProof; search: Search }) {
  const asked = Number.parseInt(search.page ?? "1", 10) || 1;
  const [{ rows, total, page }, filters] = await Promise.all([auditLog(proof, { page: asked, workspaceId: search.workspace, adminUserId: search.admin }), auditFilters(proof)]);
  const pages = Math.max(1, Math.ceil(total / AUDIT_PAGE));
  const href = (p: number) => `/admin/audit?${new URLSearchParams({ ...(search.workspace ? { workspace: search.workspace } : {}), ...(search.admin ? { admin: search.admin } : {}), page: String(p) })}`;
  const filtered = Boolean(search.workspace || search.admin);
  return (
    <>
      <form method="get" action="/admin/audit" className="flex flex-wrap items-end gap-3" data-testid="audit-filters">
        <label className="flex flex-col gap-1 text-[13px] font-semibold text-ink-muted">
          {C.workspace}
          <select name="workspace" defaultValue={search.workspace ?? ""} className={SELECT}>
            <option value="">{C.all}</option>
            {filters.workspaces.map((w) => <option key={w.id} value={w.id}>{w.name ?? C.gone(w.id)}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[13px] font-semibold text-ink-muted">
          {C.admin}
          <select name="admin" defaultValue={search.admin ?? ""} className={SELECT}>
            <option value="">{C.all}</option>
            {filters.admins.map((a) => <option key={a.id} value={a.id}>{a.email ?? C.gone(a.id)}</option>)}
          </select>
        </label>
        <button type="submit" className={buttonVariants({ variant: "secondary" })}>{C.apply}</button>
        {filtered && <Link href="/admin/audit" className={buttonVariants({ variant: "tertiary" })}>{C.clear}</Link>}
      </form>
      {rows.length === 0 ? (
        <p className="card px-5 py-4 text-ink-muted" data-testid="audit-empty">{filtered ? C.noneFiltered : C.none}</p>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm" data-testid="audit-table">
            <thead>
              <tr className="text-left text-xs font-semibold text-ink-muted">
                <th className="px-4 py-2.5">{C.columns.time}</th>
                <th className="px-3 py-2.5">{C.columns.admin}</th>
                <th className="px-3 py-2.5">{C.columns.action}</th>
                <th className="px-3 py-2.5">{C.columns.outcome}</th>
                <th className="px-3 py-2.5">{C.columns.target}</th>
                <th className="px-3 py-2.5">{C.columns.changes}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-hairline align-top" data-testid="audit-row">
                  <td className="whitespace-nowrap px-4 py-2">{TIME.format(r.createdAt)}</td>
                  <td className="px-3 py-2">{r.adminEmail ?? C.deleted}</td>
                  <td className="px-3 py-2 font-semibold">{C.actions[r.action]}</td>
                  <td className="px-3 py-2" data-testid="audit-outcome">{C.outcomes[r.outcome ?? "none"]}</td>
                  <td className="px-3 py-2">
                    {r.targetWorkspaceId && <div>{r.targetWorkspaceName === null ? C.deleted : r.targetWorkspaceDeleted ? C.markedDeleted(r.targetWorkspaceName) : r.targetWorkspaceName}</div>}
                    {r.targetUserId && <div className="text-ink-muted">{r.targetUserEmail ?? C.deleted}</div>}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-ink-muted">{auditChanges(r.changes)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="flex items-center gap-3 text-sm text-ink-muted" data-testid="audit-pages">
        <span>{C.pageOf(page, pages, total)}</span>
        {page > 1 && <Link href={href(page - 1)} className={buttonVariants({ variant: "secondary", size: "small" })}>{C.newer}</Link>}
        {page < pages && <Link href={href(page + 1)} className={buttonVariants({ variant: "secondary", size: "small" })}>{C.older}</Link>}
      </div>
    </>
  );
}
