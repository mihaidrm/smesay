// The filter context and the filter of Results (stories/E8-1; E5-7, acceptance 4), shared by
// the Results page and the export route so a file reads the filter the page reads. Under
// Named the context is the validation's fields and perspectives. Under Names hidden and
// Anonymous it holds the dropdown fields only, and `offered` keeps the values given by
// MIN_GROUP counted respondents or more (results.fieldValueCounts, counted under the switch
// the URL or the PM's stored choice sets), so no filter keeps fewer than three people by a
// value; the URL is read twice, the second time against those values.
import type { Instrument } from "@/db/queries/instruments";
import { results } from "@/db/queries/results";
import type { WorkspaceId } from "@/db/types";
import { namesShown } from "@/lib/anonymity";
import { MIN_GROUP } from "@/lib/results-agreement";
import { parseResultsFilter, type FilterContext, type ResultsFilter, type SearchParams } from "@/lib/results-filter";

export async function resultsContext(ws: WorkspaceId, instrument: Pick<Instrument, "id" | "respondentFields" | "perspectives" | "anonymity">, query: SearchParams, stored: boolean | null): Promise<{ ctx: FilterContext; filter: ResultsFilter }> {
  if (namesShown(instrument.anonymity)) {
    const ctx: FilterContext = { fields: instrument.respondentFields, perspectives: instrument.perspectives, anonymity: instrument.anonymity };
    return { ctx, filter: parseResultsFilter(query, ctx, stored) };
  }
  const fields = instrument.respondentFields.filter((f) => f.type === "dropdown");
  const first = parseResultsFilter(query, { fields, perspectives: instrument.perspectives, anonymity: instrument.anonymity, offered: {} }, stored);
  const counts = await results.fieldValueCounts(ws, instrument.id, first.includeUnsubmitted);
  const offered: Record<string, string[]> = {};
  for (const f of fields) offered[f.key] = (f.options ?? []).filter((o) => (counts.find((c) => c.key === f.key && c.value === o)?.n ?? 0) >= MIN_GROUP);
  const ctx: FilterContext = { fields, perspectives: instrument.perspectives, anonymity: instrument.anonymity, offered };
  return { ctx, filter: parseResultsFilter(query, ctx, stored) };
}
