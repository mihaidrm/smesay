// The legal pages (stories/E11-3): /legal/privacy, /legal/terms, /legal/dpa and
// /legal/subprocessors, each rendered from its file in docs/legal/ (src/lib/legal.ts) with
// "Version [N], [DATE]" at the top and any marker left shown in the sun tint (acceptance 4; since
// the lawyer's approval, decision 0059, only the company details are marked). generateStaticParams with dynamicParams false: any
// other name is the 404 page (node_modules/next/dist/docs/01-app/03-api-reference/04-functions/
// generate-static-params.md). Rendered per request since E11-5, for the content security
// policy's nonce (src/app/layout.tsx); the files travel with the route (next.config.ts,
// outputFileTracingIncludes). Every page links to the other three.
import type { Metadata } from "next";
import Link from "next/link";
import { Lockup } from "@/components/brand/mark";
import { notFound } from "next/navigation";
import { PlausibleScript } from "@/components/analytics/plausible-script";
import { LEGAL_PAGES, LEGAL_TITLES, readLegal, type Inline, type LegalPage } from "@/lib/legal";

// Rendered per request, dynamicParams false does not stop an unknown name reaching the page
// (CI on E11-5: /legal/cookies read docs/legal/cookies.md and answered 500), so the page checks
// the name against the four itself and answers 404.
const known = (page: string): page is LegalPage => (LEGAL_PAGES as readonly string[]).includes(page);

export const dynamicParams = false;
export function generateStaticParams() {
  return LEGAL_PAGES.map((page) => ({ page }));
}

export async function generateMetadata({ params }: { params: Promise<{ page: string }> }): Promise<Metadata> {
  const { page } = await params;
  return known(page) ? { title: `${LEGAL_TITLES[page]} · SMEsay` } : {};
}

const DATE = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

function Parts({ parts }: { parts: Inline[] }) {
  return parts.map((p, i) =>
    p.kind === "marker" ? <mark key={i} className="rounded bg-sun-soft px-1 text-sun-text" data-testid="lawyer-marker">{p.text}</mark>
    : p.kind === "link" ? <a key={i} href={p.href} className="text-violet-text underline underline-offset-4">{p.text}</a>
    : <span key={i}>{p.text}</span>);
}

export default async function LegalPageView({ params }: { params: Promise<{ page: string }> }) {
  const { page } = await params;
  if (!known(page)) notFound();
  const doc = readLegal(page);
  return (
    <main className="mx-auto flex min-h-screen max-w-[760px] flex-col gap-6 bg-ground px-4 py-10 text-ink md:px-8">
      <PlausibleScript />
      <Link href="/" aria-label="SMEsay home"><Lockup /></Link>
      <p className="text-sm text-ink-muted" data-testid="legal-version">Version {doc.version}, {DATE.format(new Date(`${doc.date}T00:00:00Z`))}</p>
      <article className="flex flex-col gap-4 leading-7">
        {doc.blocks.map((b, i) =>
          b.kind === "h1" ? <h1 key={i} className="text-[30px] font-extrabold leading-9 tracking-[-0.03em]"><Parts parts={b.parts} /></h1>
          : b.kind === "h2" ? <h2 key={i} className="mt-4 text-xl font-bold"><Parts parts={b.parts} /></h2>
          : b.kind === "ul" ? <ul key={i} className="flex list-disc flex-col gap-2 pl-6">{b.items.map((item, j) => <li key={j}><Parts parts={item} /></li>)}</ul>
          : <p key={i}><Parts parts={b.parts} /></p>)}
      </article>
      <nav aria-label="Legal pages" className="mt-auto flex flex-wrap gap-x-4 gap-y-2 border-t border-hairline pt-4 text-sm">
        {LEGAL_PAGES.map((p) => <Link key={p} href={`/legal/${p}`} aria-current={p === page ? "page" : undefined} className="text-ink-muted underline-offset-4 hover:underline">{LEGAL_TITLES[p]}</Link>)}
      </nav>
    </main>
  );
}
