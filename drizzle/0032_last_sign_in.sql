ALTER TABLE "user" ADD COLUMN "last_sign_in_at" timestamp;--> statement-breakpoint
-- E14-3: the last sign-in of the sessions still kept; one that signed out before this shows none.
UPDATE "user" SET "last_sign_in_at" = (SELECT max("created_at") FROM "session" WHERE "session"."user_id" = "user"."id");