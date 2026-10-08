// readSession (stories/E2-1, changed 2026-10-08): better-auth's UNAUTHORIZED "Failed to get
// session" reads as signed out; every other error, better-auth's INTERNAL_SERVER_ERROR of the
// same message included, still throws, so a broken database is not mistaken for a sign-out.
import { APIError } from "better-auth/api";
import { describe, expect, it, vi } from "vitest";

const getSession = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: (...args: unknown[]) => getSession(...args) } } }));
vi.mock("next/headers", () => ({ headers: async () => new Headers({ cookie: "request" }) }));
vi.mock("next/navigation", () => ({ redirect: (to: string) => { throw new Error(`redirect:${to}`); } }));
const { readSession, requireSession, signedIn } = await import("./session");

describe("readSession", () => {
  it("returns the session, with the request's headers or the given ones", async () => {
    getSession.mockResolvedValueOnce({ user: { id: "u1" } });
    expect(await readSession()).toEqual({ user: { id: "u1" } });
    expect(getSession.mock.calls[0][0]).toMatchObject({ headers: expect.any(Headers) });
    expect((getSession.mock.calls[0][0] as { headers: Headers }).headers.get("cookie")).toBe("request");
    const own = new Headers({ cookie: "own" });
    getSession.mockResolvedValueOnce(null);
    expect(await readSession(own)).toBeNull();
    expect((getSession.mock.calls[1][0] as { headers: Headers }).headers).toBe(own);
  });
  it("reads better-auth's UNAUTHORIZED refusal as signed out", async () => {
    getSession.mockRejectedValueOnce(new APIError("UNAUTHORIZED", { message: "Failed to get session" }));
    expect(await readSession()).toBeNull();
    getSession.mockRejectedValueOnce(new APIError("UNAUTHORIZED", { message: "Failed to get session" }));
    await expect(requireSession("/app")).rejects.toThrow("redirect:/sign-in?next=%2Fapp");
    getSession.mockRejectedValueOnce(new APIError("UNAUTHORIZED", { message: "Failed to get session" }));
    expect(await signedIn()).toBe(false);
  });
  it("still throws every other error", async () => {
    getSession.mockRejectedValueOnce(new APIError("INTERNAL_SERVER_ERROR", { message: "Failed to get session" }));
    await expect(readSession()).rejects.toThrow("Failed to get session");
    getSession.mockRejectedValueOnce(new Error("connect ECONNREFUSED 127.0.0.1:5432"));
    await expect(readSession()).rejects.toThrow("ECONNREFUSED");
  });
});
