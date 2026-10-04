// Results (stories/E8-1; the PM app board, Results; design note 40): the include-unsubmitted
// switch at the top (decision 0030), Choose tiles, the one filter bar, "Showing [N] of [M]
// responses" while a filter is on, the headline tiles the PM chose, then the tabs Agreement,
// Different priority and Disagree (n), Questions and gaps (n), Responses, Actions (n), Export.
// Every number is one SQL query with the filter (src/db/queries/results.ts numbers). Before
// the first answer the page is the empty state; a filter that keeps no answer says so with
// Clear filters. The numbers and each tab fail on their own (results-boundary.tsx) and load
// with a skeleton (loading.tsx, skeletons.tsx). Each tab's content comes with its story
// (E8-2 to E8-6, E9-1, E10-1). The filter and the tab are in the URL. Copy: docs/copy/app.md
// and docs/copy/errors.md, Results.
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { cn } from "cn";
import { FadeOnChange } from "@/components/app/fade-on-change";
import { StatTile } from "@/components/app/tiles";
import { EmptyState } from "@/components/ui/banner";
import { buttonVariants } from "@/components/ui/button";
import { instruments, invites, projects } from "@/db/queries";
import type { Instrument } from "@/db/queries/instruments";
import { results, resultsPrefs } from "@/db/queries/results";
import { requireCurrentWorkspace } from "@/lib/current-workspace";
import { DETAIL_COPY, RESULTS_COPY } from "@/lib/results-copy";
import { itemParam } from "@/lib/results-detail";
import { describeFilter, filterActive, filterQuery, parseResultsFilter, RESULTS_KINDS, type FilterContext, type ResultsFilter, type SearchParams } from "@/lib/results-filter";
import { DEFAULT_TILES, storedTiles, tabCounts, tileView, type ResultsNumbers, type TileId } from "@/lib/results-tiles";
import { formatUtc, linkState } from "@/lib/sharing";
import { FilterBar } from "./filter-bar";
import { LiveUpdates } from "./live-updates";
import { ResultsBoundary } from "./results-boundary";
import { AgreementTab } from "./agreement-tab";
import type { AgreementView } from "./agreement-controls";
import { DetailPanel } from "./detail-panel";
import { ReturnFocus } from "./detail-shell";
import { PushedTab, QuestionsTab } from "./registers-tab";
import { ResponsesTab } from "./responses-tab";
import { PanelSkeleton } from "./skeletons";
import { ActionsTab } from "./actions-tab";
import { TileChooser } from "./tile-chooser";
import { UnsubmittedSwitch } from "./unsubmitted-switch";

const TABS = ["agreement", "pushed", "questions", "responses", "actions", "export"] as const;
type Tab = (typeof TABS)[number];
// The story each tab's content comes with.
type Later = Exclude<Tab, "responses" | "agreement" | "pushed" | "questions" | "actions">;
const TAB_STORY: Record<Later, string> = { export: "E10-1" };
const parseTab = (v: string | string[] | undefined): Tab => (typeof v === "string" && (TABS as readonly string[]).includes(v) ? (v as Tab) : "agreement");

export default async function ResultsPage({ params, searchParams }: { params: Promise<{ projectId: string }>; searchParams: Promise<SearchParams> }) {
  const { projectId } = await params;
  const query = await searchParams;
  const { session, current } = await requireCurrentWorkspace(`/app/projects/${projectId}/results`);
  const project = await projects.get(current.ws, projectId);
  if (!project) notFound();
  const instrument = await instruments.latestForProject(current.ws, project.id);
  const sample = project.isSample ? null : (await projects.list(current.ws)).find((p) => p.isSample) ?? null;
  if (!instrument) return <NoAnswers projectId={project.id} sampleId={sample?.id ?? null} link={RESULTS_COPY.link.notPublished} />;
  const prefs = await resultsPrefs.get(session.user.id, instrument.id);
  const stored = typeof prefs.includeUnsubmitted === "boolean" ? prefs.includeUnsubmitted : null;
  const ctx: FilterContext = { fields: instrument.respondentFields, perspectives: instrument.perspectives };
  const filter = parseResultsFilter(query, ctx, stored);
  const tab = parseTab(query.tab);
  // The URL always says which answers count (the switch), so a link copied from the address
  // bar reads the same for whoever opens it: a first open without it goes to the full URL
  // (redirect: node_modules/next/dist/docs/01-app/03-api-reference/04-functions/redirect.md).
  const item = itemParam(query.item);
  if (query.unsubmitted === undefined) redirect(`/app/projects/${project.id}/results?${filterQuery(filter, ctx, { ...(tab === "agreement" ? {} : { tab }), ...(item ? { item } : {}) })}`);
  // Live updates (E8-7) whenever the project has an instrument, whatever the state of its
  // links: a link that opens later, personal links after the public one is revoked. Not on the
  // sample, whose link collects nothing. Outside the boundary, so a failed read keeps the
  // stream and its banner.
  return (
    <>
    {!project.isSample && <LiveUpdates projectId={project.id} />}
    <ResultsBoundary what={RESULTS_COPY.strip}>
      <ResultsBody projectId={project.id} isSample={project.isSample} sampleId={sample?.id ?? null} instrument={instrument} ws={current.ws} filter={filter} ctx={ctx} tab={tab} item={item} tiles={storedTiles(prefs.tiles) ?? DEFAULT_TILES} view={prefs.view === "columns" || prefs.view === "share" ? prefs.view : "table"} />
    </ResultsBoundary>
    </>
  );
}

