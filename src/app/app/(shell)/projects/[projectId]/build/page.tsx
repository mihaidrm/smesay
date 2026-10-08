// Build (stories/E5-1 and E5-2; the PM app board, Build): the title and the version line,
// "Build on version N" when a newer set exists (owed from E3-6), the Intro card, the Scoring
// card (method, show proposed, labels, locked once published; the layout, E5-3), the
// Perspectives card (E5-4; items are tagged on Shape), the Closing card (E5-5) and the
// Respondent fields card, and on the right the preview (with-preview.tsx, E5-6): the real
// respondent app for the draft, ringing the rating row, the chapter row, About you's fields
// and the Wrap up's closing part. Without a set the page
// points to Import. The sample is read-only (stories/E8-8): its intro and fields are listed,
// not edited. The five cards are collapsible and one is open at a time (design note 122;
// src/lib/build-guide.ts says which opens and writes the settings on each title row; the
// card holds its state through a save). Copy: docs/copy/app.md (Build).
import Link from "next/link";
import { notFound } from "next/navigation";
import { itemSets, items, projects } from "@/db/queries";
import { VIEW_AS_COPY } from "@/lib/view-as-copy";
import { requireCurrentWorkspace } from "@/lib/current-workspace";
import { CLOSING_COPY, signOffFor } from "@/lib/closing";
import { BUILD_COPY, isPublished, openDraft } from "@/lib/instruments";
import { fieldSummary } from "@/lib/respondent-fields";
import { labelFor, LAYOUTS_META, METHODS, REASON_RULES_META, scaleFor } from "@/lib/scoring";
import { CollapsibleCard } from "@/components/app/collapsible-card";
import { UnsavedMark } from "@/components/app/unsaved";
import { BUILD_CARD_COPY, openBuildCards } from "@/lib/build-guide";
import { BuildOn } from "./build-on";
import { ClosingForm } from "./closing-form";
import { FieldsForm } from "./fields-form";
import { IntroForm } from "./intro-form";
import { PerspectivesForm } from "./perspectives-form";
import { ScoringForm } from "./scoring-form";
import { WithPreview } from "../with-preview";
import { StepTip } from "../step-tip";
import { buildTip } from "@/lib/guide";

