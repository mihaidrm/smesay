import { describe, expect, it } from "vitest";
import { attemptLabel, isMissingBrowser, launchPlan, launchWith, NoBrowserError, RENDER_TIMEOUT_MS, type LaunchOptions } from "./pdf";

describe("launchPlan", () => {
  it("tries the given path first, then Playwright's download, then Chrome and Edge", () => {
    expect(launchPlan({ PLAYWRIGHT_CHROMIUM_PATH: "/opt/chrome" })).toEqual([
      { kind: "path", path: "/opt/chrome" }, { kind: "download" }, { kind: "channel", channel: "chrome" }, { kind: "channel", channel: "msedge" },
    ]);
  });
  it("skips the path when the variable is unset or blank", () => {
    expect(launchPlan({})).toEqual([{ kind: "download" }, { kind: "channel", channel: "chrome" }, { kind: "channel", channel: "msedge" }]);
    expect(launchPlan({ PLAYWRIGHT_CHROMIUM_PATH: "  " })[0]).toEqual({ kind: "download" });
  });
  it("names each attempt for the log", () => {
    expect(launchPlan({ PLAYWRIGHT_CHROMIUM_PATH: "/opt/chrome" }).map(attemptLabel)).toEqual(["PLAYWRIGHT_CHROMIUM_PATH", "Playwright's Chromium", "Google Chrome", "Microsoft Edge"]);
  });
});

describe("isMissingBrowser", () => {
  it("reads Playwright's two sentences for a browser that is not there", () => {
    expect(isMissingBrowser(new Error("browserType.launch: Executable doesn't exist at /x/chrome-headless-shell\n╔══╗"))).toBe(true);
    expect(isMissingBrowser(new Error("browserType.launch: Chromium distribution 'chrome' is not found at /opt/google/chrome/chrome"))).toBe(true);
  });
  it("leaves any other failure alone", () => {
    expect(isMissingBrowser(new Error("browserType.launch: Timeout 60000ms exceeded."))).toBe(false);
    expect(isMissingBrowser("ENOMEM")).toBe(false);
  });
});

describe("launchWith", () => {
  const missing = (what: string) => new Error(`browserType.launch: Executable doesn't exist at ${what}`);
  it("moves past a missing browser and returns the first that launches", async () => {
    const seen: LaunchOptions[] = [];
    const browser = await launchWith(async (o) => { seen.push(o); if (o.channel !== "chrome") throw missing(o.executablePath ?? "download"); return "chrome-browser"; }, { PLAYWRIGHT_CHROMIUM_PATH: "/opt/chrome" });
    expect(browser).toBe("chrome-browser");
    expect(seen).toEqual([{ executablePath: "/opt/chrome", timeout: RENDER_TIMEOUT_MS }, { timeout: RENDER_TIMEOUT_MS }, { channel: "chrome", timeout: RENDER_TIMEOUT_MS }]);
  });
  it("throws NoBrowserError naming every attempt when none is there", async () => {
    await expect(launchWith(async (o) => { throw o.channel ? new Error(`Chromium distribution '${o.channel}' is not found at /x`) : missing("/y"); }, {})).rejects.toMatchObject({ name: "NoBrowserError", tried: ["Playwright's Chromium", "Google Chrome", "Microsoft Edge"] });
  });
  it("throws any other failure as it is, without trying the next", async () => {
    let calls = 0;
    await expect(launchWith(async () => { calls += 1; throw new Error("browserType.launch: Timeout 60000ms exceeded."); }, {})).rejects.toThrow("Timeout 60000ms exceeded");
    expect(calls).toBe(1);
  });
});

describe("NoBrowserError", () => {
  it("names what was tried", () => {
    const e = new NoBrowserError(["Playwright's Chromium", "Google Chrome", "Microsoft Edge"]);
    expect(e.name).toBe("NoBrowserError");
    expect(e.message).toBe("No browser for the PDF summary. Tried: Playwright's Chromium, Google Chrome, Microsoft Edge.");
    expect(e.tried).toHaveLength(3);
  });
});