type BodyProps = { projectId: string; isSample: boolean; sampleId: string | null; instrument: Instrument; ws: Parameters<typeof results.numbers>[0]; filter: ResultsFilter; ctx: FilterContext; tab: Tab; item: string | null; tiles: TileId[]; view: AgreementView };

async function ResultsBody({ projectId, isSample, sampleId, instrument, ws, filter, ctx, tab, item, tiles, view }: BodyProps) {
  const n = await results.numbers(ws, instrument.id, filter);
  if (!n) notFound();
  if (!n.anyAnswer) return <NoAnswers projectId={projectId} sampleId={sampleId} link={await linkPhrase(ws, projectId)} />;
  const path = `/app/projects/${projectId}/results`;
  const href = (next: ResultsFilter, t: Tab, open: string | null = null) => { const q = filterQuery(next, ctx, { ...(t === "agreement" ? {} : { tab: t }), ...(open ? { item: open } : {}) }); return q ? `${path}?${q}` : path; };
  // An item's detail (E8-5), from the Agreement table and the registers; Close returns to the tab.
  const itemHref = (id: string) => href(filter, tab, id);
  // A value rated with no proposal shown is a kind of its own only where the instrument hides
  // the proposal (E5-2).
  const kinds = RESULTS_KINDS.filter((k) => k !== "pick" || !instrument.showProposed || n.pick > 0);
  const active = filterActive(filter);
  const cleared = { ...filter, fields: {}, kinds: [], withComment: false, perspective: null, status: [] };
  // Nobody kept (acceptance 4): the people a filter keeps without a counted answer (an invite
  // not opened, an answer not submitted with the switch off) still show, in the Responses tab.
  const none = active && n.invited === 0;
  return (
    <div className="flex flex-col gap-5" data-testid="results">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <UnsubmittedSwitch projectId={projectId} on={filter.includeUnsubmitted} />
        <TileChooser projectId={projectId} tiles={tiles} />
      </div>
      {!none && <Strip n={n} tiles={tiles} />}
      {/* The filter bar and the line under the strip (acceptance 3). */}
      <FilterBar filter={filter} ctx={ctx} tab={tab === "agreement" ? null : tab} item={item} kinds={kinds} />
      <p role="status" className={cn("text-sm text-ink-muted", !active && "sr-only")} data-testid={active ? "showing-line" : undefined}>{active ? RESULTS_COPY.showing(n.shown, n.total, describeFilter(filter, ctx)) : ""}</p>
      {none ? (
        <EmptyState title={RESULTS_COPY.noMatch} className="py-8">
          <Link href={href(cleared, tab, item)} className={cn(buttonVariants({ variant: "secondary", size: "small" }), "mt-2")} data-testid="no-match-clear">{RESULTS_COPY.clearFilters}</Link>
        </EmptyState>
      ) : item ? (
        // An item's detail (E8-5) in place of the tabs, as the PM app board draws it; Back
        // returns to the tab.
        <ResultsBoundary key={`detail:${item}`} what={RESULTS_COPY.detail} back={{ href: href(filter, tab), label: DETAIL_COPY.back(RESULTS_COPY.tabs[tab]) }}>
          <Suspense fallback={<PanelSkeleton />}>
            <DetailPanel ws={ws} instrument={instrument} itemId={item} filter={filter} closeHref={href(filter, tab)} backLabel={DETAIL_COPY.back(RESULTS_COPY.tabs[tab])} />
          </Suspense>
        </ResultsBoundary>
      ) : (
        <>
          <TabRow n={n} tab={tab} href={(t) => href(filter, t)} />
          {/* catchError clears its error only on a new pathname, so each tab gets a boundary
              of its own (node_modules/next/dist/client/components/catch-error.js); the page's
              own boundary is not keyed, so a filter change keeps the focus and the status
              line, and a failed page clears with Try again. */}
          {/* The tab panel's heading, for the outline under the project's h1. */}
          <h2 className="sr-only">{tabName(tab, n)}</h2>
          <ResultsBoundary key={tab} what={tabName(tab, n)}>
            <Suspense fallback={<PanelSkeleton />}>
              <TabPanel tab={tab} n={n} ws={ws} projectId={projectId} isSample={isSample} instrument={instrument} filter={filter} ctx={ctx} view={view} href={(f) => href(f, tab)} itemHref={itemHref} />
              <ReturnFocus />
            </Suspense>
          </ResultsBoundary>
        </>
      )}
    </div>
  );
}

