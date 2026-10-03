// Build (stories/E5-1; the PM app board, Build): the title and the version line, "Build on
// version N" when a newer set exists (owed from E3-6), the Intro card and the Respondent
// fields card, and on the right the preview panel showing the About you page as the draft
// stands (the panel's shell from design note 13; E5-6 fills it in). Without a set the page
// points to Import. The sample is read-only (stories/E8-8): its intro and fields are listed,
// not edited. Copy: docs/copy/app.md (Build).
import Link from "next/link";
import { notFound } from "next/navigation";
import { AboutYou } from "@/components/respondent/about-you";
import { items, projects } from "@/db/queries";
import { effectiveAccent } from "@/lib/brand-rules";
import { requireCurrentWorkspace } from "@/lib/current-workspace";
import { BUILD_COPY, openDraft } from "@/lib/instruments";
import { fieldSummary } from "@/lib/respondent-fields";
import { areaNames } from "@/lib/shaping";
import { BuildOn } from "./build-on";
import { FieldsForm } from "./fields-form";
import { IntroForm } from "./intro-form";

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
        <aside className="flex w-[460px] shrink-0 flex-col gap-3 rounded-2xl border border-hairline bg-surface p-4" aria-labelledby="preview-title" data-testid="preview-panel">
          <div className="flex items-center justify-between gap-3">
            <h3 id="preview-title" className="text-[15px] font-bold">{BUILD_COPY.preview}</h3>
            <span className="rounded-full bg-tint px-3 py-1 text-xs font-semibold text-ink-muted">{BUILD_COPY.previewDevice}</span>
          </div>
          <p className="flex items-center gap-2 text-[13px] text-ink-muted"><span aria-hidden="true" className="inline-block size-2.5 shrink-0 rounded-sm bg-violet" />{BUILD_COPY.previewCaption}</p>
          <div className="mx-auto h-[720px] w-[390px] overflow-y-auto rounded-[28px] border border-hairline-strong bg-ground ring-2 ring-violet/40 ring-offset-2 ring-offset-surface">
            <AboutYou key={`${instrument.id}-${JSON.stringify(instrument.respondentFields)}-${instrument.intro}-${instrument.title}`} workspaceName={current.workspace.name} accent={effectiveAccent(current.workspace.accentHex)} title={instrument.title} intro={instrument.intro} fields={instrument.respondentFields} firstChapter={firstChapter} preview />
          </div>
        </aside>
      </div>
    </div>
  );
}
