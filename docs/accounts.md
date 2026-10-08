# Accounts and money: what Mihai sets up

Written 2026-09-30. The account list and costs come from docs/business-plan.pdf (pages 7 and 8).
The click paths below are written from memory and were not checked against the live sites on
that date. Menu names move. If a screen does not match, tell Claude what you see.

## Read first: decision 0006, 2026-10-01

Nothing below is needed until the product is validated. Everything runs on Mihai's laptop
(localhost, Docker, a local mailbox for emails). Until the launch gate the only accounts are:
Node 22 (step 0), optionally a private repository on Mihai's personal GitHub (step 1, personal
account instead of an organisation), and an Anthropic Console account on Mihai's Gmail before E4
(step 9). The domain, Vercel, Neon, Resend, R2, Sentry, Plausible and the company switch all wait
for the launch gate. The steps stay here for that day.

## Ground rules

- You create every account and pay for everything. Claude never signs up, signs in or enters a card.
- Use one email address for all of them and turn on two-factor sign-in. Decided 2026-10-01:
  Mihai's personal Gmail and personal card are fine during the build. Before the first outside
  organisation uses the app (the R1 gate), switch the owner email on every account to an Alerty
  address, swap the card to the company card on Vercel, Anthropic, Cloudflare and Plausible, and
  put Alerty S.R.L. into the legal pages and the DPA. Two exceptions from day one: buy the domain
  in a Cloudflare account you will keep, and create GitHub as an organisation, not a personal
  account, because both are hard to move later.
- Keys and secrets go in two places only: the file `.env.local` in this folder, and the Vercel
  project settings. Never paste a key into the Claude chat, an email or a document.
- `.env.local` does not exist yet. Claude creates it empty during scaffolding (copied from
  `.env.example`). You open it in Notepad and paste each value after the `=` sign.
- When a step is done, tell Claude "step N done". Claude checks that the variable is present
  without printing it.

## What is needed when

| When | Step | Account | Cost |
|---|---|---|---|
| Now | 0 | Node 22 on this machine | Free |
| Now | 1 | GitHub organisation and repository | Free |
| After the name is decided | 2 | Cloudflare account and the domain | EUR 10 to 40 per year |
| Before E1 (foundation) | 3 | Neon (database) | Free to EUR 19 per month |
| Before E1 | 4 | Vercel (hosting) | Free to EUR 20 per month |
| Before E2 (sign-in) | 5 | Resend (email) | Free to EUR 20 per month |
| Before E2 | 6 | Google Cloud (Google sign-in) | Free |
| After launch | 7 | Microsoft Entra or Apple Developer (a second sign-in provider, decision 0034) | Free (Microsoft), USD 99 per year (Apple) |
| Before E3 (import) | 8 | Cloudflare R2 (file storage) | Free tier |
| Before E4 (AI) | 9 | Anthropic Console (API) | Usage, capped at EUR 10 per month (set 2026-10-02) |
| Before E11 (trust) | 10 | Sentry (error reports) | Free tier |
| Before E11 | 11 | Plausible (visits) | EUR 9 per month |
| Before launch | 12 | Lawyer review of legal pages | EUR 0 to 500 once |
| R2 and R3 | 13 | Atlassian, Notion, Stripe, container registry, SSO test tenant | Free, Stripe takes fees |

Nothing is needed for the prototype. Steps 0 and 1 are enough for Claude to start the scaffold.
Steps 3 to 9 can wait until the epic that uses them.

## Step 0. Node 22 (now)

This machine has Node v20.17.0. The plan asks for Node 22.

1. Open https://nodejs.org and download the Windows installer for version 22 (LTS).
2. Run it and accept the defaults. It replaces version 20.
3. Tell Claude. Claude runs `node --version` to confirm.

Git 2.40.0 and Docker 27.5.1 are already installed. Docker Desktop has to be running when Claude
starts the local database.

## Step 1. GitHub (now)

Purpose: the code lives here, and Vercel deploys from it.

1. Go to https://github.com and sign in, or sign up with the Alerty email.
2. Click your picture (top right), then "Your organizations", then "New organization".
3. Pick the Free plan. Name it after the company (for example `alerty`). Contact email: yours.
   Choose "A business or institution" and enter Alerty S.R.L.
4. Inside the organisation click "New repository". Name: leave a working name such as
   `validation-platform` (it can be renamed later). Visibility: Private. Do not tick "Add a README".
5. Copy the repository address from the page (it ends in `.git`) and send that address to
   Claude. An address is not a secret.
6. The first time Claude pushes, a browser window opens asking you to sign in to GitHub. Sign in
   yourself. Claude never sees the password.

