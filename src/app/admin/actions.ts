"use server";
// The Launch button and its reverse (stories/E2-7, decision 0068): the admin check, then the
// product's row inside audited() (E14-1), so the audit log says who pressed it and when. A
// press on a product already in that state is recorded as refused. Copy: src/lib/admin-copy.ts.
import { revalidatePath } from "next/cache";
import { audited, launchProduct, takeBackProduct } from "@/db/queries/admin";
import { requireAdmin } from "@/lib/admin";
import { ADMIN_COPY as C } from "@/lib/admin-copy";
import { log } from "@/lib/log";
import type { AdminActionState } from "./confirm-form";

export async function launchAction(): Promise<AdminActionState> {
  const { proof, session } = await requireAdmin();
  try {
    const result = await audited(proof, { action: "product_launched" }, async () => launchProduct(proof, session.user.id));
    if (result === null) return { error: C.launch.already, done: null };
    revalidatePath("/", "layout");
    return { error: null, done: C.launch.done(result.trials) };
  } catch (error) {
    log("error", "admin:launch failed.", { error: error instanceof Error ? error.message : String(error) });
    return { error: C.launch.failed, done: null };
  }
}

export async function takeBackAction(): Promise<AdminActionState> {
  const { proof } = await requireAdmin();
  try {
    const done = await audited(proof, { action: "product_taken_back" }, async () => ((await takeBackProduct(proof)) ? true : { error: C.launch.notLaunched }));
    if (done !== true) return { error: done.error, done: null };
    revalidatePath("/", "layout");
    return { error: null, done: C.launch.doneTakeBack };
  } catch (error) {
    log("error", "admin:take back failed.", { error: error instanceof Error ? error.message : String(error) });
    return { error: C.launch.failed, done: null };
  }
}
