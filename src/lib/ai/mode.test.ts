// The AI mode's rules (stories/E4-8, acceptance 1 and 2): when the developer menu is on,
// which mode a cookie value gives under each environment, and that aiMode() reads the
// request's cookie and falls back to the default outside a request. next/headers is mocked:
// the cookie store answers one value, or throws as Next does outside a request scope.
import { describe, expect, it, vi } from "vitest";

let cookieValue: string | undefined;
let outsideRequest = false;
vi.mock("next/headers", () => ({
  cookies: async () => {
    if (outsideRequest) throw new Error("`cookies` was called outside a request scope.");
    return { get: (name: string) => (name === "smesay-ai-mode" && cookieValue !== undefined ? { name, value: cookieValue } : undefined) };
  },
}));

const { AI_MODE_COOKIE, AI_MODES, aiMode, devMenuOn, isAiMode, modeFrom } = await import("./mode");

const local = { NODE_ENV: "development" };
const production = { NODE_ENV: "production" };
const ci = { NODE_ENV: "production", SMESAY_DEV_MENU: "1" };

describe("devMenuOn", () => {
  it("is on outside production, and in production only with SMESAY_DEV_MENU=1", () => {
    expect(devMenuOn(local)).toBe(true);
    expect(devMenuOn({ NODE_ENV: "test" })).toBe(true);
    expect(devMenuOn({})).toBe(true);
    expect(devMenuOn(production)).toBe(false);
    expect(devMenuOn({ NODE_ENV: "production", SMESAY_DEV_MENU: "true" })).toBe(false);
    expect(devMenuOn({ NODE_ENV: "production", SMESAY_DEV_MENU: "" })).toBe(false);
    expect(devMenuOn(ci)).toBe(true);
  });
});

describe("modeFrom", () => {
  it("names the cookie and the three modes", () => {
    expect(AI_MODE_COOKIE).toBe("smesay-ai-mode");
    expect([...AI_MODES]).toEqual(["standin", "real", "off"]);
    expect(isAiMode("off")).toBe(true);
    expect(isAiMode("Off")).toBe(false);
    expect(isAiMode(undefined)).toBe(false);
  });

  it("is always real without the menu, whatever the cookie says", () => {
    for (const cookie of [undefined, "standin", "off", "real", "nonsense"]) expect(modeFrom(cookie, production)).toBe("real");
  });

  it("follows a valid cookie when the menu is on", () => {
    for (const env of [local, ci]) for (const mode of AI_MODES) expect(modeFrom(mode, env)).toBe(mode);
  });

  it("defaults to the stand-in on a local checkout and to real on a production build with the menu", () => {
    expect(modeFrom(undefined, local)).toBe("standin");
    expect(modeFrom("nonsense", local)).toBe("standin");
    expect(modeFrom("", local)).toBe("standin");
    expect(modeFrom(undefined, ci)).toBe("real");
    expect(modeFrom("nonsense", ci)).toBe("real");
  });
});

describe("aiMode", () => {
  it("reads the request's cookie when the menu is on", async () => {
    outsideRequest = false;
    cookieValue = "off";
    expect(await aiMode(local)).toBe("off");
    expect(await aiMode(ci)).toBe("off");
    cookieValue = "standin";
    expect(await aiMode(ci)).toBe("standin");
    cookieValue = undefined;
    expect(await aiMode(local)).toBe("standin");
    expect(await aiMode(ci)).toBe("real");
  });

  it("never reads the cookie without the menu", async () => {
    outsideRequest = true;
    cookieValue = "off";
    expect(await aiMode(production)).toBe("real");
  });

  it("uses the default outside a request scope, where cookies() throws", async () => {
    outsideRequest = true;
    expect(await aiMode(local)).toBe("standin");
    expect(await aiMode(ci)).toBe("real");
  });
});
