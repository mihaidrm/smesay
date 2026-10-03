// Build (stories/E5-1 and E5-2; the PM app board, Build): the title and the version line,
// "Build on version N" when a newer set exists (owed from E3-6), the Intro card, the Scoring
// card (method, show proposed, labels; locked once published) and the Respondent fields
// card, and on the right the preview panel showing the About you page or the first
// chapter's cards as the draft stands (the panel's shell from design note 13; E5-6 fills
// it in). Without a set the page
// points to Import. The sample is read-only (stories/E8-8): its intro and fields are listed,
// not edited. Copy: docs/copy/app.md (Build).
import Link from "next/link";
import { notFound } from "next/navigation";
import { items, projects } from "@/db/queries";
import { effectiveAccent } from "@/lib/brand-rules";
import { requireCurrentWorkspace } from "@/lib/current-workspace";
import { BUILD_COPY, isPublished, openDraft } from "@/lib/instruments";
import { textFor } from "@/lib/item-text";
import { fieldSummary } from "@/lib/respondent-fields";
import { labelFor, METHODS, proposedCode, scaleFor } from "@/lib/scoring";
import { areaNames } from "@/lib/shaping";
import { BuildOn } from "./build-on";
import { FieldsForm } from "./fields-form";
import { IntroForm } from "./intro-form";
import { PreviewPanel } from "./preview-panel";
import { ScoringForm } from "./scoring-form";

// The preview draws at most this many cards (the set may hold 2,000 rows).
const PREVIEW_CARDS = 10;

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
  const firstChapter = areaNames(builtOn, rows)[0] ?? null;
  const readOnly = project.isSample;
  const locked = readOnly || (await isPublished(current.ws, instrument.id));
  const accent = effectiveAccent(current.workspace.accentHex);
  // The first chapter's cards for the preview (stories/E5-2): the reader text when accepted,
  // the details from the first custom column or the original text, the proposed value as
  // a code of the method (null when the import's word is not one of the scale's).
  const chapterRows = firstChapter ? rows.filter((it) => it.area === firstChapter) : rows;
  const cards = chapterRows.slice(0, PREVIEW_CARDS).map((it) => {
    const custom = it.custom && typeof it.custom === "object" ? Object.values(it.custom as Record<string, string>).find((v) => typeof v === "string" && v.trim()) : undefined;
    const title = textFor(it);
    return { reference: it.sourceRef, title, details: custom ?? (title !== it.originalText ? it.originalText : null), method: instrument.method, labels: instrument.scaleLabels, proposed: proposedCode(instrument.method, it.proposedValue), showProposed: instrument.showProposed, accent };
  });
  const methodLabel = METHODS.find((m) => m.key === instrument.method)?.label ?? instrument.method;
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold tracking-[-0.02em]">{BUILD_COPY.title}</h2>
        <p className="text-ink-muted" data-testid="build-line">{BUILD_COPY.line(builtOn.version)}</p>
      </div>
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
                <li className="py-2.5 text-[13px] text-ink-muted">{BUILD_COPY.sample}</li>
              </ul>
            ) : (
              <ScoringForm key={instrument.id} projectId={project.id} instrumentId={instrument.id} method={instrument.method} showProposed={instrument.showProposed} labels={instrument.scaleLabels} locked={locked} />
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
          about={{ workspaceName: current.workspace.name, accent, title: instrument.title, intro: instrument.intro, fields: instrument.respondentFields, firstChapter }}
          chapter={{ name: firstChapter, count: chapterRows.length, cards }}
          total={rows.length}
        />
      </div>
    </div>
  );
}
