// The visitors' sample (stories/E12-4): the Marlow Group instrument in the real respondent app
// (src/app/r/[token]/respondent-app.tsx) in its sample mode, for anyone, with no account and no
// workspace. The instrument comes from the seed's facts in memory (src/lib/sample-instrument.ts);
// what the visitor enters stays in the tab's session storage for the visit (sample-app.tsx);
// Submit shows the Done page and sends nothing; no cookie is set and no server route is called.
// The watermark band (E8-8) runs across the top and says nothing is saved; "Powered by SMEsay"
// links to the landing page and Done offers Start free. The proxy limits the page as a
// respondent route (src/proxy.ts, E11-1).
import type { Metadata } from "next";
import { SampleBand } from "@/components/app/sample-band";
import { effectiveAccent } from "@/lib/brand-rules";
import { SAMPLE_COPY } from "@/lib/sample-copy";
import { sampleInstrument } from "@/lib/sample-instrument";
import { SampleApp } from "./sample-app";

export const metadata: Metadata = { title: `${SAMPLE_COPY.title} · SMEsay`, robots: { index: false } };

export default function SamplePage() {
  const sample = sampleInstrument();
  return (
    <div className="bg-ground">
      <SampleBand text={SAMPLE_COPY.band} className="rounded-none border-x-0 border-t-0 text-center" />
      <SampleApp sample={sample} accent={effectiveAccent(sample.accentHex)} />
    </div>
  );
}
