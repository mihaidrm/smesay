// A person's admin page (stories/E14-3, acceptance 2): the account with its sign-in methods,
// the workspaces with role (each with Remove), the sessions with start, expiry and the browser
// and system family (never the token, the address or the raw user agent, acceptance 4), the
// invitations waiting for the email, the last 20 product events (respondent events carry no
// user, so none show), and the actions behind a confirm line (./actions.ts). Copy:
// docs/copy/app.md, Admin person page.
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { adminPerson, invitesFor, personEvents, personSessions, type AdminPerson } from "@/db/queries/admin";
import type { AdminProof } from "@/db/types";
import { userAgentFamily } from "@/lib/accounts";
import { requireAdmin } from "@/lib/admin";
import { PEOPLE_ADMIN_COPY as C } from "@/lib/admin-copy";
import { INVITE_VALID_MINUTES } from "@/lib/invites";
import { ConfirmForm } from "../../confirm-form";
import { deleteAccountAction, removeAction, sendLinkAction, signOutAction } from "./actions";

export const dynamic = "force-dynamic";

const DAY = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const TIME = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
const TH = "px-3 py-2 text-left text-xs font-semibold text-ink-muted";
const TD = "border-t border-hairline px-3 py-2 align-top";

export default async function PersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { proof } = await requireAdmin();
  const person = await adminPerson(proof, decodeURIComponent((await params).id));
  if (!person) notFound();
  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-8 py-6" data-testid="admin-person">
      <div className="flex flex-col gap-1">
        <Link href="/admin/people" className="self-start text-[13px] text-violet-text underline-offset-4 hover:underline">{C.back}</Link>
        <h1 className="text-[30px] font-extrabold leading-9 tracking-[-0.03em]">{person.email}</h1>
      </div>
      <Suspense fallback={<p className="text-ink-muted" aria-busy="true" data-testid="admin-loading">{C.loading}</p>}>
        <Detail proof={proof} person={person} />
      </Suspense>
    </main>
  );
}

function Section({ title, children, testId }: { title: string; children: React.ReactNode; testId: string }) {
  return (
    <section className="card flex flex-col gap-3 px-5 py-4" data-testid={testId}>
      <h2 className="text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}

async function Detail({ proof, person }: { proof: AdminProof; person: AdminPerson }) {
  const [sessions, invites, events] = await Promise.all([personSessions(proof, person.id), invitesFor(proof, person.email, INVITE_VALID_MINUTES), personEvents(proof, person.id, 20)]);
  const hidden = { userId: person.id };
  return (
    <>
      <Section title={C.sections.account} testId="admin-account">
        <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-1 text-sm">
          <dt className="text-ink-muted">{C.columns.name}</dt><dd>{person.name}</dd>
          <dt className="text-ink-muted">{C.columns.verified}</dt><dd>{person.emailVerified ? C.yes : C.no}</dd>
          <dt className="text-ink-muted">{C.columns.methods}</dt><dd>{person.methods.map((m) => C.methods[m]).join(", ")}</dd>
          <dt className="text-ink-muted">{C.columns.created}</dt><dd>{DAY.format(person.createdAt)}</dd>
          <dt className="text-ink-muted">{C.columns.last}</dt><dd>{person.lastSignIn ? TIME.format(person.lastSignIn) : C.never}</dd>
        </dl>
        <div className="flex flex-wrap gap-6">
          <ConfirmForm action={sendLinkAction} hidden={hidden} label={C.sendLink} confirmLine={C.confirmSendLink(person.email)} testId="send-link-form" />
          <ConfirmForm action={signOutAction} hidden={hidden} label={C.signOut} confirmLine={C.confirmSignOut(person.email)} testId="sign-out-form" />
        </div>
      </Section>
      <Section title={C.sections.workspaces} testId="admin-person-workspaces">
        {person.workspaces.length === 0 ? <p className="text-sm text-ink-muted">{C.noWorkspaces}</p> : (
          <ul className="flex flex-col gap-2 text-sm">{person.workspaces.map((w) => (
            <li key={w.id} className="flex flex-wrap items-center gap-4">
              <Link href={`/admin/workspaces/${w.id}`} className="font-semibold text-violet-text underline-offset-4 hover:underline">{w.name}</Link>
              <span className="text-ink-muted">{C.roles[w.role]}</span>
              <ConfirmForm action={removeAction} hidden={{ ...hidden, workspaceId: w.id }} label={C.remove} confirmLine={C.confirmRemove(person.email, w.name)} variant="destructive" testId="remove-form" />
            </li>
          ))}</ul>
        )}
      </Section>
      <Section title={C.sections.sessions} testId="admin-sessions">
        {sessions.length === 0 ? <p className="text-sm text-ink-muted">{C.noSessions}</p> : (
          <table className="w-full text-sm">
            <thead><tr><th className={TH}>{C.sessionColumns.started}</th><th className={TH}>{C.sessionColumns.expires}</th><th className={TH}>{C.sessionColumns.browser}</th><th className={TH}>{C.sessionColumns.state}</th></tr></thead>
            <tbody>{sessions.map((s) => {
              const ua = userAgentFamily(s.userAgent);
              return (
                <tr key={s.id} data-testid="admin-session">
                  <td className={TD}>{TIME.format(s.createdAt)}</td><td className={TD}>{TIME.format(s.expiresAt)}</td>
                  <td className={TD}>{ua.browser} on {ua.os}</td><td className={TD}>{s.open ? C.sessionOpen : C.sessionExpired}</td>
                </tr>
              );
            })}</tbody>
          </table>
        )}
      </Section>
      <Section title={C.sections.invites} testId="admin-person-invites">
        {invites.length === 0 ? <p className="text-sm text-ink-muted">{C.noInvites}</p> : (
          <ul className="flex flex-col gap-1 text-sm">{invites.map((i) => <li key={i.id}>{C.inviteLine(i.workspaceName, TIME.format(i.invitedAt), i.open)}</li>)}</ul>
        )}
      </Section>
      <Section title={C.sections.events} testId="admin-person-events">
        {events.length === 0 ? <p className="text-sm text-ink-muted">{C.noEvents}</p> : (
          <ul className="flex flex-col gap-1 font-mono text-xs">{events.map((e, k) => <li key={k}>{TIME.format(e.createdAt)} {e.name}{e.workspaceName ? ` (${e.workspaceName})` : ""} {Object.entries(e.properties).map(([a, b]) => `${a}=${b}`).join(" ")}</li>)}</ul>
        )}
      </Section>
      <Section title={C.sections.danger} testId="admin-delete">
        <p className="text-sm text-ink-muted">{C.deleteLine}</p>
        <ConfirmForm action={deleteAccountAction} hidden={hidden} label={C.deleteAccount} confirmLine={C.confirmDelete(person.email)} variant="destructive" testId="delete-form" />
      </Section>
    </>
  );
}
