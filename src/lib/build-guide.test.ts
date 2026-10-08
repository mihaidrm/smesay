import { describe, expect, it } from "vitest";
import { BUILD_CARD_COPY, listOf, openBuildCards } from "./build-guide";

describe("openBuildCards", () => {
  it("opens Intro alone while the intro is empty", () => {
    expect(openBuildCards({ intro: null, readOnly: false })).toEqual({ intro: true, scoring: false, perspectives: false, closing: false, fields: false });
    expect(openBuildCards({ intro: "  ", readOnly: false })).toEqual({ intro: true, scoring: false, perspectives: false, closing: false, fields: false });
  });
  it("opens nothing once the intro is written", () => {
    expect(openBuildCards({ intro: "Six things the new tool should do.", readOnly: false })).toEqual({ intro: false, scoring: false, perspectives: false, closing: false, fields: false });
  });
  it("opens nothing on the sample", () => {
    expect(openBuildCards({ intro: null, readOnly: true })).toEqual({ intro: false, scoring: false, perspectives: false, closing: false, fields: false });
  });
});

describe("listOf", () => {
  it("joins with commas and an and", () => {
    expect(listOf([])).toBe("");
    expect(listOf(["Name"])).toBe("Name");
    expect(listOf(["Name", "Role"])).toBe("Name and Role");
    expect(listOf(["Name", "Role", "Team"])).toBe("Name, Role and Team");
  });
});

describe("BUILD_CARD_COPY", () => {
  it("writes the intro summary", () => {
    expect(BUILD_CARD_COPY.intro.summary("New expense tool", null)).toBe("New expense tool. No intro yet.");
    expect(BUILD_CARD_COPY.intro.summary("New expense tool", " Five minutes. ")).toBe("New expense tool. Five minutes.");
  });
  it("writes the scoring summary", () => {
    expect(BUILD_CARD_COPY.scoring.summary({ method: "moscow", showProposed: true, reasonRule: "differs", layout: "chapters" })).toBe("MoSCoW, proposal shown, a reason when the answer differs, chapters");
    expect(BUILD_CARD_COPY.scoring.summary({ method: "fit", showProposed: false, reasonRule: "never", layout: "item" })).toBe("1 to 5 fit, proposal hidden, no reason required, one item per screen");
    expect(BUILD_CARD_COPY.scoring.summary({ method: "kcd", showProposed: true, reasonRule: "always", layout: "page" })).toBe("Keep, change, drop, proposal shown, a reason on every answer, single long page");
  });
  it("writes the perspectives summary", () => {
    expect(BUILD_CARD_COPY.perspectives.summary([], 0, 6)).toBe("None. Every item goes to everyone.");
    expect(BUILD_CARD_COPY.perspectives.summary(["Finance", "Sales"], 2, 6)).toBe("Finance, Sales. 2 of 6 items carry a perspective.");
  });
  it("writes the closing summary", () => {
    expect(BUILD_CARD_COPY.closing.summary({ closingQuestion: null, missingForm: true })).toBe("No closing question. Asks for missing items. Confidence always on.");
    expect(BUILD_CARD_COPY.closing.summary({ closingQuestion: "What is missing?", missingForm: false })).toBe("A closing question. Does not ask for missing items. Confidence always on.");
  });
  it("writes the fields count and summary", () => {
    expect(BUILD_CARD_COPY.fields.count(1)).toBe("1 field");
    expect(BUILD_CARD_COPY.fields.count(2)).toBe("2 fields");
    expect(BUILD_CARD_COPY.fields.summary([{ label: "Name", mandatory: true }, { label: "Role", mandatory: true }])).toBe("Name and Role. Both required.");
    expect(BUILD_CARD_COPY.fields.summary([{ label: "Name", mandatory: true }, { label: "Role", mandatory: true }, { label: "Team", mandatory: false }])).toBe("Name, Role and Team. 2 of 3 required.");
    expect(BUILD_CARD_COPY.fields.summary([{ label: "Name", mandatory: true }])).toBe("Name. Required.");
    expect(BUILD_CARD_COPY.fields.summary([{ label: "Name", mandatory: false }])).toBe("Name. Optional.");
    expect(BUILD_CARD_COPY.fields.summary([{ label: "Name", mandatory: true }, { label: "Role", mandatory: true }, { label: "Team", mandatory: true }])).toBe("Name, Role and Team. All required.");
    expect(BUILD_CARD_COPY.fields.summary([{ label: "Name", mandatory: false }, { label: "Role", mandatory: false }])).toBe("Name and Role. All optional.");
  });
});
