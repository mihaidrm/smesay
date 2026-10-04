// The limiters of E11-1 (acceptance 5): each driven past its threshold and across its window with
// a test clock; the stores stay under their cap.
import { describe, expect, it } from "vitest";
import { addressOf, backoffLimiter, CAP, minutesOf, windowLimiter } from "./ratelimit";

describe("windowLimiter", () => {
  it("takes max requests per key in a window, then refuses until the window ends", () => {
    const l = windowLimiter({ max: 100, windowMs: 60_000 });
    for (let i = 0; i < 100; i++) expect(l.hit("1.2.3.4", 1_000).allowed).toBe(true);
    expect(l.hit("1.2.3.4", 1_000)).toEqual({ allowed: false, retryAfterMs: 60_000 });
    expect(l.hit("1.2.3.4", 30_000)).toEqual({ allowed: false, retryAfterMs: 31_000 });
    expect(l.hit("5.6.7.8", 30_000).allowed).toBe(true);
    expect(l.hit("1.2.3.4", 61_000).allowed).toBe(true);
  });
  it("keeps at most CAP keys", () => {
    const l = windowLimiter({ max: 1, windowMs: 60_000 });
    for (let i = 0; i < CAP + 10; i++) l.hit(`k${i}`, 0);
    expect(l.size()).toBeLessThanOrEqual(CAP);
  });
});

describe("backoffLimiter", () => {
  const MIN = 60_000;
  it("takes 5 attempts, then waits one minute, two, four", () => {
    const l = backoffLimiter({ max: 5, windowMs: 15 * MIN, baseMs: MIN, quietMs: 24 * 60 * MIN, capMs: 60 * MIN });
    let t = 0;
    for (let i = 0; i < 5; i++) expect(l.attempt("email:a@b.c", t).allowed).toBe(true);
    expect(l.attempt("email:a@b.c", t)).toEqual({ allowed: false, retryAfterMs: MIN });
    expect(l.check("email:a@b.c", t + 30_000)).toEqual({ allowed: false, retryAfterMs: 30_000 });
    t += MIN;
    for (let i = 0; i < 5; i++) expect(l.attempt("email:a@b.c", t).allowed).toBe(true);
    expect(l.attempt("email:a@b.c", t)).toEqual({ allowed: false, retryAfterMs: 2 * MIN });
    t += 2 * MIN;
    for (let i = 0; i < 5; i++) l.attempt("email:a@b.c", t);
    expect(l.attempt("email:a@b.c", t)).toEqual({ allowed: false, retryAfterMs: 4 * MIN });
    // A day of quiet starts again from one minute.
    t += 24 * 60 * MIN;
    for (let i = 0; i < 5; i++) l.attempt("email:a@b.c", t);
    expect(l.attempt("email:a@b.c", t)).toEqual({ allowed: false, retryAfterMs: MIN });
  });
  it("never waits longer than the cap", () => {
    const l = backoffLimiter({ max: 5, windowMs: 15 * MIN, baseMs: MIN, quietMs: 24 * 60 * MIN, capMs: 60 * MIN });
    let t = 0; let last = 0;
    for (let round = 0; round < 10; round++) {
      for (let i = 0; i < 5; i++) l.attempt("k", t);
      const v = l.attempt("k", t);
      last = v.allowed ? 0 : v.retryAfterMs;
      t += last;
    }
    expect(last).toBe(60 * MIN);
  });
  it("keeps a blocked key when the store is full", () => {
    const l = backoffLimiter({ max: 1, windowMs: 15 * MIN, baseMs: MIN, quietMs: 24 * 60 * MIN, capMs: 60 * MIN });
    l.attempt("address:blocked", 0);
    expect(l.attempt("address:blocked", 0).allowed).toBe(false);
    for (let i = 0; i < CAP + 5; i++) l.attempt(`email:${i}@x`, 1);
    expect(l.check("address:blocked", 2).allowed).toBe(false);
    expect(l.size()).toBeLessThanOrEqual(CAP);
  });
  it("starts a new window of 5 when the old one ends without a block", () => {
    const l = backoffLimiter({ max: 5, windowMs: 15 * MIN, baseMs: MIN, quietMs: 24 * 60 * MIN, capMs: 60 * MIN });
    for (let i = 0; i < 5; i++) l.attempt("k", i * MIN);
    expect(l.attempt("k", 16 * MIN).allowed).toBe(true);
  });
});

describe("helpers", () => {
  it("reads the last forwarded address and rounds a wait up to whole minutes", () => {
    // The rightmost entry is the one the host's proxy added; the client chose the ones before.
    expect(addressOf(new Headers({ "x-forwarded-for": " 6.6.6.6 , 10.0.0.2" }))).toBe("10.0.0.2");
    expect(addressOf(new Headers({ "x-forwarded-for": "10.0.0.1" }))).toBe("10.0.0.1");
    expect(addressOf(new Headers())).toBe("local");
    expect([minutesOf(1), minutesOf(60_000), minutesOf(60_001)]).toEqual([1, 1, 2]);
  });
});
