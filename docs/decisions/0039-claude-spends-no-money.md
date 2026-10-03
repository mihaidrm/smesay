# 0039 Nothing Claude runs spends money, 2026-10-03

Status: decided by Mihai on 2026-10-03 ("i think you dont use any money from now on. I will
test at the end with real money - you test only things that dont require spending money"),
after nine golden set runs on his API key cost about 3 euro 70 in one afternoon: the Evals
job ran on every push to pull request 49.

1. Claude makes no real model call: not in the session, not in a test, not in CI. Tests use
   the fake transport (vitest) and the stand-in server (Playwright), as E4-1 acceptance 6
   requires.
2. The Evals job (.github/workflows/evals.yml) is started by hand only, from the Actions tab,
   by Mihai (workflow_dispatch); no push or pull request starts it. `npm run evals` and
   `npm run ai:smoke` are his to run, when he chooses, and he reads the results.
3. When a change needs a real run to be judged (a prompt change, the golden set), Claude says
   so in the pull request and in the story, and the story records the numbers Mihai reports.

Consequences: CLAUDE.md (a rule for every session), the workflow, story E4-6 acceptance 3,
evals/README.md, docs/accounts.md step 9 and docs/context.md on 2026-10-03.
