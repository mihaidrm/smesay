import { relations } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { pgTable, text, timestamp, boolean, index, uuid, jsonb } from "drizzle-orm/pg-core";
import type { GuideState, ResultsPrefs } from "./types";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  // E14-3: when the person last signed in, set by the session hook in src/lib/auth.ts; better-auth
  // deletes a session on sign-out, so the sessions alone cannot say it.
  lastSignInAt: timestamp("last_sign_in_at"),
  // E15-1: the guide's state for the person, every workspace (INTERFACES.md GuideState).
  guideState: jsonb("guide_state").$type<GuideState>().notNull().default(sql`'{"tipsOff": false, "dismissed": []}'::jsonb`),
  // E8-1: the person's choices on Results, per instrument (INTERFACES.md ResultsPrefs).
  resultsPrefs: jsonb("results_prefs").$type<ResultsPrefs>().notNull().default(sql`'{}'::jsonb`),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    // The workspace the person is working in (stories/E2-3, acceptance 4): a better-auth
    // additional field (src/lib/auth.ts), set only after a membership check and checked again
    // on every request, so no foreign key: a stale id is simply not current any more.
    currentWorkspaceId: uuid("current_workspace_id"),
    // An admin viewing a workspace as its owner sees it (stories/E14-4): the workspace and when
    // the view ends, set only by the admin's View as action (src/lib/view-as.ts) and honoured
    // only while the email is still an admin's. No foreign key, as current_workspace_id.
    viewAsWorkspaceId: uuid("view_as_workspace_id"),
    viewAsUntil: timestamp("view_as_until"),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));
