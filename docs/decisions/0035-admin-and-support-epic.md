# 0035 An admin and support epic, 2026-10-02

Status: decided by Mihai on 2026-10-02 ("add everywhere in our design documents a small epic
for admin dashboard and everything that we need as admin: seeing users, their settings,
things we need to help them").

1. A new epic E14, "Admin and support", after E13 and before the launch gate: the /admin area
   E13-2 starts (ADMIN_EMAILS, 404 for everyone else) grows into a support console with four
   stories: the admin shell and its audit log (E14-1), workspaces and their settings with the
   support actions (E14-2), people and their sign-in (E14-3), and a read-only "view as" of a
   workspace (E14-4).
2. Rules that hold for every admin screen: access by ADMIN_EMAILS only, 404 otherwise; every
   admin action is written to an audit log with who, what, which workspace and when; "view as"
   is read-only and shows a banner; respondent names and answers never appear in the admin
   area except through "view as", which the audit log records; the admin queries live in one
   module that the product's own pages never import (lint rule as in E1-3).
3. Consequences: stories E14-1 to E14-4 written 2026-10-02; stories/backlog.md,
   docs/plan-steps.md (fourteen epics, 3 sessions), docs/context.md, SECURITY.md (an Admin
   section) and the Stories and Roadmap boards updated; E13-2 names E14-1 as the shell it
   shares. Estimates and order stay Mihai's to change.
