"use client";
// The column mapping card (stories/E3-3; PM app board, Import): one row per column with its
// header, its letter and a select of the roles; a change submits the whole form, so the server
// keeps one column per single role and at most five custom fields (src/lib/import/mapping.ts).
// The sixth Custom field option is disabled with its reason. The missing-text message sits
// under the rows; the Import button (E3-5) is disabled at 40 percent while it shows.
// The selects are uncontrolled, each keyed by its saved role: React resets a form's fields
// after its action completes (react.dev/reference/react-dom/components/form, "form will be
// reset"), so a controlled select fell back to its first option; with defaultValue from the
// saved mapping the reset lands on what the server kept, and the page re-renders the card
// with the new mapping after every save. The page keys the card by upload id, so a new upload
// gets a fresh card (react.dev/learn/preserving-and-resetting-state). useActionState:
// react.dev/reference/react/useActionState.
import { useActionState, useRef } from "react";
import type { ColumnMapping } from "@/db/types";
import { Button } from "@/components/ui/button";
import { columnKey, CUSTOM_MAX, customCount, MAPPING_COPY, mappingError, ROLES, type Column } from "@/lib/import/mapping";
import { mapAction, type ProjectFormState } from "../../actions";

export function MappingCard({ projectId, uploadId, columns, mapping, rememberedFrom, rowsRead }: { projectId: string; uploadId: string; columns: Column[]; mapping: ColumnMapping; rememberedFrom: string | null; rowsRead: number }) {
  const [state, action, pending] = useActionState<ProjectFormState, FormData>(mapAction, { error: null, saved: false });
  const form = useRef<HTMLFormElement>(null);
  const custom = customCount(mapping);
  const hasText = mappingError(mapping) === null;
  const error = pending ? null : state.error ?? mappingError(mapping);
  return (
    <section className="flex flex-col rounded-md border border-hairline" aria-labelledby="mapping-title">
      <div className="flex items-center justify-between gap-4 border-b border-hairline px-4 py-3">
        <h3 id="mapping-title" className="font-medium">Column mapping</h3>
        {rememberedFrom && <span data-testid="mapping-remembered" className="text-[13px] text-ink-muted">{MAPPING_COPY.remembered(rememberedFrom)}</span>}
      </div>
      <form ref={form} action={action} className="flex flex-col">
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="uploadId" value={uploadId} />
        {columns.map((column) => {
          const key = columnKey(column);
          const role = mapping[key] ?? "skip";
          const id = `map-${column.letter}`;
          return (
            <div key={key} className="flex items-center gap-4 border-b border-grey-100 px-4 py-2.5">
              <div className="flex w-[140px] shrink-0 flex-col">
                <label htmlFor={id} className="truncate font-medium" title={column.name}>{column.name || `Column ${column.letter}`}</label>
                <span className="text-xs text-ink-muted">Column {column.letter}</span>
              </div>
              <span className="text-ink-muted">maps to</span>
              <select key={role} id={id} name={`col:${key}`} defaultValue={role} disabled={pending} className="h-9 min-w-[200px] flex-grow rounded-md border border-hairline-strong bg-white px-2 text-sm"
                onChange={() => form.current?.requestSubmit()}>
                {ROLES.map((r) => {
                  const customFull = r.value === "custom" && role !== "custom" && custom >= CUSTOM_MAX;
                  return <option key={r.value} value={r.value} disabled={customFull} title={customFull ? MAPPING_COPY.customLimit : undefined}>{r.label}{customFull ? ` (${MAPPING_COPY.customLimit.toLowerCase()})` : ""}</option>;
                })}
              </select>
            </div>
          );
        })}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <span className="text-[13px] text-ink-muted">{MAPPING_COPY.footer}</span>
          <Button type="button" disabled={!hasText} title="Importing comes with the check report (E3-5)." className={hasText ? "" : "opacity-40"}>Import {rowsRead.toLocaleString("en-GB")} {rowsRead === 1 ? "item" : "items"}</Button>
        </div>
        {error && <p id="mapping-error" role="alert" className="px-4 pb-3 text-sm text-danger">{error}</p>}
      </form>
    </section>
  );
}
