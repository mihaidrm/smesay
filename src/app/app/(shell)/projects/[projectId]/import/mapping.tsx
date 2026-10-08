"use client";
// The column mapping card (stories/E3-3; PM app board, Import): one row per column with its
// header, its letter and a select of the roles, each option read as "label: meaning" (design
// note 120); a change submits the whole form with the changed column's key, so the server keeps
// one column per single role, the latest pick winning, and at most five custom fields
// (src/lib/import/mapping.ts).
// The sixth Custom field option is disabled with its reason. The missing-text message sits
// under the rows; the Import button comes with the check report (E3-5).
// The selects are uncontrolled, each keyed by its saved role: React resets a form's fields
// after its action completes (react.dev/reference/react-dom/components/form, "form will be
// reset"), so a controlled select fell back to its first option; with defaultValue from the
// saved mapping the reset lands on what the server kept, and the page re-renders the card
// with the new mapping after every save. The page keys the card by upload id, so a new upload
// gets a fresh card (react.dev/learn/preserving-and-resetting-state). useActionState:
// react.dev/reference/react/useActionState.
// A collapsible card (design note 110): open while the mapping has no text column, by the
// page's rule; the summary counts the columns mapped. The remembered line sits inside it.
// Several sheets (stories/E3-7, acceptance 4 and 5): the message naming a ticked sheet without
// the item text column comes from the page (sheetsError in src/lib/imports.ts), and the switch
// "Use the sheet names as areas" rides in the same form (name sheetAreas, "on" or "off") when
// several sheets are ticked and no column is mapped as area; a change submits the form like a
// select. Switch: src/components/ui/switch.tsx (Base UI; name, value, uncheckedValue and
// defaultChecked in node_modules/@base-ui/react/switch/root/SwitchRoot.d.ts).
import { useActionState, useRef } from "react";
import { CollapsibleCard } from "@/components/app/collapsible-card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { ColumnMapping } from "@/db/types";
import { columnKeys, CUSTOM_MAX, customCount, MAPPING_COPY, mappingError, ROLES, type Column } from "@/lib/import/mapping";
import { IMPORT_CARD_COPY } from "@/lib/import-guide";
import { mapAction, type ProjectFormState } from "../../actions";

export function MappingCard({ uploadId, columns, mapping, rememberedFrom, open, sheetsError = null, sheetAreas = null }: { uploadId: string; columns: Column[]; mapping: ColumnMapping; rememberedFrom: string | null; open: boolean; sheetsError?: string | null; sheetAreas?: boolean | null }) {
  const [state, action, pending] = useActionState<ProjectFormState, FormData>(mapAction, { error: null, saved: false });
  const form = useRef<HTMLFormElement>(null);
  const changed = useRef<HTMLInputElement>(null);
  const custom = customCount(mapping);
  const keys = columnKeys(columns);
  const error = pending ? null : state.error ?? mappingError(mapping) ?? sheetsError;
  const mapped = keys.filter((key) => (mapping[key] ?? "skip") !== "skip").length;
  return (
    <CollapsibleCard title={IMPORT_CARD_COPY.mapping.title} titleId="mapping-title" summary={IMPORT_CARD_COPY.mapping.summary(mapped, columns.length, mappingError(mapping) === null)} open={open} testId="card-mapping" bodyClassName="flex flex-col border-t border-hairline">
      {rememberedFrom && <p data-testid="mapping-remembered" className="px-4 pt-3 text-[13px] text-ink-muted">{MAPPING_COPY.remembered(rememberedFrom)}</p>}
      <form ref={form} action={action} className="flex flex-col">
        <input type="hidden" name="uploadId" value={uploadId} />
        <input type="hidden" name="changed" ref={changed} />
        <p className="px-4 pt-3 text-[13px] text-ink-muted">{MAPPING_COPY.intro}</p>
        {columns.map((column, i) => {
          const key = keys[i];
          const role = mapping[key] ?? "skip";
          const id = `map-${column.letter}`;
          return (
            <div key={key} className="flex items-center gap-4 border-b border-hairline px-4 py-2.5">
              <div className="flex w-[140px] shrink-0 flex-col">
                <label htmlFor={id} className="truncate font-medium" title={column.name}>{column.name || `Column ${column.letter}`}</label>
                <span className="text-xs text-ink-muted">Column {column.letter}</span>
              </div>
              <span className="text-ink-muted">maps to</span>
              <select key={role} id={id} name={`col:${key}`} defaultValue={role} disabled={pending} className="h-9 min-w-[200px] flex-grow rounded-md border border-hairline-strong bg-surface px-2 text-sm"
                onChange={() => { if (changed.current) changed.current.value = key; form.current?.requestSubmit(); }}>
                {ROLES.map((r) => {
                  const customFull = r.value === "custom" && role !== "custom" && custom >= CUSTOM_MAX;
                  return <option key={r.value} value={r.value} disabled={customFull} title={customFull ? MAPPING_COPY.customLimit : undefined}>{`${r.label}: ${r.hint}`}{customFull ? ` (${MAPPING_COPY.customLimit.toLowerCase()})` : ""}</option>;
                })}
              </select>
            </div>
          );
        })}
        {sheetAreas !== null && (
          <div className="flex flex-col gap-1 border-b border-hairline px-4 py-3" data-testid="sheet-areas">
            <div className="flex items-center gap-3">
              <Switch key={String(sheetAreas)} id="sheet-areas" name="sheetAreas" value="on" uncheckedValue="off" defaultChecked={sheetAreas} disabled={pending} onCheckedChange={() => form.current?.requestSubmit()} className="data-[size=default]:h-5 data-[size=default]:w-9" />
              <Label htmlFor="sheet-areas">{MAPPING_COPY.sheetAreas}</Label>
            </div>
            <p className="text-[13px] text-ink-muted">{sheetAreas ? MAPPING_COPY.sheetAreasHint : MAPPING_COPY.sheetAreasOff}</p>
          </div>
        )}
        <div className="px-4 py-3 text-[13px] text-ink-muted">{MAPPING_COPY.single} {MAPPING_COPY.footer}</div>
        {error && <p id="mapping-error" role="alert" className="px-4 pb-3 text-sm text-danger">{error}</p>}
      </form>
    </CollapsibleCard>
  );
}
