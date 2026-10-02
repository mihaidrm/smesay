# Design note 17: Settings, Members, 2026-10-02

Story E2-4. Built from the PM app board (Settings, the Members block) and docs/design-system.md.
Screenshots beside the boards: settings-members-desktop.png (an owner, two members),
settings-members-invited-desktop.png (the "Invited" row and the sent line),
settings-members-error-desktop.png (an address already in the workspace),
settings-members-as-member-desktop.png (a member's view, no controls). The dark circle bottom
left is Next's dev tools badge, dev server only.

## The page (/app/settings)

The shell's content column: the workspace name as the breadcrumb, "Workspace settings" at 24 px
weight 400, one line, then the Members card (hairline, radius 6): a 44 px title row with
"Members" and the muted rule line on the right; the table header 32 on grey-50 at 12 px muted
(Name, Email, Role, Joined, blank); rows 36. The signed-in person's row carries a muted "you".
A person without a name shows "No name yet" in muted ink. Open invitations follow the members
as muted rows with "Invited" in the name column and the date they were sent.

For an owner, every row but the last owner's has a native select for the role (32 px, hairline
strong, white) and a tertiary "Remove" in danger red; the choice submits at once. The last
owner's row shows the role as text and no Remove, because the workspace keeps at least one
owner. A member sees the same list without the select, the button or the invite form.

The invite form sits under the rows: the "Invite by email" field (36 px) with the primary
"Send invite" beside it, at 40 percent until the field holds an address. A refusal is the
danger line under the form (the address is already a member, or is not an address); a sent
invite shows the green line "Invite sent. They get a sign-in link that works once and expires
in 15 minutes." and the "Invited" row appears.

Sidebar: a teal "Settings" link beside the workspace name, as on the board.

E2-5 adds the name, logo, accent and budget above the Members card.

## Checked

Rendered in Chromium at 1440 by 900. The flow is run by e2e/members.spec.ts (two browser
contexts, Mailpit, in CI); the role change, the removal and the removed person's next request
were exercised against the dev server (screenshots above).
