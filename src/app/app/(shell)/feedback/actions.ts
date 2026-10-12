"use server";
// The feedback form's action (stories/E17-1, acceptance 2): the session gives the workspace
// and the person; src/lib/feedback.ts checks the fields, applies the hourly cap, writes the
// row and emails the admin addresses. A view (E14-4) is sent to the view-only page by
// requireWritableWorkspace, so an admin never files a report in someone's name.
import { revalidatePath } from "next/cache";
import { requireWritableWorkspace } from "@/lib/current-workspace";
import { sendReport } from "@/lib/feedback";
import { FEEDBACK_COPY as C } from "@/lib/feedback-copy";
import { log } from "@/lib/log";

export type FeedbackState = { error: string | null; sent: boolean };

export async function sendFeedbackAction(_previous: FeedbackState, formData: FormData): Promise<FeedbackState> {
  const { session, current } = await requireWritableWorkspace("/app/feedback");
  try {
    const result = await sendReport(
      { ws: current.ws, userId: session.user.id, senderEmail: session.user.email, workspaceName: current.workspace.name, origin: process.env.BETTER_AUTH_URL?.replace(/\/+$/, "") ?? null },
      { kind: formData.get("kind"), text: formData.get("text"), page: formData.get("page") },
    );
    if (!result.ok) return { error: result.error, sent: false };
    revalidatePath("/app/feedback");
    return { error: null, sent: true };
  } catch (error) {
    log("error", "feedback: the report was not saved.", { workspace: current.ws, error: error instanceof Error ? error.message : String(error) });
    return { error: C.errors.failed, sent: false };
  }
}
