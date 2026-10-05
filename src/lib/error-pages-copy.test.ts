// The error pages' words (stories/E11-6, acceptance 1): the 500 line names the support address,
// the maintenance minutes come from MAINTENANCE_MINUTES or default to 30, and the maintenance page
// carries the line.
import { describe, expect, it } from "vitest";
import { ERROR_PAGE_COPY, maintenanceMinutes, maintenancePage, SUPPORT_EMAIL } from "./error-pages-copy";

describe("error pages copy", () => {
  it("names the support address in the 500 line and the minutes in maintenance", () => {
    expect(SUPPORT_EMAIL).toBe(process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "hello@smesay.app");
    expect(ERROR_PAGE_COPY.serverLine).toBe(`It has been logged. Try again in a minute; if it keeps failing, email ${SUPPORT_EMAIL}.`);
    expect(ERROR_PAGE_COPY.serverLineUnlogged).toBe(`Try again in a minute; if it keeps failing, email ${SUPPORT_EMAIL}.`);
    expect([maintenanceMinutes("15"), maintenanceMinutes(undefined), maintenanceMinutes("soon"), maintenanceMinutes("0")]).toEqual([15, 30, 30, 30]);
    expect(maintenancePage(15)).toContain("SMEsay is being updated and is back within 15 minutes. Respondent links keep their saved answers.");
  });
});