Note: the plan asks for branch protection on `main`. On a Free organisation this may not be
available for private repositories (unverified). Skip it for now; Claude works on branches anyway.

## Step 2. Cloudflare and the domain (after the name is decided)

Purpose: the domain, its DNS records, and later file storage, all in one account.

1. Go to https://dash.cloudflare.com/sign-up and create an account.
2. In the left menu open "Domain Registration", then "Register Domains". Search for the name.
3. Buy it with your card. Cloudflare sells at cost, usually EUR 10 to 40 per year by ending.
   If the ending you want is not sold there, buy it at Namecheap and tell Claude; the DNS can
   still be moved to Cloudflare.
4. Turn on auto-renew.
5. Tell Claude the domain. Claude writes it into the docs and gives you the exact DNS records for
   steps 4 and 5 when they are needed.

## Step 3. Neon, the database (before E1)

1. Go to https://neon.tech and sign up with GitHub.
2. Create a project. Name: the product name. Region: AWS Europe (Frankfurt). Keep the default
   Postgres version.
3. The project starts with one branch (production). Create a second branch called `dev`.
4. On the dashboard click "Connect". Choose the `dev` branch. Copy the connection string (it
   starts with `postgresql://`).
5. Paste it in `.env.local` after `DATABASE_URL=`. The production string goes into Vercel in step 4.
6. At the launch gate, on a paid plan: "Settings", then the history window (restore window), set
   to 7 days. The privacy page and the DPA promise 7 days of backups (docs/legal/lawyer-review.md,
   L14; neon.com/docs/introduction/history-window).

Local development uses a Postgres in Docker, so this step is only needed for the deployed app.

## Step 4. Vercel, hosting (before E1)

1. Go to https://vercel.com and sign up with GitHub.
2. Create a team for Alerty. Vercel's free Hobby plan is for non-commercial use (unverified on
   2026-09-30). Recommended: stay on Hobby while nobody outside uses the app, move to Pro
   (about EUR 20 per month) before the first external user. This is a decision for you.
3. Click "Add New", then "Project", and import the GitHub repository from step 1. Vercel asks
   for access to the repository; approve it for that one repository only.
4. The region (Frankfurt, `fra1`) is set in the code: `vercel.json` has `"regions": ["fra1"]`
   (vercel.com/docs/functions/configuring-functions/region; functions run in Washington D.C.
   by default). You do not need to change it. Added 2026-10-05; this step said so before the
   file existed.
5. Open the project, then "Settings", then "Environment Variables". Paste each production value
   here as it becomes available (Claude gives you the list of names, never the values).
6. After step 2: "Settings", then "Domains", add the domain, and copy the DNS records Vercel
   shows into Cloudflare DNS.

## Step 5. Resend, email (before E2)

Purpose: magic-link sign-in emails, invites, reminders. Needs the domain from step 2.

1. Go to https://resend.com and sign up.
2. Open "Domains", click "Add Domain". Enter a mail subdomain, for example `mail.yourdomain`.
   Region: EU (Ireland). This is where mail is sent from; Resend keeps the account's records
   (addresses, subjects, delivery logs) in the United States
   (resend.com/docs/dashboard/domains/regions), as the privacy page says.
3. Resend shows DNS records (SPF, DKIM, and a suggested DMARC record). In Cloudflare open the
   domain, then "DNS", and add each record exactly as shown. Set the proxy switch to "DNS only".
4. Back in Resend click "Verify". It can take up to an hour.
5. Open "API Keys", click "Create API Key". Permission: "Sending access". Copy the key once.
6. Set `MAIL_SMTP_URL=smtps://resend:THE_KEY@smtp.resend.com:465` in `.env.local` and in the
   host's settings (resend.com/docs/send-with-smtp; the app sends over SMTP, stories/E2-1), and
   `EMAIL_FROM=` to an address on the mail subdomain, for example `sign-in@mail.yourdomain`.

## Step 6. Google sign-in (before E2)

1. Go to https://console.cloud.google.com and sign in with the Alerty Google account.
2. Create a project named after the product.
3. Open "APIs and Services", then the OAuth consent screen. User type: External. App name: the
   product name. Support email: yours. Scopes: email, profile, openid. Save.
4. Open "Credentials", click "Create Credentials", then "OAuth client ID". Type: Web application.
5. Under "Authorized redirect URIs" add two lines (the path is better-auth's callback route,
   confirmed on 2026-10-02 against node_modules/better-auth/dist/api/routes/callback.mjs and
   asserted by src/lib/auth.test.ts):
   - `http://localhost:3000/api/auth/callback/google`
   - `https://yourdomain/api/auth/callback/google`
