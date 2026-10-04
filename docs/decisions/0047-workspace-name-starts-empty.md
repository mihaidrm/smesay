# 0047 The workspace name field starts empty, 2026-10-04

Mihai, after signing in on his own machine: "The default name that gets prepoluated on the
Name your workspace page should be empty now it gave me Gmail.com - makes no sense"

Decision: the "Workspace name" field on the first sign-in (/app/new) starts empty. The
default from the part of the email after the @ is removed, because for a personal address
(gmail.com, outlook.com) it names the mail provider, not the company. An empty or blank
name is refused by the server with the existing message ("Enter a name for your workspace,
up to 80 characters.", docs/copy/errors.md).

Consequences: stories/E2-3 acceptance 1 and its technical notes amended;
src/lib/workspace-name.ts loses defaultWorkspaceName and its unit test; e2e/workspace.spec.ts
checks the empty field; design note 16 amended.
