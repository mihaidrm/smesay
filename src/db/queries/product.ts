// The product's one row (stories/E2-7, decision 0068): whether Mihai has pressed Launch, when
// and who. Read on every AI call, every plan check, every shell render and every new
// workspace; written only by the admin's Launch and Take back buttons (src/app/admin/
// actions.ts). No workspace: the row is the product's, like better-auth's tables. The row is
// made on first read, so a fresh database starts as being built.
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { product, user } from "@/db/schema";

export type ProductState = { launchedAt: Date | null; launchedBy: string | null; launchedByEmail: string | null };

const ROW = 1;

export const productState = {
  get: async (): Promise<ProductState> => {
    const row = (await db.select({ launchedAt: product.launchedAt, launchedBy: product.launchedBy, email: user.email }).from(product).leftJoin(user, eq(user.id, product.launchedBy)).where(eq(product.id, ROW)))[0];
    if (row) return { launchedAt: row.launchedAt, launchedBy: row.launchedBy, launchedByEmail: row.email };
    await db.insert(product).values({ id: ROW }).onConflictDoNothing();
    return { launchedAt: null, launchedBy: null, launchedByEmail: null };
  },
  launched: async (): Promise<boolean> => (await productState.get()).launchedAt !== null,
  // Launch: sets the instant and the admin; false when already launched. Take back: clears
  // both; false when not launched. Each is one statement on the row's state, so two presses
  // at once count once.
  launch: async (userId: string, now = new Date()): Promise<boolean> => {
    await productState.get();
    const rows = await db.update(product).set({ launchedAt: now, launchedBy: userId }).where(eq(product.id, ROW)).returning({ at: product.launchedAt });
    return rows.length > 0;
  },
  takeBack: async (): Promise<boolean> => {
    await productState.get();
    const rows = await db.update(product).set({ launchedAt: null, launchedBy: null }).where(eq(product.id, ROW)).returning({ id: product.id });
    return rows.length > 0;
  },
};