export default async function BuildPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const { current, viewing } = await requireCurrentWorkspace(`/app/projects/${projectId}/build`);
  const project = await projects.get(current.ws, projectId);
  if (!project) notFound();
  const draft = await openDraft(current.ws, project, { create: !viewing });
  const hasSet = viewing !== null && draft === null && (await itemSets.list(current.ws)).some((s) => s.projectId === project.id);
  if (!draft) {
    return (
      <div className="flex flex-col gap-5">
        <h2 className="text-xl font-bold tracking-[-0.02em]">{BUILD_COPY.title}</h2>
        <div className="flex flex-col items-start gap-2 rounded-2xl border border-dashed border-hairline-strong bg-surface p-6" data-testid="build-empty">
          <div className="font-semibold">{viewing && hasSet ? VIEW_AS_COPY.buildNotOpened : BUILD_COPY.noSet}</div>
          <Link href={`/app/projects/${project.id}/import`} className="text-sm underline underline-offset-4">{BUILD_COPY.noSetLink}</Link>
        </div>
      </div>
    );
  }
  const { instrument, builtOn, newer } = draft;
  const rows = await items.forSet(current.ws, builtOn.id);
  const readOnly = project.isSample;
  const locked = readOnly || (await isPublished(current.ws, instrument.id));
  const tagged = rows.filter((it) => it.perspectives.length > 0).length;
  const methodLabel = METHODS.find((m) => m.key === instrument.method)?.label ?? instrument.method;
  const cards = openBuildCards({ intro: instrument.intro, readOnly });
  // One group, so opening a card closes the open one; `hold` keeps a card open through its save.
  const group = { name: "build-cards", hold: true } as const;
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold tracking-[-0.02em]">{BUILD_COPY.title}</h2>
        <p className="text-ink-muted" data-testid="build-line">{BUILD_COPY.line(builtOn.version)}</p>
      </div>
      {!locked && <StepTip path={`/app/projects/${project.id}/build`} tip={buildTip({ intro: instrument.intro, fields: instrument.respondentFields })} />}
      <WithPreview projectId={project.id} step="build">
          {newer && !readOnly && <BuildOn key={instrument.id} projectId={project.id} instrumentId={instrument.id} built={builtOn.version} latest={newer.version} />}
          <CollapsibleCard {...group} title={BUILD_COPY.introCard} titleId="build-intro-title" summary={BUILD_CARD_COPY.intro.summary(instrument.title, instrument.intro)} mark={<UnsavedMark id="build-intro" />} open={cards.intro} testId="card-intro">
            {readOnly ? (
              <div className="flex flex-col gap-2 text-sm">
                <div><span className="text-ink-muted">{BUILD_COPY.titleLabel}: </span>{instrument.title}</div>
                <div><span className="text-ink-muted">{BUILD_COPY.introLabel}: </span>{instrument.intro}</div>
                <p className="text-[13px] text-ink-muted">{BUILD_COPY.sample}</p>
              </div>
            ) : (
              <IntroForm key={instrument.id} projectId={project.id} instrumentId={instrument.id} title={instrument.title} intro={instrument.intro ?? ""} />
            )}
          </CollapsibleCard>
          <CollapsibleCard {...group} title={BUILD_COPY.scoringCard} titleId="build-scoring-title" summary={BUILD_CARD_COPY.scoring.summary(instrument)} mark={<UnsavedMark id="build-scoring" />} open={cards.scoring} testId="card-scoring">
            <p className="text-[13px] text-ink-muted">{BUILD_COPY.scoringLine}</p>
            {readOnly ? (
              <ul className="flex flex-col text-sm" data-testid="scoring-list">
                <li className="flex justify-between gap-4 py-2.5"><span>{BUILD_COPY.methodLabel}</span><span className="text-ink-muted">{methodLabel}: {scaleFor(instrument.method, instrument.scaleLabels).map((v) => v.label).join(", ")}, {labelFor(instrument.method, null, "unclear")}</span></li>
                <li className="flex justify-between gap-4 border-t border-hairline py-2.5"><span>{BUILD_COPY.showProposedTitle}</span><span className="text-ink-muted">{instrument.showProposed ? BUILD_COPY.on : BUILD_COPY.off}</span></li>
                <li className="flex justify-between gap-4 border-t border-hairline py-2.5"><span>{BUILD_COPY.reasonRuleLabel}</span><span className="text-ink-muted">{REASON_RULES_META.find((r) => r.key === instrument.reasonRule)?.label ?? instrument.reasonRule}</span></li>
                <li className="flex justify-between gap-4 border-t border-hairline py-2.5"><span>{BUILD_COPY.layoutLabel}</span><span className="text-ink-muted">{LAYOUTS_META.find((l) => l.key === instrument.layout)?.label ?? instrument.layout}</span></li>
                <li className="py-2.5 text-[13px] text-ink-muted">{BUILD_COPY.sample}</li>
              </ul>
            ) : (
              <ScoringForm key={instrument.id} projectId={project.id} instrumentId={instrument.id} method={instrument.method} showProposed={instrument.showProposed} labels={instrument.scaleLabels} reasonRule={instrument.reasonRule} layout={instrument.layout} locked={locked} />
            )}
          </CollapsibleCard>
          <CollapsibleCard {...group} title={BUILD_COPY.perspectivesCard} titleId="build-perspectives-title" summary={BUILD_CARD_COPY.perspectives.summary(instrument.perspectives, tagged, rows.length)} mark={<UnsavedMark id="build-perspectives" />} open={cards.perspectives} testId="card-perspectives">
            <p className="text-[13px] text-ink-muted">{BUILD_COPY.perspectivesLine}</p>
            {readOnly ? (
              <p className="text-sm text-ink-muted" data-testid="perspectives-list">{instrument.perspectives.length === 0 ? BUILD_COPY.perspectivesNone : BUILD_COPY.perspectivesList(instrument.perspectives)} {BUILD_COPY.sample}</p>
            ) : (
              <PerspectivesForm key={instrument.id} projectId={project.id} instrumentId={instrument.id} names={instrument.perspectives} tagged={tagged} total={rows.length} locked={locked} />
            )}
          </CollapsibleCard>
          <CollapsibleCard {...group} title={CLOSING_COPY.card} titleId="build-closing-title" summary={BUILD_CARD_COPY.closing.summary(instrument.closing)} mark={<UnsavedMark id="build-closing" />} open={cards.closing} testId="card-closing" data-preview-screen="wrap">
            <p className="text-[13px] text-ink-muted">{CLOSING_COPY.line}</p>
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
          </CollapsibleCard>
          <CollapsibleCard {...group} title={BUILD_COPY.fieldsCard} titleId="build-fields-title" count={BUILD_CARD_COPY.fields.count(instrument.respondentFields.length)} summary={BUILD_CARD_COPY.fields.summary(instrument.respondentFields)} mark={<UnsavedMark id="build-fields" />} open={cards.fields} testId="card-fields">
            <p className="text-[13px] text-ink-muted">{BUILD_COPY.fieldsLine}</p>
            {readOnly ? (
              <ul className="flex flex-col text-sm" data-testid="fields-list">
                {instrument.respondentFields.map((f) => (
                  <li key={f.key} className="flex justify-between gap-4 border-t border-hairline py-2.5 first:border-t-0"><span>{f.label}</span><span className="text-ink-muted">{fieldSummary(f)}</span></li>
                ))}
              </ul>
            ) : (
              <FieldsForm key={instrument.id} projectId={project.id} instrumentId={instrument.id} fields={instrument.respondentFields} />
            )}
          </CollapsibleCard>
      </WithPreview>
    </div>
  );
}
