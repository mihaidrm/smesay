// better-auth server instance. In E1 it exists so the Better Auth CLI can generate the user,
// session, account and verification tables (stories/E1-2); sign-in, providers and the route
// handler are E2. betterAuth from "better-auth", drizzleAdapter(db, { provider: "pg" }) from
// "better-auth/adapters/drizzle": better-auth.com/docs/installation and /docs/adapters/drizzle.
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as schema from "@/db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
});
