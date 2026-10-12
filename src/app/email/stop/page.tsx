// /email/stop?t=[TOKEN]&k=[KIND] (stories/E16-1, acceptance 5): the page the Stop these emails
// link of an email opens. One question and one button, so a mail client that opens links
// ahead of the reader stops nothing; the button's action stops the kind. A token not on file
// or a kind off the list is 404. Copy: src/lib/email-copy.ts.
import Link from "next/link";
import { notFound } from "next/navigation";
import { Lockup } from "@/components/brand/mark";
import { Button, buttonVariants } from "@/components/ui/button";
import { EMAIL_COPY as C } from "@/lib/email-copy";
import { stopTarget } from "@/lib/email-prefs";
import { stopEmailsAction } from "./actions";

const one = (v: string | string[] | undefined): string | undefined => (Array.isArray(v) ? v[0] : v);

export default async function StopPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const q = await searchParams;
  const t = one(q.t);
  const k = one(q.k);
  const target = await stopTarget(t, k);
  if (!target || !t) notFound();
  const done = one(q.done) === "1" || target.already;
  return (
    <main className="auth-frame">
      <Lockup />
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-medium tracking-tight">{done ? "Done." : C.stop.title(target.kind)}</h1>
        <p className="text-ink-muted" data-testid="stop-line">{done ? C.stop.done(target.kind) : C.stop.line(target.kind)}</p>
      </div>
      {done ? (
        <Link href="/app" className={buttonVariants({ variant: "secondary", className: "self-start" })}>{C.stop.toApp}</Link>
      ) : (
        <form action={stopEmailsAction} className="flex items-center gap-3">
          <input type="hidden" name="t" value={t} />
          <input type="hidden" name="k" value={target.kind} />
          <Button type="submit">{C.stop.button}</Button>
        </form>
      )}
    </main>
  );
}
