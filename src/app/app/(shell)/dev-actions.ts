"use server";
// The developer menu's write (stories/E4-8, acceptance 1): the AI mode into the cookie
// smesay-ai-mode, for a year, httpOnly and SameSite Lax, then the shell reloads so the menu,
// the project header's pill and the next run read it. A cookie is set in a Server Function
// only (node_modules/next/dist/docs/01-app/03-api-reference/04-functions/cookies.md,
// "Setting a cookie"). Refused when the menu is off (a production build without
// SMESAY_DEV_MENU), so a crafted request cannot move the product's AI, and when the value is
// not one of the three modes. The session is checked as for every write (E14-4: an admin's
// view changes nothing).
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { AI_MODE_COOKIE, AI_MODE_COOKIE_SECONDS, devMenuOn, isAiMode } from "@/lib/ai/mode-rules";
import { requireWritableWorkspace } from "@/lib/current-workspace";

export async function setAiModeAction(mode: string): Promise<void> {
  await requireWritableWorkspace("/app");
  if (!devMenuOn() || !isAiMode(mode)) return;
  (await cookies()).set(AI_MODE_COOKIE, mode, { path: "/", httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: AI_MODE_COOKIE_SECONDS });
  revalidatePath("/app", "layout");
}
