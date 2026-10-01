# 0001 Stack, 2026-09-30

Decision: Next.js 15 + TypeScript + Tailwind + shadcn/ui; Postgres via Drizzle (Neon EU in SaaS,
plain Postgres in self-host); better-auth; server-sent events for live updates; S3-compatible
storage (R2 EU / MinIO); Resend; Anthropic API from server routes; Vercel fra1; Vitest and
Playwright.

Why: the product must be self-hostable later without a rewrite, so nothing on the critical path
may depend on a vendor-only feature (no hosted auth provider, no vendor realtime channel).

Consequence: slightly slower R1 than a Supabase-everything build; no R3 rewrite.
