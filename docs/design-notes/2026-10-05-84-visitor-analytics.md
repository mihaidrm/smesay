# Design note 84: visitor analytics, 2026-10-05

Made in the Claude Code cloud session of 2026-10-05 for stories/E13-3, under decision 0044.

## What was decided

- Two variables switch Plausible on: PLAUSIBLE_DOMAIN and PLAUSIBLE_SCRIPT_SRC. Plausible's
  current install is a script whose address is shown only in the site's settings
  (plausible.io/docs/plausible-script), so the app takes that address as given instead of
  building one; the address must be on plausible.io/js/. Whether the snippet also needs an
  init line could not be read from the public pages: the app renders the script tag only,
  and Mihai compares it with the snippet at the gate.
- The script is placed page by page (landing, sign-in, legal, the workspace step, the app
  shell), not in the root layout, so the respondent pages, the visitors' sample and the admin
  page never load it.
- Click goals use the documented plausible(name) call through a small link component, a plain
  link so that leaving for the visitors' sample is a full page load and the landing page's
  script does not keep running there (the audit found the client-side navigation carrying it);
  when the script has not loaded yet the goal waits for its load event. A respondent's links
  out (the privacy notice, the landing page) send no referrer, so a link token never reaches
  a page that counts visits. Sign up fires on the workspace step within 30 minutes of the
  account's creation. The two "first" goals are known only on the server, so they go to the
  Events API after the response, with the visitor's user agent and their address (the last
  X-Forwarded-For entry, which the host appends), and only when E13-1's event shows it was the
  workspace's first; with no address nothing is sent, since Plausible would drop it.
- Respondent pages' policy never allows plausible.io in connect-src.
- The source: utm_source only, cleaned to a short token, carried as a query parameter through
  sign-in and the magic link's callback to the workspace step, with no cookie, and stored once
  on the workspace. The admin page (E13-2) shows it.

## Why

Mihai wants to see where people come from and what they click, without cookies and without
touching the respondents' pages, which carry the PM's brand.
