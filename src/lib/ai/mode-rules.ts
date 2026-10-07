// The AI mode's rules (stories/E4-8): the three modes, the cookie's name, and when the
// developer menu is on and which mode a cookie value gives. No import, so the client
// component of the menu (src/components/app/dev-menu.tsx) can read the list; the cookie
// itself is read in src/lib/ai/mode.ts, which imports next/headers and stays server-side.
export const AI_MODES = ["standin", "real", "off"] as const;
export type AiMode = (typeof AI_MODES)[number];
export const AI_MODE_COOKIE = "smesay-ai-mode";
// A year: the choice is a developer's, kept until changed.
export const AI_MODE_COOKIE_SECONDS = 365 * 24 * 60 * 60;

export type ModeEnv = { NODE_ENV?: string; SMESAY_DEV_MENU?: string };

export const isAiMode = (value: unknown): value is AiMode => typeof value === "string" && (AI_MODES as readonly string[]).includes(value);

// The menu shows, and the cookie counts, outside a production build or when the variable
// asks for it (CI's Playwright run, playwright.config.ts). Never in production without it,
// so no visitor can turn the product's AI off or onto the stand-in.
export function devMenuOn(env: ModeEnv = process.env): boolean {
  return env.SMESAY_DEV_MENU === "1" || env.NODE_ENV !== "production";
}

// The mode for a cookie value, or none, under an environment: "real" without the menu; the
// cookie when it names a mode; else "standin" on a local checkout (NODE_ENV not
// "production"), so a fresh checkout spends nothing until the switch is moved, and "real" on
// CI's production build, which ANTHROPIC_BASE_URL points at the stand-in server.
export function modeFrom(cookie: string | undefined, env: ModeEnv = process.env): AiMode {
  if (!devMenuOn(env)) return "real";
  if (isAiMode(cookie)) return cookie;
  return env.NODE_ENV === "production" ? "real" : "standin";
}
