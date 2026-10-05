// The visitors' sample instrument (stories/E12-4): the Marlow Group instrument from the seed's
// facts (src/db/seed/sample.ts), built in memory with no database read, so /sample works in
// every deployment and writes nothing (decision 0031, item 13). The items are as a respondent
// gets them (src/lib/respondent.ts itemsFor): the reader text as the title, the details text,
// the proposed value as the scale's code. Each item's id is its reference: nothing is stored
// under it. It keeps the default reason rule (when the answer differs; design note 98).
import * as seed from "@/db/seed/sample";
import type { AreaMeta, RespondentItem } from "@/lib/respondent-rules";
import { DEFAULT_REASON_RULE, proposedCode } from "@/lib/scoring";

export const SAMPLE_PATH = "/sample";

export function sampleInstrument() {
  const { instrument } = seed;
  const items: RespondentItem[] = seed.items.map((it) => ({
    id: it.ref,
    reference: it.ref,
    title: it.reader,
    details: it.details,
    area: it.area,
    proposed: instrument.showProposed ? proposedCode(instrument.method, it.proposed) : null,
    perspectives: [],
  }));
  const areas: AreaMeta[] = seed.areas.map((a) => ({ name: a.name, intro: a.rationale }));
  return {
    workspaceName: seed.workspace.name,
    accentHex: seed.workspace.accentHex,
    instrument: { title: instrument.title, intro: instrument.intro, fields: instrument.respondentFields, perspectives: [] as string[], method: instrument.method, labels: null, showProposed: instrument.showProposed, layout: instrument.layout, reasonRule: DEFAULT_REASON_RULE },
    closing: instrument.closing,
    items,
    areas,
  };
}
