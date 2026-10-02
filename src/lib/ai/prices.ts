// The price table (stories/E4-1, acceptance 2). Prices read on 2026-10-02 from
// platform.claude.com/docs/en/about-claude/pricing, model pricing table: "Claude Sonnet 5.5 |
// $2 / MTok | ... | $10 / MTok" (MTok: one million tokens). The default model is the Sonnet
// class model of that day (the story's technical notes). Euro conversion by the European
// Central Bank's reference rate of the same day (ecb.europa.eu, eurofxref-daily.xml:
// time 2026-10-02, USD 1.1225). Both are refreshed by hand with the date; nothing here is
// fetched at run time, so a cost is reproducible from the row.
export const DEFAULT_MODEL = "claude-sonnet-5-5";

export type ModelPrice = { usdPerMtokIn: number; usdPerMtokOut: number; readOn: string };

export const PRICES: Record<string, ModelPrice> = {
  "claude-sonnet-5-5": { usdPerMtokIn: 2, usdPerMtokOut: 10, readOn: "2026-10-02" },
};

export const USD_PER_EUR = { rate: 1.1225, date: "2026-10-02" } as const;

// Whole euro cents, rounded up: a call that used any token costs at least one cent, so the
// month's sum never under-reports. The cost in euro is usd / rate.
export function costEurCents(model: string, tokensIn: number, tokensOut: number): number {
  const price = PRICES[model];
  if (!price) throw new Error(`No price for model ${model}. Add it to src/lib/ai/prices.ts.`);
  const usd = (tokensIn * price.usdPerMtokIn + tokensOut * price.usdPerMtokOut) / 1_000_000;
  if (usd === 0) return 0;
  return Math.max(1, Math.ceil((usd / USD_PER_EUR.rate) * 100));
}

// The estimate before a call (acceptance 3): about four characters per token, the pricing
// page's own rule of thumb ("1 token is approximately 4 characters or 0.75 words in
// English"), and the whole output allowance, so the estimate errs high.
export function estimateTokensIn(text: string): number {
  return Math.ceil(text.length / 4);
}