6. Copy the Client ID and Client secret into `.env.local` after `GOOGLE_CLIENT_ID=` and
   `GOOGLE_CLIENT_SECRET=`.
7. Before launch, press "Publish app" on the consent screen so people outside your test list can
   sign in.

## Step 7. Microsoft or Apple sign-in (after launch, decision 0034)

1. Go to https://entra.microsoft.com and sign in with an account that belongs to a tenant: a
   work or school Microsoft 365 account with rights to register apps, or an account that has an
   Azure subscription (the free one at azure.microsoft.com/free asks for a phone number and a
   card for identity checks; Claude has not verified whether a tenant can be had without a
   card). A personal account alone gets "AADSTS50020 ... does not exist in tenant 'Microsoft
   Services'" (seen 2026-10-02) and cannot open the portal. R1 ships with Google only
   (decision 0034); this step is for the day an organisation asks for Microsoft. Apple sign-in
   needs the Apple Developer Program (USD 99 per year, developer.apple.com) and is not written
   up here yet.
2. Open "App registrations", click "New registration". Name: the product name.
3. Supported account types: "Accounts in any organizational directory and personal Microsoft
   accounts".
4. Redirect URI: platform "Web", value `http://localhost:3000/api/auth/callback/microsoft`.
   Add the production one later under "Authentication". Claude confirms the path in E2.
5. Register. Copy the "Application (client) ID" into `.env.local` after `MICROSOFT_CLIENT_ID=`.
6. Open "Certificates and secrets", click "New client secret", choose the longest expiry
   (24 months). Copy the Value (not the Secret ID) into `MICROSOFT_CLIENT_SECRET=`.
7. Put the expiry date in your calendar. Sign-in with Microsoft stops when the secret expires.

### Checking steps 6, 7 and 9 without showing a value

Put the same names and values into the repository as GitHub secrets (github.com, the
repository, Settings, "Secrets and variables", Actions, "New repository secret"). Then open
the Actions tab, pick "Secrets check" on the left, press "Run workflow". The run prints one
line per name, "set" or "missing", and never a value (.github/workflows/secrets-check.yml).
Claude can start the run and read the result; it cannot read the secrets themselves.

## Step 8. Cloudflare R2, file storage (before E3)

1. In the Cloudflare dashboard open "R2 Object Storage". Cloudflare asks for a card even on the
   free tier.
2. Click "Create bucket". Name: `uploads`. Location: choose the European Union jurisdiction.
   This cannot be changed after the bucket exists.
3. Open "Manage API tokens", create a token with "Object Read and Write" limited to this bucket.
4. Copy the Access Key ID, the Secret Access Key and the endpoint for the EU jurisdiction into
   `.env.local`: `S3_ACCESS_KEY_ID=`, `S3_SECRET_ACCESS_KEY=`, `S3_ENDPOINT=`, and set
   `S3_BUCKET=uploads`.

Local development uses RustFS in Docker (decision 0025), so this is only needed for the deployed app.

## Step 9. Anthropic Console, the AI (before E4)

This is separate from your Claude subscription. The subscription pays for Claude Code. The API
is billed per use.

1. Go to https://console.anthropic.com and sign up with your Gmail (the ground rules above:
   personal accounts until the launch gate; the Alerty email and organisation name come with
   the switch).
2. Open "Billing". Add a card and buy a small amount of credit (the minimum is a few euros).
   Leave auto-reload off.
3. Open "Limits" and set the monthly spend limit to EUR 10 (or the dollar equivalent). Done
   2026-10-02 at EUR 10. Put the same whole number in `.env.local` after
   `ANTHROPIC_MONTHLY_BUDGET_EUR=` (decision 0036): the app pauses the AI for the month at
   that number, before the Console does. Change both together.
4. Open "API keys", click "Create Key" (not "Identity federation": that is for cloud workloads
   with their own identity provider). Name it `validation-platform-dev`. Copy it once.
5. Paste it in `.env.local` after `ANTHROPIC_API_KEY=`. Create a second key for production and
   paste it into Vercel only.
6. Check it with one real call, yourself (decision 0039: Claude spends no money): `npm run
   ai:smoke` (stories/E4-1, acceptance 6). It needs a
   project of your own in any workspace (the seeded Marlow Group sample does not count), and
   prints the answer, the tokens, the cost in euro cents and the ai_run row id. A key or cap
   variable that is missing or wrong is named in the error.

## Step 10. Sentry, error reports (before E11)

1. Go to https://sentry.io/signup. On the sign-up form choose the data storage location
   "European Union". This cannot be changed later.
