ALTER TABLE "workspace" ALTER COLUMN "ai_budget_eur" SET DEFAULT 10;
--> statement-breakpoint
UPDATE "workspace" SET "ai_budget_eur" = 10 WHERE "ai_budget_eur" = 50;
