// The scoring mapping (stories/E5-2, acceptance 5): every (method, shown, picked value) to
// the AnswerKind and value stored; the proposed value read from the import's words; the
// PM's labels applied and validated.
import { describe, expect, it } from "vitest";
import { classify, labelFor, parseScaleLabels, proposedCode, SCALES, scaleFor, SCORING_ERRORS } from "./scoring";

describe("classify", () => {
  it("maps every value of every method with the proposal shown", () => {
    const expected: Record<string, Record<string, string>> = {
      moscow: { M: "agree", S: "change", C: "change", W: "disagree" },
      fit: { "3": "agree", "1": "disagree", "2": "change", "4": "change", "5": "change" },
      kcd: { K: "agree", C: "change", D: "disagree" },
    };
    const proposed = { moscow: "M", fit: "3", kcd: "K" } as const;
    for (const method of ["moscow", "fit", "kcd"] as const) {
      for (const v of SCALES[method]) {
        expect(classify({ method, showProposed: true, proposed: proposed[method], picked: v.code })).toEqual({ kind: expected[method][v.code], value: v.code });
      }
      expect(classify({ method, showProposed: true, proposed: proposed[method], picked: "unclear" })).toEqual({ kind: "unclear", value: null });
    }
  });
  it("stores pick without a proposal shown, or when the item has none", () => {
    for (const method of ["moscow", "fit", "kcd"] as const) {
      for (const v of SCALES[method]) {
        expect(classify({ method, showProposed: false, proposed: "M", picked: v.code })).toEqual({ kind: "pick", value: v.code });
        expect(classify({ method, showProposed: true, proposed: null, picked: v.code })).toEqual({ kind: "pick", value: v.code });
      }
    }
    expect(classify({ method: "moscow", showProposed: false, proposed: null, picked: "unclear" })).toEqual({ kind: "unclear", value: null });
  });
  it("refuses a value of another method", () => {
    expect(() => classify({ method: "kcd", showProposed: true, proposed: "K", picked: "M" })).toThrow();
  });
});

describe("proposedCode", () => {
  it("reads the import's words, codes and labels", () => {
    // The same words the import recognises (src/lib/import/values.ts), nothing more.
    expect(proposedCode("moscow", "Must")).toBe("M");
    expect(proposedCode("moscow", " must have ")).toBe("M");
    expect(proposedCode("moscow", "M")).toBe("M");
    expect(proposedCode("moscow", "Won't have")).toBe("W");
    expect(proposedCode("moscow", "Not needed")).toBe("W");
    expect(proposedCode("moscow", "no")).toBeNull();
    expect(proposedCode("moscow", "High")).toBeNull();
    expect(proposedCode("moscow", null)).toBeNull();
    expect(proposedCode("fit", "4")).toBe("4");
    expect(proposedCode("fit", "Must")).toBeNull();
    expect(proposedCode("kcd", "drop")).toBe("D");
    expect(proposedCode("kcd", "Change")).toBe("C");
    expect(proposedCode("kcd", "K")).toBeNull();
  });
});

describe("labels", () => {
  it("applies the PM's labels and keeps the defaults elsewhere", () => {
    expect(scaleFor("moscow", { M: "Essential" }).map((v) => v.label)).toEqual(["Essential", "Should", "Could", "Not needed"]);
    expect(scaleFor("fit", null).map((v) => v.caption ?? "")).toEqual(["no fit", "", "", "", "fits fully"]);
    expect(labelFor("kcd", { D: "Remove" }, "D")).toBe("Remove");
    expect(labelFor("kcd", null, "unclear")).toBe("Unclear");
    expect(labelFor("kcd", null, "Z")).toBeNull();
  });
  it("parses the form's labels with the rule", () => {
    expect(parseScaleLabels("moscow", { M: " Essential ", S: "", C: "Could", W: "Not needed", K: "x" })).toEqual({ labels: { M: "Essential" } });
    expect(parseScaleLabels("moscow", { M: "", S: "Should" })).toEqual({ labels: null });
    expect(parseScaleLabels("moscow", null)).toEqual({ labels: null });
    expect(parseScaleLabels("moscow", { M: "x".repeat(21) })).toEqual({ error: SCORING_ERRORS.badLabel });
    expect(parseScaleLabels("moscow", { M: 5 })).toEqual({ error: SCORING_ERRORS.badShape });
    expect(parseScaleLabels("moscow", [])).toEqual({ error: SCORING_ERRORS.badShape });
    expect(parseScaleLabels("moscow", { M: "should" })).toEqual({ error: SCORING_ERRORS.sameLabel });
    expect(parseScaleLabels("kcd", { K: "unclear" })).toEqual({ error: SCORING_ERRORS.sameLabel });
  });
});
