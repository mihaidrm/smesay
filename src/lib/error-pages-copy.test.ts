// The error pages' words (stories/E11-6, acceptance 1): the 500 line names the support address,
// the maintenance minutes come from MAINTENANCE_MINUTES or default to 30, and the maintenance page
// carries the line. The 404's scene (stories/E11-7): each rating gets the product's own answer
// kind and its line and pose, and every line is the one in docs/copy/errors.md.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { ERROR_PAGE_COPY, maintenanceMinutes, maintenancePage, NOT_FOUND_SCENE, SUPPORT_EMAIL } from "./error-pages-copy";
import { reactionFor, robotFor } from "@/components/not-found/lost-page";

describe("error pages copy", () => {
  it("names the support address in the 500 line and the minutes in maintenance", () => {
    expect(SUPPORT_EMAIL).toBe(process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "hello@smesay.app");
    expect(ERROR_PAGE_COPY.serverLine).toBe(`It has been logged. Try again in a minute; if it keeps failing, email ${SUPPORT_EMAIL}.`);
    expect(ERROR_PAGE_COPY.serverLineUnlogged).toBe(`Try again in a minute; if it keeps failing, email ${SUPPORT_EMAIL}.`);
    expect([maintenanceMinutes("15"), maintenanceMinutes(undefined), maintenanceMinutes("soon"), maintenanceMinutes("0")]).toEqual([15, 30, 30, 30]);
    expect(maintenancePage(15)).toContain("SMEsay is being updated and is back within 15 minutes. Respondent links keep their saved answers.");
  });
});

describe("the 404 scene", () => {
  it("classifies a rating of the missing page as the product does, Must proposed", () => {
    expect(["M", "S", "C", "W", "unclear"].map(reactionFor)).toEqual(["agree", "change", "change", "disagree", "unclear"]);
  });

  it("gives each rating its own line and pose", () => {
    expect(robotFor(null)).toEqual({ line: "The robot looked everywhere and found nothing to read.", pose: "reading" });
    expect(robotFor("M")).toEqual({ line: "Agreed, it is a must. It still does not exist. Your projects do.", pose: "hi" });
    expect(robotFor("S")).toEqual({ line: "A lower priority. Fair: it can wait, and your projects cannot.", pose: "idea" });
    expect(robotFor("C")).toEqual(robotFor("S"));
    expect(robotFor("W")).toEqual({ line: "Not needed. Then nothing is missing.", pose: "analysis" });
    expect(robotFor("unclear")).toEqual({ line: "Unclear to the robot too. Check the address for a typo.", pose: "reading" });
  });

  it("says in the page what docs/copy/errors.md says", () => {
    const doc = readFileSync("docs/copy/errors.md", "utf8");
    const lines = [NOT_FOUND_SCENE.lightsOff, NOT_FOUND_SCENE.cardTitle, NOT_FOUND_SCENE.cardLine, NOT_FOUND_SCENE.idle, NOT_FOUND_SCENE.notSaved, NOT_FOUND_SCENE.goBack, ...Object.values(NOT_FOUND_SCENE.reactions)];
    for (const line of lines) expect(doc, line).toContain(line);
  });
});

