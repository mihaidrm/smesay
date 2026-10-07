"use client";
// The Intro card of Build (stories/E5-1, acceptance 1): the title, defaulted to the project
// name on the server, and the intro with the errors.md hint under it while it is empty and
// the count as typed. "Saved." shows until the next change. Save is a secondary button:
// Build has two Save cards and no primary action until Share exists (design note 38).
// useActionState: react.dev/reference/react/useActionState. The card registers with the
// unsaved changes guard (stories/E5-9): a change makes it unsaved until the save goes
// through; Discard remounts it with the server's values (useDiscard).
import { useActionState, useState } from "react";
import { useDiscard, useUnsavedForm } from "@/components/app/unsaved";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BUILD_COPY, INTRO_MAX } from "@/lib/build-copy";
import { isUnsaved } from "@/lib/unsaved";
import { saveIntroAction, type ProjectFormState } from "../../actions";

type Props = { projectId: string; instrumentId: string; title: string; intro: string };

export function IntroForm(props: Props) {
  const [epoch, discard] = useDiscard();
  return <Form key={epoch} {...props} discard={discard} />;
}

function Form({ projectId, instrumentId, title: initialTitle, intro: initialIntro, discard }: Props & { discard: () => void }) {
  const [state, action, pending] = useActionState<ProjectFormState, FormData>(saveIntroAction, { error: null, saved: false });
  const [title, setTitle] = useState(initialTitle);
  const [intro, setIntro] = useState(initialIntro);
  const [dirty, setDirty] = useState(false);
  const unsaved = useUnsavedForm({ id: "build-intro", label: BUILD_COPY.introCard, dirty: isUnsaved(dirty, pending, state), reset: discard });
  const over = intro.trim().length > INTRO_MAX;
  return (
    <form {...unsaved.props} action={action} onSubmit={() => setDirty(false)} noValidate className="flex flex-col gap-3" data-testid="intro-form">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="instrumentId" value={instrumentId} />
      <div className="flex flex-col gap-1">
        <Label htmlFor="build-title" className="text-[13px]">{BUILD_COPY.titleLabel}</Label>
        <Input id="build-title" name="title" value={title} onChange={(e) => { setDirty(true); setTitle(e.target.value); }} className="h-10" />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="build-intro" className="text-[13px]">{BUILD_COPY.introLabel}</Label>
        <Textarea id="build-intro" name="intro" rows={3} value={intro} onChange={(e) => { setDirty(true); setIntro(e.target.value); }} className="min-h-[84px]" aria-describedby="build-intro-hint build-intro-count" />
        <div className="flex items-start justify-between gap-3">
          <p id="build-intro-hint" className="text-[13px] text-ink-muted" data-testid="intro-hint">{intro.trim() ? "" : BUILD_COPY.introHint}</p>
          <span id="build-intro-count" className={`shrink-0 whitespace-nowrap text-xs ${over ? "text-danger" : "text-ink-muted"}`}>{BUILD_COPY.introCount(intro.trim().length)}</span>
        </div>
      </div>
      {state.error && !dirty && <p role="alert" className="text-sm text-danger">{state.error}</p>}
      {!state.error && !dirty && state.saved && <p role="status" className="text-[13px] text-agree-text">{BUILD_COPY.saved}</p>}
      <div className="flex justify-end"><Button type="submit" variant="secondary" loading={pending} disabled={over}>{BUILD_COPY.save}</Button></div>
    </form>
  );
}
