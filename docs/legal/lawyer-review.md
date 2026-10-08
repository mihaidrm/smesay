# Legal pages: the review sheet for the lawyer, 2026-10-05

Mihai, 2026-10-07: "lawyer check all items and he approved so you can remove the tags for
lawyer to check". Version 3 of the four pages removes the 42 check markers (decision 0059).
This sheet stays as the record of what was checked and why. The three company details were
filled in on 2026-10-08 (version 4) from the certificate of registration Mihai sent (ONRC
Bucharest, series B no. 5002112, issued 23.09.2024): the registered seat, the trade register
number J2024022790002 and the fiscal code 50556917. Left for the lawyer: the identity paragraph
of E5-7, written after his read, and two terms paragraphs changed on 2026-10-08 (L24, L28).

Mihai, 2026-10-05: "i think you should first do a version when you put everything with what you
find online as guidance - and he will check those final things - i think you can put everything
except the company details" (decision 0054).

Version 2 of the four pages (docs/legal/privacy.md, terms.md, dpa.md, subprocessors.md) puts a
proposed value everywhere the lawyer had a question, except the company details (registered
address, registration number, fiscal code), which stay as markers. Each proposed value carries
a check marker with its number; the line below with the same number gives the proposal, the
source and the reason. Sources were read on 2026-10-05; where a page shows its own date it is
given. These are proposals from public sources, not legal advice. "Judgement" marks a value no
source sets.

The code does what the pages promise where a period is stated: the hourly job (npm run
jobs:purge) deletes ended sessions and expired sign-in links, usage events after 13 months and
admin log entries after 12 months, and the in-memory counts are swept every 10 minutes
(src/lib/workspace-removal.ts, src/lib/ratelimit.ts). The backup window, the Vercel region and
the hosting plans are set at the launch gate (docs/review-list.md).

## Privacy policy

- L1 The policy as a whole against the GDPR and Romanian Law 190/2018. Proposal: as written.
- L2 No data protection officer. GDPR Art. 37(1) requires one only for public authorities,
  large-scale regular and systematic monitoring, or large-scale special-category or criminal
  data (gdpr-info.eu/art-37-gdpr); WP243 rev.01, endorsed by the EDPB, recommends documenting
  the analysis (ec.europa.eu/newsroom/just/document.cfm?doc_id=44100, 2017-10-30). Law 190/2018
  Art. 4(2) adds a DPO when national identification numbers are processed on legitimate
  interest; SMEsay asks for none, and the DPA forbids customers to ask for them. Proposal: no
  DPO, hello@smesay.app as the privacy contact, and this paragraph as the dated note of the
  analysis.
- L3 Alerty controller for accounts, processor for respondents' answers. GDPR Art. 28; as
  written.
- L4 Usage record: legitimate interest (Art. 6(1)(f)), 13 months. CNIL caps audience-
  measurement data at 25 months and trackers at 13 (cnil.fr, audience measurement page, 2025-07-
  04). Proposal: 13 months, enough for a year-on-year comparison. The code deletes at 13 months.
- L5 Sessions deleted within an hour after they end. No source sets a number; DeployHQ and
  37signals keep login IPs while the account exists (deployhq.com/privacy.md; 37signals.com/
  policies/privacy, 2026-09-16). Judgement: delete at once (the hourly job), shorter than both;
  admin actions are in the admin log (L16).
- L6 In-memory counts for rate limiting: legitimate interest in security (Recital 49 names
  stopping attacks, gdpr-info.eu/recitals/no-49); storage limitation (Art. 5(1)(e)). No source
  sets a number. The code removes a count at most 10 minutes after its window ends (sign-in:
  24 hours after the last attempt). Proposal: state those periods.
- L7 The sample at /sample stores nothing on the server. As written.
- L8 Support emails: Art. 6(1)(b) or (f), answering the visitor's request; 24 months after the
  last message. Judgement (no source sets a number); 37signals keeps support correspondence with
  no stated limit.