function Strip({ n, tiles }: { n: ResultsNumbers; tiles: TileId[] }) {
  return (
    <div className="grid grid-cols-2 gap-3.5 md:grid-cols-3 xl:grid-cols-6" data-testid="results-strip">
      {tiles.map((id) => { const t = tileView(id, n); return <FadeOnChange key={id} value={`${t.value} ${t.label}`} className="flex rounded-2xl"><span data-tile={id} className="flex flex-1"><StatTile value={t.value} label={t.label} tone={t.tone} /></span></FadeOnChange>; })}
    </div>
  );
}

function tabName(tab: Tab, n: ResultsNumbers): string {
  const c = tabCounts(n);
  const count: Partial<Record<Tab, number>> = { pushed: c.pushed, questions: c.questions, actions: c.actions };
  return count[tab] === undefined ? RESULTS_COPY.tabs[tab] : `${RESULTS_COPY.tabs[tab]} (${count[tab]})`;
}

function TabRow({ n, tab, href }: { n: ResultsNumbers; tab: Tab; href: (t: Tab) => string }) {
  return (
    <nav aria-label={RESULTS_COPY.tabsLabel} className="flex flex-wrap gap-x-6 gap-y-1 border-b border-hairline" data-testid="results-tabs">
      {TABS.map((t) => (
        <Link key={t} href={href(t)} scroll={false} aria-current={t === tab ? "page" : undefined}
          className="relative -mb-px flex h-10 items-center text-sm font-semibold text-ink-muted outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-ground aria-[current=page]:text-ink aria-[current=page]:after:absolute aria-[current=page]:after:inset-x-0 aria-[current=page]:after:bottom-0 aria-[current=page]:after:h-0.5 aria-[current=page]:after:bg-violet aria-[current=page]:after:content-['']"
          data-testid={`tab-${t}`}>
          {tabName(t, n)}
        </Link>
      ))}
    </nav>
  );
}

// Each tab's content comes with its story; until then the tab says which.
async function TabPanel({ tab, ws, projectId, isSample, instrument, filter, ctx, view, href, itemHref }: { tab: Tab; n: ResultsNumbers; ws: BodyProps["ws"]; projectId: string; isSample: boolean; instrument: Instrument; filter: ResultsFilter; ctx: FilterContext; view: AgreementView; href: (f: ResultsFilter) => string; itemHref: (id: string) => string }) {
  if (tab === "responses") return <ResponsesTab ws={ws} instrumentId={instrument.id} filter={filter} ctx={ctx} href={href} />;
  if (tab === "pushed") return <PushedTab ws={ws} instrument={instrument} filter={filter} ctx={ctx} href={href} itemHref={itemHref} />;
  if (tab === "questions") return <QuestionsTab ws={ws} instrument={instrument} filter={filter} ctx={ctx} href={href} itemHref={itemHref} />;
  if (tab === "actions") return <ActionsTab ws={ws} projectId={projectId} sample={isSample} itemHref={itemHref} />;
  if (tab === "agreement") return <AgreementTab ws={ws} projectId={projectId} instrument={instrument} filter={filter} ctx={ctx} view={view} itemHref={itemHref} />;
  return <p className="rounded-2xl border border-dashed border-hairline-strong bg-surface px-5 py-6 text-sm text-ink-muted" data-testid="tab-panel">{RESULTS_COPY.comesWith(RESULTS_COPY.tabs[tab], TAB_STORY[tab as Later])}</p>;
}

async function linkPhrase(ws: BodyProps["ws"], projectId: string): Promise<string> {
  const link = await invites.livePublic(ws, projectId);
  const state = linkState(link);
  if (!link || state === "draft") return RESULTS_COPY.link.notPublished;
  if (state === "revoked") return RESULTS_COPY.link.revoked;
  if (state === "closed") return RESULTS_COPY.link.closed;
  if (state === "notOpen") return RESULTS_COPY.link.notOpen(formatUtc(link.opensAt!));
  return link.closesAt ? RESULTS_COPY.link.openUntil(formatUtc(link.closesAt)) : RESULTS_COPY.link.open;
}

function NoAnswers({ projectId, sampleId, link }: { projectId: string; sampleId: string | null; link: string }) {
  return (
    <EmptyState title={RESULTS_COPY.noAnswersTitle} mascot="analysis">
      <span data-testid="no-answers">{sampleId ? RESULTS_COPY.noAnswers(link) : RESULTS_COPY.noAnswersNoSample(link)}</span>
      <span className="mt-3 flex justify-center gap-2">
        <Link href={`/app/projects/${projectId}/share`} className={buttonVariants({ size: "small" })}>{RESULTS_COPY.shareIt}</Link>
        {sampleId && <Link href={`/app/projects/${sampleId}/results`} className={buttonVariants({ variant: "secondary", size: "small" })}>{RESULTS_COPY.openSample}</Link>}
      </span>
    </EmptyState>
  );
}
