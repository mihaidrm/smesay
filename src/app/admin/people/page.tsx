// The People list (stories/E14-3, acceptance 1): every account with how it signs in, its
// workspaces with role, when it was made, the last sign-in and the open sessions; searched by
// email or name through the address (?q=). Respondents have no account and are not here. Empty,
// loading and error states: the lines below, the Suspense fallback, src/app/error.tsx. Copy:
// docs/copy/app.md, Admin people.
import Link from "next/link";
import { Suspense } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { peopleDirectory } from "@/db/queries/admin";
import type { AdminProof } from "@/db/types";
import { requireAdmin } from "@/lib/admin";
import { PEOPLE_ADMIN_COPY as C } from "@/lib/admin-copy";

export const dynamic = "force-dynamic";

const DAY = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

export default async function PeoplePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { proof } = await requireAdmin();
  const raw = (await searchParams).q;
  const q = ((Array.isArray(raw) ? raw[0] : raw) ?? "").trim().slice(0, 200);
  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-8 py-6" data-testid="admin-people-page">
      <div className="flex flex-col gap-1">
        <div className="text-[13px] text-ink-muted">{C.crumb}</div>
        <h1 className="text-[30px] font-extrabold leading-9 tracking-[-0.03em]">{C.listTitle}</h1>
        <p className="text-ink-muted">{C.listIntro}</p>
      </div>
      <form method="get" action="/admin/people" role="search" className="flex items-center gap-3">
        <Input name="q" defaultValue={q} placeholder={C.search} aria-label={C.search} className="max-w-md" />
        <button type="submit" className={buttonVariants({ variant: "secondary" })}>{C.searchButton}</button>
        {q && <Link href="/admin/people" className={buttonVariants({ variant: "tertiary" })}>{C.clear}</Link>}
      </form>
      <Suspense key={q} fallback={<p className="text-ink-muted" aria-busy="true" data-testid="admin-loading">{C.loading}</p>}>
        <List proof={proof} q={q} />
      </Suspense>
    </main>
  );
}

async function List({ proof, q }: { proof: AdminProof; q: string }) {
  const rows = await peopleDirectory(proof, { q });
  if (rows.length === 0) return <p className="card px-5 py-4 text-ink-muted" data-testid="people-empty">{q ? C.noMatch(q) : C.none}</p>;
  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-sm" data-testid="people-table">
        <thead>
          <tr className="text-left text-xs font-semibold text-ink-muted">
            <th className="px-4 py-2.5">{C.columns.email}</th>
            <th className="px-3 py-2.5">{C.columns.name}</th>
            <th className="px-3 py-2.5">{C.columns.verified}</th>
            <th className="px-3 py-2.5">{C.columns.methods}</th>
            <th className="px-3 py-2.5">{C.columns.workspaces}</th>
            <th className="px-3 py-2.5">{C.columns.created}</th>
            <th className="px-3 py-2.5">{C.columns.last}</th>
            <th className="px-3 py-2.5 text-right">{C.columns.sessions}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id} className="border-t border-hairline align-top" data-testid="person-row">
              <td className="px-4 py-2"><Link href={`/admin/people/${encodeURIComponent(p.id)}`} className="font-semibold text-violet-text underline-offset-4 hover:underline">{p.email}</Link></td>
              <td className="px-3 py-2">{p.name}</td>
              <td className="px-3 py-2">{p.emailVerified ? C.yes : C.no}</td>
              <td className="px-3 py-2">{p.methods.map((m) => C.methods[m]).join(", ")}</td>
              <td className="px-3 py-2">{p.workspaces.map((w) => <div key={w.id}>{w.name} ({C.roles[w.role]})</div>)}</td>
              <td className="whitespace-nowrap px-3 py-2">{DAY.format(p.createdAt)}</td>
              <td className="whitespace-nowrap px-3 py-2">{p.lastSignIn ? DAY.format(p.lastSignIn) : C.never}</td>
              <td className="px-3 py-2 text-right font-mono">{p.openSessions}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