- L9 Anthropic: "Anthropic may not train models on Customer Content" (anthropic.com/legal/
  commercial-terms, effective 2025-06-17); inputs and outputs deleted "within 30 days", flagged
  data kept up to 2 years (privacy.claude.com, How long do you store my organization's data,
  2026-07-01). Sources differ: the API docs say content "is not retained by default" except for
  some models (platform.claude.com, API and data retention). At rest data is in the US ("'us' is
  the only available workspace geo", platform.claude.com, data residency). Transfers under the
  SCCs in Anthropic's DPA (anthropic.com/legal/data-processing-addendum, effective 2025-02-24);
  Anthropic's participation in the Data Privacy Framework was not found. Proposal: as written.
- L10 Transfers: Vercel, Neon (Databricks), Cloudflare, Resend and Google state they take part
  in the EU-US Data Privacy Framework (their own privacy notices and DPAs; the official list at
  dataprivacyframework.gov could not be opened from the session: unverified); all use the 2021
  SCCs in their DPAs. Resend: "All account data, including email metadata, logs, and API records,
  is stored in the United States" (resend.com/docs/dashboard/domains/regions). Version 1 said
  Resend was in the EU; that was wrong. Proposal: as written.
- L11 Host request logs: Vercel keeps runtime logs 1 day on Pro, 30 days with Observability Plus
  (vercel.com/docs/logs/runtime, 2026-08-28). Proposal: as written.
- L12 Account deletion on request within one month: Art. 12(3) and Art. 17. As written.
- L13 Workspace removal within 24 hours: the job runs hourly from launch (E11-2). As written.
- L14 Backups 7 days: Neon's history window is 1 day by default and up to 7 days on the Launch
  plan, 30 on Scale (neon.com/docs/introduction/history-window). Proposal: 7 days on a paid plan,
  set at the launch gate.
- L15 Respondents' answers: no fixed maximum; the customer, as controller, sets the period and
  must tell respondents (Art. 13(2)(a), "or if that is not possible, the criteria"); the
  processor deletes at the end (Art. 28(3)(g)). No source requires a processor to set a maximum.
- L16 Admin log 12 months: CNIL recommends keeping access logs "pour une durée comprise entre
  six mois et un an" (cnil.fr, recommandation journalisation, 2021-11-18); GitHub keeps its
  organisation audit log 180 days. Proposal: 12 months. The code deletes at 12 months.
- L17 Error reports and visit counts: nothing is switched on. When Plausible is switched on at
  launch, this section names it (no cookies, the hashed IP with a salt deleted every 24 hours,
  plausible.io/data-policy) and the question of consent is the lawyer's.
- L18 Rights: one month, extendable by two (Art. 12(3), gdpr-info.eu/art-12-gdpr). ANSPDCP's
  name, address and email from dataprotection.ro (contact page).

## Terms of service

- L20 Business users only. Rome I Art. 6 and Brussels I bis Art. 17 to 19 protect consumers;
  a B2B service is outside them.
- L21 30 days' email notice before the free plan is limited. Judgement in line with L27.
- L22 The customer's duties towards respondents: lawful basis, information (Art. 13), no
  special categories. As written.
- L23 Suspension: notice and a reasonable time to fix, except harm that cannot wait. Judgement.
- L24 Liability: the greater of 12 months of fees and EUR 100; no indirect loss. Atlassian caps
  at 12 months of fees and US$100 for free products (atlassian.com/legal/atlassian-customer-
  agreement, effective 2026-10-01); Linear 12 months with carve-outs for gross negligence and
  wilful misconduct (linear.app/terms, 2026-06-09); Vercel the greater of US$100 and 6 months
  (vercel.com/legal/terms, 2026-06-01). Romanian Civil Code art. 1355: liability for intent or
  gross negligence ("cu intenţie sau din culpă gravă") cannot be excluded or limited, nor for
  injury to the person (codulcivil.ro/art-1355). Open question: art. 1203 says standard clauses
  limiting liability, allowing unilateral termination or suspension, and choosing the law or the
  court take effect only if "acceptate, în mod expres, în scris" (codulcivil.ro/art-1203). How
  to meet that online (for example a separate box at sign-up naming those clauses) is for the
  lawyer; SMEsay's sign-in has no such box today.
  Changed 2026-10-08 (Mihai: "remove the 100 euro part - they can only claim what they paid.
  the free tier si free but they accept they cannot claim anything while using free"): the cap
  is the fees paid in the 12 months before the event, and nothing on the free plan; the EUR 100
  floor goes. A cap of nothing on a free service reads as an exclusion, which art. 1355 allows
  only outside intent, gross negligence and injury (the first liability paragraph keeps those
  out); the marker asks the lawyer to confirm.
- L25 Ending the service: 60 days' email notice, then at least 30 days to export. Vercel gives
  30 days on paid plans (vercel.com/legal/terms). The EU Data Act, applying from 2025-09-12,
  sets at least 30 days for data retrieval on switching (Regulation 2023/2854 Art. 25(2)(g),
  eur-lex.europa.eu); whether a free beta is exempt under Art. 31(2) is for the lawyer.
- L26 Romanian law (Rome I Art. 3(1)) and the courts of Bucharest (Brussels I bis Art. 25;
  an electronic agreement with a durable record counts as writing). If Alerty's registered seat
  is not in Bucharest, the courts of the seat. Also an art. 1203 clause (L24).
- L27 Changes: 30 days' notice by email and in the app; Linear, GitHub and Atlassian give 30
  days (linear.app/terms; docs.github.com, GitHub terms, effective 2026-04-27; Atlassian above).
  A changed art. 1203 clause may need a new express acceptance.
- L28 Free trial, added 2026-10-08 (Mihai: "we will probably add a free trial - if that free
  trial passes, and they start paying it means they accepted everything"): during the trial
  the free plan's terms apply; paying after it is acceptance of every section. This is the
  art. 1203 question of L24: whether paying after a trial counts as express written acceptance
  of the liability, suspension, law and court clauses, or what the checkout must show, is the
  marker's question to the lawyer. No plan has a trial yet; the paragraph is there so the
  terms need no new version when one starts.

## Data processing agreement

- L30 Accepted with the terms, a signed copy on request: Art. 28(9) allows "electronic form";
  EDPB Guidelines 07/2020 recommend signatures in line with national law (edpb.europa.eu,
  guidelines 07/2020 v2.1). Vercel, Atlassian, Linear and Cloudflare incorporate their DPAs;
  Plausible: "Use of the service constitutes acceptance of this DPA" (plausible.io/dpa).
- L31 Confidentiality in writing in each employment or service contract: Art. 28(3)(b). As
  written; Alerty must have those clauses.
- L32 Subprocessor changes: 30 days' notice, objection within it, termination with a refund.
  Atlassian 30 days; Linear 30 days (linear.app/dpa, 2025-05-31); Cloudflare 30 days with a
  10-day objection (cloudflare.com/cloudflare-customer-dpa, v6.4, 2026-04-03); Anthropic 15;
  Resend 14; Vercel 5. Art. 28(2); EDPB 07/2020: the period "needs to be reasonable".
- L33 Breach: 48 hours. Art. 33(2) "without undue delay"; Anthropic "within 48 hours"
  (anthropic.com DPA), Plausible "no later than 48 hours" (plausible.io/dpa), Atlassian 72 hours
  where feasible. 48 leaves the customer room inside its own 72 (Art. 33(1)).
- L34 Deletion at the end: within 24 hours, backups 7 days later (L13, L14). Notion deletes
  after 30 days (notion.com/help/gdpr-at-notion); SMEsay's period is shorter.
- L35 Audits: written answers first, then at most once in 12 months with 30 days' notice at
  the customer's cost, more after a breach or when a regulator requires. Art. 28(3)(h);
  Atlassian, Linear and Cloudflare use the same pattern. SMEsay has no SOC 2 report to offer.
- L36 Encryption at rest by the providers: not checked in the providers' documents in this
  pass (unverified); to confirm from Neon's, Cloudflare R2's and Vercel's security pages at the
  launch gate.
- L37 Backups: Neon's point-in-time restore over 7 days (L14), and the restore test of
  docs/runbooks/backup-restore.md.
- L38 Logs: the app's log (src/lib/log.ts) writes ids and counts, never names, emails or
  answers; the host's request logs as L11.
- L39 Transfers: as L9 and L10.

## Subprocessors

- L40 The page, with 30 days' notice of changes (L32).
- L41 Anthropic's contracting entity for the EEA: "Anthropic Ireland, Limited if Customer
  resides in the European Economic Area" (anthropic.com/legal/commercial-terms); processing in
  the US (L9).
- L42 The others: Vercel Inc. (DPF self-declared, vercel.com/legal/privacy-notice, 2026-06-01;
  functions default to Washington D.C. and are set to Frankfurt at the launch gate,
  vercel.com/docs/functions/configuring-functions/region); Neon, now owned by Databricks
  ("Databricks, Inc., the parent company of Neon, LLC", neon.com/terms-of-service, 2026-08-05);
  Cloudflare, Inc. (R2's EU jurisdiction is chosen when the bucket is made and cannot change,
  developers.cloudflare.com/r2/reference/data-location); Resend is Plus Five Five, Inc.
  (resend.com/legal/dpa, 2025-12-31); Plausible Insights OÜ, Tartu, Estonia, hosted in Germany
  (plausible.io/privacy). Google is not a subprocessor: the Google APIs terms make it a separate
  controller (developers.google.com/terms), Google Ireland Limited for EEA users
  (policies.google.com/privacy, effective 2026-10-01).

## Still the lawyer's to fill

- The registered address, the registration number and the fiscal code (three places): filled in
  on 2026-10-08, version 4, from the certificate of registration.
- How to meet Civil Code art. 1203 online (L24, L26, L27).
- Whether the free beta is a "non-production version" under the Data Act (L25).
- Consent for visit counts when Plausible is switched on (L17).
