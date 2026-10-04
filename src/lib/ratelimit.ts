// Rate limits (stories/E11-1). Two kinds, both in this process's memory (acceptance 4, decided
// 2026-10-04 and recorded in the story): the app runs as one instance from `docker compose up`
// with plain Postgres, and a count in memory costs no database write per request. A deploy with
// more than one instance needs a shared store (a table of buckets) instead; docs/review-list.md
// carries that for the launch gate. A restart clears the counts.
//
// - A window: at most `max` requests per key in a fixed window of `windowMs`; the respondent
//   routes take 100 a minute per address (SECURITY.md).
// - A backoff: `max` attempts per key in `windowMs`; the next one is refused for `baseMs`, and
//   each refusal period after that doubles while the key keeps hitting the limit, up to `capMs`;
//   a key quiet for `quietMs` starts again from `baseMs` (sign-in: 5 attempts, then one minute,
//   two, four, up to an hour).
//
// Each store is capped at CAP keys: expired keys go first, then the oldest, so memory stays
// bounded whatever the traffic. Pure apart from the Maps: `now` comes from the caller, so a
// test drives the clock. No database import.

export const CAP = 50_000;

export type Verdict = { allowed: true } | { allowed: false; retryAfterMs: number };

type Slot = { count: number; until: number };

// The window's store: Map keeps insertion order, and an entry is set again when its window
// starts, so the oldest entries expire first: the trim walks from the front and stops at the first live entry, then
// drops the oldest while the store is still full. Cost per call: the entries it removes.
function trim<T>(map: Map<string, T>, expired: (v: T) => boolean): void {
  if (map.size < CAP) return;
  for (const [k, v] of map) {
    if (!expired(v)) break;
    map.delete(k);
  }
  for (const k of map.keys()) {
    if (map.size < CAP) break;
    map.delete(k);
  }
}

export function windowLimiter({ max, windowMs }: { max: number; windowMs: number }) {
  const slots = new Map<string, Slot>();
  return {
    // Counts one request for the key; refused once the window holds `max`.
    hit(key: string, now: number): Verdict {
      let slot = slots.get(key);
      if (!slot || slot.until <= now) {
        slots.delete(key);
        trim(slots, (s) => s.until <= now);
        slot = { count: 0, until: now + windowMs };
        slots.set(key, slot);
      }
      slot.count += 1;
      return slot.count <= max ? { allowed: true } : { allowed: false, retryAfterMs: slot.until - now };
    },
    size: () => slots.size,
    clear: () => slots.clear(),
  };
}

type Track = { count: number; windowUntil: number; blockedUntil: number; strikes: number; lastAt: number };

// The backoff's store changes entries in place, so its order is not expiry order: when full, it
// drops every quiet entry, then the oldest that is not blocked. A blocked key is never dropped,
// so filling the store cannot lift a block (and a blocked address counts nothing new,
// src/lib/auth.ts). If every entry is blocked the store grows past CAP, by blocked keys only.
function trimTracks(map: Map<string, Track>, now: number, quietMs: number): void {
  if (map.size < CAP) return;
  for (const [k, v] of map) if (v.blockedUntil <= now && now - v.lastAt >= quietMs) map.delete(k);
  for (const [k, v] of map) {
    if (map.size < CAP) break;
    if (v.blockedUntil <= now) map.delete(k);
  }
}

export function backoffLimiter({ max, windowMs, baseMs, quietMs, capMs }: { max: number; windowMs: number; baseMs: number; quietMs: number; capMs: number }) {
  const tracks = new Map<string, Track>();
  const fresh = (now: number): Track => ({ count: 0, windowUntil: now + windowMs, blockedUntil: 0, strikes: 0, lastAt: now });
  return {
    // Whether the key may try now, without counting.
    check(key: string, now: number): Verdict {
      const t = tracks.get(key);
      return t && t.blockedUntil > now ? { allowed: false, retryAfterMs: t.blockedUntil - now } : { allowed: true };
    },
    // Counts one attempt; past `max` in the window the key is refused for baseMs * 2^strikes.
    attempt(key: string, now: number): Verdict {
      let t = tracks.get(key);
      if (t && t.blockedUntil > now) return { allowed: false, retryAfterMs: t.blockedUntil - now };
      if (!t || now - t.lastAt >= quietMs) {
        tracks.delete(key);
        trimTracks(tracks, now, quietMs);
        t = fresh(now);
        tracks.set(key, t);
      }
      if (t.windowUntil <= now) { t.count = 0; t.windowUntil = now + windowMs; }
      t.lastAt = now;
      t.count += 1;
      if (t.count <= max) return { allowed: true };
      const wait = Math.min(capMs, baseMs * 2 ** t.strikes);
      t.strikes += 1;
      t.blockedUntil = now + wait;
      t.count = 0;
      t.windowUntil = t.blockedUntil + windowMs;
      return { allowed: false, retryAfterMs: wait };
    },
    size: () => tracks.size,
    clear: () => tracks.clear(),
  };
}

export const minutesOf = (ms: number) => Math.max(1, Math.ceil(ms / 60_000));

// The address a request came from: the last X-Forwarded-For entry, the one the host's proxy
// appended for the connection it received (developer.mozilla.org/docs/Web/HTTP/Reference/
// Headers/X-Forwarded-For, "Selecting an IP address": with one trusted proxy, the rightmost
// entry); the entries before it are the client's to choose. Cut to 64 characters. "local" is a
// request without the header: the app gets none when nothing stands in front of it, and Next's
// proxy does not see the connection's own address, so such a request is not limited by
// address (one "local" bucket would let one visitor lock out everyone). The launch gate puts a
// proxy in front (docs/review-list.md).
export const LOCAL = "local";
export const addressOf = (headers: Headers) => (headers.get("x-forwarded-for") ?? LOCAL).split(",").map((s) => s.trim()).filter(Boolean).at(-1)?.slice(0, 64) ?? LOCAL;

// The limits of E11-1, one store each per process.
export const MINUTE = 60_000;
export const RESPONDENT_PER_MINUTE = 100;
export const SIGN_IN_ATTEMPTS = 5;
export const respondentLimit = windowLimiter({ max: RESPONDENT_PER_MINUTE, windowMs: MINUTE });
export const signInLimit = backoffLimiter({ max: SIGN_IN_ATTEMPTS, windowMs: 15 * MINUTE, baseMs: MINUTE, quietMs: 24 * 60 * MINUTE, capMs: 60 * MINUTE });
