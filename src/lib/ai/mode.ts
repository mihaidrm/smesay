// Where an AI call goes (stories/E4-8): the real model, the stand-in in the process
// (src/lib/ai/stand-in.ts), or nowhere. The developer menu in the sidebar sets the cookie
// (src/app/app/(shell)/dev-actions.ts); runModel reads it here. The rules are in
// src/lib/ai/mode-rules.ts (no import, for the client component); this module reads the
// request's cookie with next/headers cookies() (node_modules/next/dist/docs/01-app/
// 03-api-reference/04-functions/cookies.md: read in a Server Component or a Server
// Function), so only server code imports it.
import { cookies } from "next/headers";
import { AI_MODE_COOKIE, devMenuOn, modeFrom, type AiMode, type ModeEnv } from "./mode-rules";

export { AI_MODES, AI_MODE_COOKIE, AI_MODE_COOKIE_SECONDS, devMenuOn, isAiMode, modeFrom, type AiMode, type ModeEnv } from "./mode-rules";

// The mode of the request in hand. Outside a request (a script, a unit test) cookies()
// throws ("called outside a request scope"), and the mode is the environment's default.
export async function aiMode(env: ModeEnv = process.env): Promise<AiMode> {
  if (!devMenuOn(env)) return "real";
  let value: string | undefined;
  try {
    value = (await cookies()).get(AI_MODE_COOKIE)?.value;
  } catch {
    value = undefined;
  }
  return modeFrom(value, env);
}
