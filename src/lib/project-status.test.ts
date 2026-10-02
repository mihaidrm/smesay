import { describe, expect, it } from "vitest";
import { isLinkOpen, projectStatus } from "@/lib/project-status";

const now = new Date("2026-10-10T12:00:00Z");
const d = (s: string) => new Date(s);
const open = { opensAt: d("2026-10-06T06:00:00Z"), closesAt: d("2026-10-20T15:00:00Z"), revokedAt: null };

describe("projectStatus", () => {
  it("is Sample for the sample whatever its links", () => {
    expect(projectStatus({ isSample: true }, [open], now)).toBe("Sample");
  });
  it("is Draft with no link, Open with an open one, Closed otherwise", () => {
    expect(projectStatus({ isSample: false }, [], now)).toBe("Draft");
    expect(projectStatus({ isSample: false }, [open], now)).toBe("Open");
    expect(projectStatus({ isSample: false }, [{ ...open, revokedAt: d("2026-10-07T00:00:00Z") }], now)).toBe("Closed");
    expect(projectStatus({ isSample: false }, [{ ...open, closesAt: d("2026-10-09T00:00:00Z") }], now)).toBe("Closed");
    expect(projectStatus({ isSample: false }, [{ ...open, opensAt: d("2026-10-11T00:00:00Z") }], now)).toBe("Closed");
    expect(projectStatus({ isSample: false }, [{ ...open, revokedAt: d("2026-10-07T00:00:00Z") }, { opensAt: null, closesAt: null, revokedAt: null }], now)).toBe("Open");
  });
  it("treats a link with no dates as open and the close instant as closed", () => {
    expect(isLinkOpen({ opensAt: null, closesAt: null, revokedAt: null }, now)).toBe(true);
    expect(isLinkOpen({ opensAt: null, closesAt: now, revokedAt: null }, now)).toBe(false);
    expect(isLinkOpen({ opensAt: now, closesAt: null, revokedAt: null }, now)).toBe(true);
  });
});
