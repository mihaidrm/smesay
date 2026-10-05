// Database client. One connection pool per process, built from DATABASE_URL.
// drizzle(client) with a postgres-js client: node_modules/drizzle-orm/postgres-js/driver.d.ts.
// postgres(url): node_modules/postgres/types/index.d.ts.
import { AsyncLocalStorage } from "node:async_hooks";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.");
}

// Under Vitest (it sets VITEST=true: vitest.dev/guide/environment) the client refuses any
// database whose name does not end in _test, so no test can reach a development database even
// without src/db/test-db.ts.
if (process.env.VITEST && !new URL(url).pathname.endsWith("_test")) {
  throw new Error(`Tests only run against a database named *_test, not ${new URL(url).pathname.slice(1)} (vitest.config.mts derives it).`);
}

const client = postgres(url);
const base = drizzle(client, { schema });
type Db = typeof base;
type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

// One transaction around helpers that know nothing of it (stories/E14-1, acceptance 3: an admin
// action and its audit row commit together or not at all, and the action runs through the
// product's own helpers, E14-2 acceptance 4). Inside inTransaction(), every use of `db` goes to
// the open transaction (AsyncLocalStorage: nodejs.org/api/async_context.html); a nested
// db.transaction() becomes a savepoint (PgTransaction.transaction,
// node_modules/drizzle-orm/pg-core/session.d.ts). Once the transaction ends, `open` turns false,
// so work scheduled from inside it (after()) uses the pool again.
const current = new AsyncLocalStorage<{ tx: Tx; open: boolean }>();

export const db: Db = new Proxy(base, {
  get(target, prop) {
    const store = current.getStore();
    const from = store?.open ? (store.tx as unknown as Db) : target;
    const value = Reflect.get(from, prop, from);
    // Methods (select, insert, transaction) are bound to the client they came from. A function
    // held as the client's own property is returned as it is: $client is postgres.js's sql
    // function, whose own properties (listen, json) a bound copy would lose.
    return typeof value === "function" && !Object.hasOwn(from, prop) ? value.bind(from) : value;
  },
});

export async function inTransaction<T>(fn: () => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => {
    const store = { tx, open: true };
    try {
      return await current.run(store, fn);
    } finally {
      store.open = false;
    }
  });
}
