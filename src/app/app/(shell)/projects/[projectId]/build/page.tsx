// Build (stories/E5-1 and E5-2; the PM app board, Build): the title and the version line,
// "Build on version N" when a newer set exists (owed from E3-6), the Intro card, the Scoring
// card (method, show proposed, labels, locked once published; the layout, E5-3), the
// Perspectives card (E5-4; items are tagged on Shape), the Closing card (E5-5) and the Respondent fields card, and on the right the preview panel showing the About you page,
// the items in the chosen layout or the Wrap up as the draft stands (the panel's shell from design note
// 13; E5-6 fills it in). Without a set the page
// points to Import. The sample is read-only (stories/E8-8): its intro and fields are listed,
// not edited. Copy: docs/copy/app.md (Build).
import Link from "next/link";
import { notFound } from "next/navigation";
import { items, projects } from "@/db/queries";
import { effectiveAccent } from "@/lib/brand-rules";
import { requireCurrentWorkspace } from "@/lib/current-workspace";
import { PREVIEW_CARDS } from "@/lib/build-copy";
import { CLOSING_COPY, signOffFor } from "@/lib/closing";
import { BUILD_COPY, isPublished, openDraft } from "@/lib/instruments";
import { textFor } from "@/lib/item-text";
import { fieldSummary } from "@/lib/respondent-fields";
import { labelFor, LAYOUTS_META, METHODS, proposedCode, scaleFor } from "@/lib/scoring";
import { areaNames, groupByArea } from "@/lib/shaping";
import { BuildOn } from "./build-on";
import { ClosingForm } from "./closing-form";
import { PreviewScreenProvider } from "./preview-screen";
import { FieldsForm } from "./fields-form";
import { IntroForm } from "./intro-form";
import { PerspectivesForm } from "./perspectives-form";
import { PreviewPanel } from "./preview-panel";
import { ScoringForm } from "./scoring-form";

// The page sends the cards that can be among the first PREVIEW_CARDS a respondent sees
// whatever they pick: the first ten untagged items and the first ten carrying each name (at
// most 110 cards for ten names); the panel draws the first ten visible from them (stories/E5-4).

