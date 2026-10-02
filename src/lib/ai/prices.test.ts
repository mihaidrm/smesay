// The price table and the euro cost (stories/E4-1, acceptance 2): whole cents rounded up,
// never zero for a billed token, and an unknown model is an error, not a free call.
import { describe, expect, it } from "vitest";
import { costEurCents, DEFAULT_MODEL, estimateTokensIn, PRICES, USD_PER_EUR } from "./prices";

describe("costEurCents", () => {
  it("names the default model, its prices and the day they were read", () => {
    expect(PRICES[DEFAULT_MODEL]).toEqual({ usdPerMtokIn: 2, usdPerMtokOut: 10, readOn: "2026-10-02" });
    expect(USD_PER_EUR).toEqual({ rate: 1.1225, date: "2026-10-02" });
  });
  it("converts a million input tokens at 2 dollars to 179 cents", () => {
    // 2 USD / 1.1225 = 1.7817 EUR, rounded up to the cent.
    expect(costEurCents(DEFAULT_MODEL, 1_000_000, 0)).toBe(179);
    expect(costEurCents(DEFAULT_MODEL, 0, 1_000_000)).toBe(891);
    expect(costEurCents(DEFAULT_MODEL, 4120, 1630)).toBe(3);
  });
  it("rounds any billed token up to one cent and nothing to zero", () => {
    expect(costEurCents(DEFAULT_MODEL, 1, 0)).toBe(1);
    expect(costEurCents(DEFAULT_MODEL, 0, 0)).toBe(0);
  });
  it("refuses a model without a price", () => {
    expect(() => costEurCents("claude-unknown", 1, 1)).toThrow("No price for model claude-unknown");
  });
  it("estimates four characters per token, rounded up", () => {
    expect(estimateTokensIn("")).toBe(0);
    expect(estimateTokensIn("abcd")).toBe(1);
    expect(estimateTokensIn("abcde")).toBe(2);
  });
});
