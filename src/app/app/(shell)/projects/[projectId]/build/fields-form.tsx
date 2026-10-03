"use client";
// The Respondent fields card of Build (stories/E5-1, acceptance 2): one row per field with
// its label, type (text, dropdown with its options one per line, email) and the Required
// toggle; Add a field up to eight; Remove refused on the last one with the errors.md line.
// The rows go to the server as one JSON list (the hidden `fields` input), where
// parseFields applies the rule again (src/lib/respondent-fields.ts). The toggle is the design
// system's 44 by 24 switch, named by the visible "Required" label (docs/design-system.md,
// Components), the same markup as the mode toggle without its view transition names.
import { useActionState, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { RespondentFieldSpec } from "@/db/types";
import { BUILD_COPY } from "@/lib/build-copy";
import { FIELD_TYPE_LABEL, FIELD_TYPES, FIELDS_MAX, type FieldType } from "@/lib/respondent-fields";
import { saveFieldsAction, type ProjectFormState } from "../../actions";

type Row = { id: number; label: string; type: FieldType; mandatory: boolean; options: string };

const fromSpec = (fields: RespondentFieldSpec[]): Row[] => fields.map((f, i) => ({ id: i, label: f.label, type: f.type, mandatory: f.mandatory, options: (f.options ?? []).join("\n") }));

const SELECT = "h-10 w-full rounded-xl border border-hairline-strong bg-surface px-3 text-sm text-ink outline-none focus-visible:border-violet focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

export function FieldsForm({ projectId, instrumentId, fields }: { projectId: string; instrumentId: string; fields: RespondentFieldSpec[] }) {
  const [state, action, pending] = useActionState<ProjectFormState, FormData>(saveFieldsAction, { error: null, saved: false });
  const [rows, setRows] = useState<Row[]>(() => fromSpec(fields));
  const [nextId, setNextId] = useState(fields.length);
  const [refusal, setRefusal] = useState<string | null>(null);
  const prefix = useId();
  const patch = (id: number, change: Partial<Row>) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...change } : r)));
  const remove = (id: number) => {
    if (rows.length <= 1) { setRefusal(BUILD_COPY.lastField); return; }
    setRefusal(null);
    setRows((rs) => rs.filter((r) => r.id !== id));
  };
  const add = () => {
    if (rows.length >= FIELDS_MAX) return;
    setRefusal(null);
    setRows((rs) => [...rs, { id: nextId, label: "", type: "text", mandatory: false, options: "" }]);
    setNextId((n) => n + 1);
  };
  const payload = JSON.stringify(rows.map(({ label, type, mandatory, options }) => (type === "dropdown" ? { label, type, mandatory, options } : { label, type, mandatory })));
  return (
    <form action={action} onSubmit={() => setRefusal(null)} noValidate className="flex flex-col gap-3" data-testid="fields-form">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="instrumentId" value={instrumentId} />
      <input type="hidden" name="fields" value={payload} />
      <ul className="flex flex-col gap-2">
        {rows.map((row, i) => {
          const id = `${prefix}-${row.id}`;
          return (
            <li key={row.id} className="item-row flex flex-col gap-2" data-testid="field-row">
              <div className="flex items-end gap-3">
                <div className="flex grow flex-col gap-1">
                  <Label htmlFor={`${id}-label`} className="text-xs">{BUILD_COPY.labelLabel}</Label>
                  <Input id={`${id}-label`} value={row.label} onChange={(e) => patch(row.id, { label: e.target.value })} className="h-10" maxLength={60} />
                </div>
                <div className="flex w-32 shrink-0 flex-col gap-1">
                  <Label htmlFor={`${id}-type`} className="text-xs">{BUILD_COPY.typeLabel}</Label>
                  <select id={`${id}-type`} value={row.type} onChange={(e) => patch(row.id, { type: e.target.value as FieldType })} className={SELECT}>
                    {FIELD_TYPES.map((t) => <option key={t} value={t}>{FIELD_TYPE_LABEL[t]}</option>)}
                  </select>
                </div>
                <div className="flex shrink-0 flex-col items-start gap-1">
                  <span id={`${id}-required`} className="text-xs font-medium">{BUILD_COPY.requiredLabel}</span>
                  <span className="flex h-10 items-center">
                    <button type="button" role="switch" aria-checked={row.mandatory} aria-labelledby={`${id}-required`} onClick={() => patch(row.id, { mandatory: !row.mandatory })}
                      className="relative h-6 w-11 shrink-0 rounded-full border border-transparent bg-ink-muted transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface aria-checked:bg-violet">
                      <span aria-hidden="true" className="absolute top-1/2 left-0.5 block size-5 -translate-y-1/2 rounded-full bg-white shadow-sm transition-transform duration-150 in-aria-checked:translate-x-5 dark:bg-ground" />
                    </button>
                  </span>
                </div>
                <Button type="button" variant="tertiary" size="small" onClick={() => remove(row.id)} aria-label={`${BUILD_COPY.remove} ${row.label || `field ${i + 1}`}`} className="shrink-0">{BUILD_COPY.remove}</Button>
              </div>
              {row.type === "dropdown" && (
                <div className="flex flex-col gap-1">
                  <Label htmlFor={`${id}-options`} className="text-xs">{BUILD_COPY.optionsLabel}</Label>
                  <Textarea id={`${id}-options`} rows={3} value={row.options} onChange={(e) => patch(row.id, { options: e.target.value })} className="min-h-[76px] font-mono text-sm" />
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {refusal && <p role="alert" className="text-sm text-danger" data-testid="fields-refusal">{refusal}</p>}
      {state.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}
      {!state.error && !refusal && state.saved && <p role="status" className="text-[13px] text-agree-text">{BUILD_COPY.saved}</p>}
      <div className="flex items-center justify-between gap-3">
        <Button type="button" variant="secondary" size="small" onClick={add} disabled={rows.length >= FIELDS_MAX}>{BUILD_COPY.addField}</Button>
        <Button type="submit" loading={pending}>{BUILD_COPY.save}</Button>
      </div>
    </form>
  );
}