export default async function BuildPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const { current } = await requireCurrentWorkspace(`/app/projects/${projectId}/build`);
  const project = await projects.get(current.ws, projectId);
  if (!project) notFound();
  const draft = await openDraft(current.ws, project);
  if (!draft) {
    return (
      <div className="flex flex-col gap-5">
        <h2 className="text-xl font-bold tracking-[-0.02em]">{BUILD_COPY.title}</h2>
        <div className="flex flex-col items-start gap-2 rounded-2xl border border-dashed border-hairline-strong bg-surface p-6" data-testid="build-empty">
          <div className="font-semibold">{BUILD_COPY.noSet}</div>
          <Link href={`/app/projects/${project.id}/import`} className="text-sm underline underline-offset-4">{BUILD_COPY.noSetLink}</Link>
        </div>
      </div>
    );
  }
  const { instrument, builtOn, newer } = draft;
  const rows = await items.forSet(current.ws, builtOn.id);
  const readOnly = project.isSample;
  const locked = readOnly || (await isPublished(current.ws, instrument.id));
  const accent = effectiveAccent(current.workspace.accentHex);
  // The first chapter's cards for the preview (stories/E5-2): the reader text when accepted,
  // the details from the first custom column or the original text, the proposed value as
  // a code of the method (null when the import's word is not one of the scale's).
  const toCard = (it: (typeof rows)[number]) => {
    const custom = it.custom && typeof it.custom === "object" ? Object.values(it.custom as Record<string, string>).find((v) => typeof v === "string" && v.trim()) : undefined;
    const title = textFor(it);
    return { reference: it.sourceRef, title, details: custom ?? (title !== it.originalText ? it.originalText : null), method: instrument.method, labels: instrument.scaleLabels, proposed: proposedCode(instrument.method, it.proposedValue), showProposed: instrument.showProposed, accent, perspectives: it.perspectives };
  };
  const tagged = rows.filter((it) => it.perspectives.length > 0).length;
  // Every area in the list's order, then the items with no area under the Shape page's
  // name for them (groupByArea; one unnamed chapter when the set has no areas), so the page
  // layout's count matches what is drawn. Each chapter carries every row's tags and the
  // cards of its candidate rows, by position in the chapter.
  const grouped: { name: string | null; rows: typeof rows }[] = areaNames(builtOn, rows).length ? groupByArea(builtOn, rows).map((g) => ({ name: g.name, rows: g.items })) : [{ name: null, rows }];
  const left = new Map<string, number>([["", PREVIEW_CARDS], ...instrument.perspectives.map((n): [string, number] => [n, PREVIEW_CARDS])]);
  const candidate = (it: (typeof rows)[number]) => {
    const classes = it.perspectives.length === 0 ? [""] : it.perspectives;
    let keep = false;
    for (const c of classes) { const n = left.get(c) ?? 0; if (n > 0) { left.set(c, n - 1); keep = true; } }
    return keep;
  };
  const chapters = grouped.map((c) => ({
    name: c.name,
    tags: c.rows.map((it) => it.perspectives),
    cards: c.rows.flatMap((it, index) => (candidate(it) ? [{ index, card: toCard(it) }] : [])),
  }));
  const methodLabel = METHODS.find((m) => m.key === instrument.method)?.label ?? instrument.method;
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold tracking-[-0.02em]">{BUILD_COPY.title}</h2>
        <p className="text-ink-muted" data-testid="build-line">{BUILD_COPY.line(builtOn.version)}</p>
      </div>
      <PreviewScreenProvider key={instrument.id}>
      <div className="flex items-start gap-6">
        <div className="flex min-w-0 grow flex-col gap-5">
          {newer && !readOnly && <BuildOn key={instrument.id} projectId={project.id} instrumentId={instrument.id} built={builtOn.version} latest={newer.version} />}
          <section className="card flex flex-col gap-3" aria-labelledby="build-intro-title">
            <h3 id="build-intro-title" className="text-[15px] font-bold">{BUILD_COPY.introCard}</h3>
            {readOnly ? (
              <div className="flex flex-col gap-2 text-sm">
                <div><span className="text-ink-muted">{BUILD_COPY.titleLabel}: </span>{instrument.title}</div>
                <div><span className="text-ink-muted">{BUILD_COPY.introLabel}: </span>{instrument.intro}</div>
                <p className="text-[13px] text-ink-muted">{BUILD_COPY.sample}</p>
              </div>
            ) : (
              <IntroForm key={instrument.id} projectId={project.id} instrumentId={instrument.id} title={instrument.title} intro={instrument.intro ?? ""} />
            )}
          </section>
          <section className="card flex flex-col gap-3" aria-labelledby="build-scoring-title">
            <div className="flex flex-col gap-0.5">
              <h3 id="build-scoring-title" className="text-[15px] font-bold">{BUILD_COPY.scoringCard}</h3>
              <p className="text-[13px] text-ink-muted">{BUILD_COPY.scoringLine}</p>
            </div>
            {readOnly ? (
              <ul className="flex flex-col text-sm" data-testid="scoring-list">
                <li className="flex justify-between gap-4 py-2.5"><span>{BUILD_COPY.methodLabel}</span><span className="text-ink-muted">{methodLabel}: {scaleFor(instrument.method, instrument.scaleLabels).map((v) => v.label).join(", ")}, {labelFor(instrument.method, null, "unclear")}</span></li>
                <li className="flex justify-between gap-4 border-t border-hairline py-2.5"><span>{BUILD_COPY.showProposedTitle}</span><span className="text-ink-muted">{instrument.showProposed ? BUILD_COPY.on : BUILD_COPY.off}</span></li>
                <li className="flex justify-between gap-4 border-t border-hairline py-2.5"><span>{BUILD_COPY.layoutLabel}</span><span className="text-ink-muted">{LAYOUTS_META.find((l) => l.key === instrument.layout)?.label ?? instrument.layout}</span></li>
                <li className="py-2.5 text-[13px] text-ink-muted">{BUILD_COPY.sample}</li>
              </ul>
            ) : (
              <ScoringForm key={instrument.id} projectId={project.id} instrumentId={instrument.id} method={instrument.method} showProposed={instrument.showProposed} labels={instrument.scaleLabels} layout={instrument.layout} locked={locked} />
            )}
          </section>
          <section className="card flex flex-col gap-3" aria-labelledby="build-perspectives-title">
            <div className="flex flex-col gap-0.5">
              <h3 id="build-perspectives-title" className="text-[15px] font-bold">{BUILD_COPY.perspectivesCard}</h3>
              <p className="text-[13px] text-ink-muted">{BUILD_COPY.perspectivesLine}</p>
            </div>
            {readOnly ? (
              <p className="text-sm text-ink-muted" data-testid="perspectives-list">{instrument.perspectives.length === 0 ? BUILD_COPY.perspectivesNone : BUILD_COPY.perspectivesList(instrument.perspectives)} {BUILD_COPY.sample}</p>
            ) : (
              <PerspectivesForm key={instrument.id} projectId={project.id} instrumentId={instrument.id} names={instrument.perspectives} tagged={tagged} total={rows.length} locked={locked} />
            )}
          </section>
          <section className="card flex flex-col gap-3" aria-labelledby="build-closing-title">
            <div className="flex flex-col gap-0.5">
              <h3 id="build-closing-title" className="text-[15px] font-bold">{CLOSING_COPY.card}</h3>
              <p className="text-[13px] text-ink-muted">{CLOSING_COPY.line}</p>
            </div>
            {readOnly ? (
              <ul className="flex flex-col text-sm" data-testid="closing-list">
                <li className="flex justify-between gap-4 py-2.5"><span>{CLOSING_COPY.questionLabel}</span><span className="text-ink-muted">{instrument.closing.closingQuestion ?? BUILD_COPY.off}</span></li>
                <li className="flex justify-between gap-4 border-t border-hairline py-2.5"><span>{CLOSING_COPY.missingTitle}</span><span className="text-ink-muted">{instrument.closing.missingForm ? BUILD_COPY.on : BUILD_COPY.off}</span></li>
                <li className="flex justify-between gap-4 border-t border-hairline py-2.5"><span>{CLOSING_COPY.confidenceTitle}</span><span className="text-ink-muted">{CLOSING_COPY.always}</span></li>
                <li className="flex justify-between gap-4 border-t border-hairline py-2.5"><span>{CLOSING_COPY.signOffLabel}</span><span className="text-right text-ink-muted">{signOffFor(instrument.closing)}</span></li>
                <li className="py-2.5 text-[13px] text-ink-muted">{BUILD_COPY.sample}</li>
              </ul>
            ) : (
              <ClosingForm key={instrument.id} projectId={project.id} instrumentId={instrument.id} closing={instrument.closing} locked={locked} />
            )}
          </section>
          <section className="card flex flex-col gap-3" aria-labelledby="build-fields-title">
            <div className="flex flex-col gap-0.5">
              <h3 id="build-fields-title" className="text-[15px] font-bold">{BUILD_COPY.fieldsCard}</h3>
              <p className="text-[13px] text-ink-muted">{BUILD_COPY.fieldsLine}</p>
            </div>
            {readOnly ? (
              <ul className="flex flex-col text-sm" data-testid="fields-list">
                {instrument.respondentFields.map((f) => (
                  <li key={f.key} className="flex justify-between gap-4 border-t border-hairline py-2.5 first:border-t-0"><span>{f.label}</span><span className="text-ink-muted">{fieldSummary(f)}</span></li>
                ))}
              </ul>
            ) : (
              <FieldsForm key={instrument.id} projectId={project.id} instrumentId={instrument.id} fields={instrument.respondentFields} />
            )}
          </section>
        </div>
        <PreviewPanel
          key={instrument.id}
          about={{ workspaceName: current.workspace.name, accent, title: instrument.title, intro: instrument.intro, fields: instrument.respondentFields }}
          chapters={chapters}
          layout={instrument.layout}
          perspectives={instrument.perspectives}
          wrap={{ closing: instrument.closing, method: instrument.method, labels: instrument.scaleLabels, showProposed: instrument.showProposed }}
        />
      </div>
      </PreviewScreenProvider>
    </div>
  );
}
