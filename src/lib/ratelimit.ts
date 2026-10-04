// Rate limits (stories/E11-1). Two kinds, both in this process's memory (acceptance 4, decided
// 2026-10-04 and recorded in the story): the app runs as one instance from `docker compose up`
// with plain Postgres, and a count in memory costs no database write per request. A deploy with
// more than one instance needs a shared store (a table of buckets) instead; docs/review-list.md
// carries that for the launch gate. A restart clears the counts.
//
// - A window: at most `max` requests per key in a fixed window of `windowMs`; the respondent
//   routes take 100 a minute per address (SECURITY.md).
// - A backoff: `max` attempts per key in `windowMs`; the next one is refused for `baseMs`, and
//   each refusal period after that doubles while the key keeps hitting the limit; a key quiet
//   for `quietMs` starts again from `baseMs` (sign-in: 5 attempts, then one minute, two, four).
//
// Each store is capped at CAP keys: expired keys go first, then the oldest, so memory stays
// bounded whatever the traffic. Pure apart from the Maps: `now` comes from the caller, so a
// test drives the clock. No database import.

export const CAP = 50_000;

export type Verdict = { allowed: true } | { allowed: false; retryAfterMs: number };

type Slot = { count: number; until: number };

function trim<T>(map: Map<string, T>, expired: (v: T) => boolean): void {
  if (map.size < CAP) return;
  for (const [k, v] of map) if (expired(v)) map.delete(k);
  // Map keeps insertion order, so the first keys are the oldest.
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

export function backoffLimiter({ max, windowMs, baseMs, quietMs }: { max: number; windowMs: number; baseMs: number; quietMs: number }) {
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
        trim(tracks, (x) => x.blockedUntil <= now && now - x.lastAt >= quietMs);
        t = fresh(now);
        tracks.set(key, t);
      }
      if (t.windowUntil <= now) { t.count = 0; t.windowUntil = now + windowMs; }
      t.lastAt = now;
      t.count += 1;
      if (t.count <= max) return { allowed: true };
      const wait = baseMs * 2 ** t.strikes;
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

// The address a request came from: the first X-Forwarded-For entry (the host's proxy sets it;
// locally the tests send one), else "local", cut to 64 characters (as src/lib/link-access.ts).
// "local" is every request that came without the header, so it is never limited as one address:
// one bucket for all of them would let one visitor lock everyone out. Behind the host's proxy
// every request has the header (docs/review-list.md, launch gate).
export const LOCAL = "local";
export const addressOf = (headers: Headers) => (headers.get("x-forwarded-for") ?? LOCAL).split(",")[0].trim().slice(0, 64) || LOCAL;

// The limits of E11-1, one store each per process.
export const MINUTE = 60_000;
export const RESPONDENT_PER_MINUTE = 100;
export const SIGN_IN_ATTEMPTS = 5;
export const respondentLimit = windowLimiter({ max: RESPONDENT_PER_MINUTE, windowMs: MINUTE });
export const signInLimit = backoffLimiter({ max: SIGN_IN_ATTEMPTS, windowMs: 15 * MINUTE, baseMs: MINUTE, quietMs: 24 * 60 * MINUTE });