2. Create a project of type Next.js. Keep the DSN for the launch gate: it goes into the
   host's environment as `SENTRY_DSN=`, with `SENTRY_ENVIRONMENT=production`, not into
   `.env.local`. Locally it stays empty, so nothing is sent and no Sentry code loads (stories/
   E11-5, acceptance 4). With the DSN set, the server sends errors to Sentry with personal data
   removed; errors in the browser are not sent in R1.
3. Before the DSN is set anywhere, the privacy policy's "Error reports and visit counts" and the
   subprocessor list change to name Sentry (their markers say so). Then send one test error and
   read what arrived in Sentry.

## Step 11. Plausible, visit counts (before E11)

1. Go to https://plausible.io and start the trial. It has no free plan; about EUR 9 per month.
2. Add the site with the domain from step 2. Set `PLAUSIBLE_DOMAIN=` to that domain.
3. In the site's settings, General, Tracking, open the snippet and copy the `src` of its script
   tag (it starts with https://plausible.io/js/). Set `PLAUSIBLE_SCRIPT_SRC=` to it. Send Claude
   the whole snippet: the app renders the script tag only, and whether Plausible's current
   script needs the init line its documentation mentions is unverified (stories/E13-3,
   docs/review-list.md).
4. Add these goals as custom events: Start free, Try the sample, Sign up, First project, First
   validation published (renamed from First instrument published on 2026-10-05, decision
   0057).
5. Before the variables are set anywhere, the privacy policy's "Error reports and visit counts"
   changes to describe Plausible (its marker says what), and Plausible moves from "Planned for
   launch" to "In use" in the subprocessor list.

## Step 11b. Your admin address (any time)

Set `ADMIN_EMAILS=` in .env.local to the email you sign in with (several are comma separated),
and at the launch gate in the host's settings. /admin then shows you the Overview (E13-2);
everyone else, and everyone while it is empty, gets the 404 page.

## Step 11c. Your support address (any time)

Set `NEXT_PUBLIC_SUPPORT_EMAIL=` in .env.local to the inbox that should get visitors'
questions (decision 0049: your own address until the launch gate, then hello@smesay.app). The
landing page's "Ask us a question" bubble (E12-5) only shows when it is set, and the error
pages name it. Restart `npm run dev` after changing it, and at the launch gate set it before
the build: Next.js writes the value into the code, the server's included, when it builds it
(node_modules/next/dist/docs/01-app/02-guides/environment-variables.md, "Bundling Environment
Variables for the Browser"), so changing it on the host needs a new build.

## Step 12. Legal (before launch)

Done on 2026-10-07: the lawyer checked the 42 marked items of version 2 and approved them all
(decision 0059), and version 3 of docs/legal/privacy.md, terms.md, dpa.md and
subprocessors.md (stories/E11-3), shown at /legal/privacy, /legal/terms, /legal/dpa and
/legal/subprocessors, carries no check markers. `npm run legal:markers` lists what is left:
3 on 2026-10-07, the registered address, the registration number and the fiscal code, on the
privacy policy, the terms and the DPA.

Done on 2026-10-08: Mihai sent the certificate of registration and version 4 of the three
pages carries the registered seat, the trade register number and the fiscal code; `npm run
legal:markers` lists 0. The same address is the value of COMPANY_ADDRESS in .env.example for
pages carries the registered seat, the trade register number and the fiscal code. The same day
the terms changed twice more (Mihai): liability is capped at the fees paid in the 12 months
before the event, with nothing to claim on the free plan and no EUR 100 floor, and paying after
a free trial counts as accepting every section. `npm run legal:markers` lists 2, both on the
terms, for the lawyer (docs/legal/lawyer-review.md, L24 and L28). The same address is the value of COMPANY_ADDRESS in .env.example for
the emails' footer: set it on the host too (step 11). A paragraph written after the
lawyer's read (the identity levels of E5-7, in the anonymous responses pull request) keeps its
marker until the lawyer reads it.

## Step 13. Later phases

- R2: an Atlassian developer app (Jira import and write-back), Notion and Trello integration
  tokens. All free.
- R3: Stripe with Stripe Tax (Alerty verified as a business), a container registry for the
  self-host image, an SSO test tenant. Steps are written when R2 ends.

## One value you do not need an account for

`BETTER_AUTH_SECRET` is a random string. On your PC you generate it once with the command in
docs/setup.md and paste it into `.env.local`; Claude's own environment has a different one it
generated without showing it. You generate a third one for Vercel when Claude asks.

## Monthly cost

Until the first external user: EUR 0 plus the domain. With everything on: about EUR 30 to 60 per
month (Vercel Pro 20, Plausible 9, Anthropic usage, the rest on free tiers), matching the
"Hobby" column of the plan.
