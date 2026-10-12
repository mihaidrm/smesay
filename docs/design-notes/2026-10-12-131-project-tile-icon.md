# 131 A project tile the PM can set, 2026-10-12

Mihai, 2026-10-12, after the initials tiles of design note 126: "maybe letting the user put
an icon or something? to choose from something fun? or think of a nice interaction".

Proposed (stories/E3-8, deferred until Mihai decides):
- The tile is a button. It opens a small popover with 24 Lucide icons and the eight gradients;
  one tap sets either, the tile pops once (scale 1 to 1.12 and back, 240 ms, not under reduced
  motion), and the pick shows at once on the list row and in the project header, which gains
  the tile beside the name. "Back to the initials" drops the icon. The sample stays as it is.
- Lucide is the app's icon set (docs/assets.md, row 3; ISC), so no purchase and nothing drawn
  by hand (decision 0041). The 24 are picked for the lists PMs validate: briefcase, receipt,
  wallet, credit card, plane, car, truck, package, building, store, cart, calendar, clock,
  mail, phone, users, user check, shield, key, file text, clipboard list, chart bar, map pin,
  heart.
- Cost: one migration (two nullable columns), a server action, the popover (new in the design
  system), the export and import fields, two tests. One pull request.

Alternatives, not recommended:
- Emoji: no two operating systems draw them alike, and they are not on the assets list.
- An uploaded image per project: a second upload path to secure and resize for a 32 px mark;
  the workspace's logo already covers branding.
- Random "fun" shapes or patterns generated from the id: decoration without meaning, and
  nothing the PM can steer, which was the ask.
- A colour only: cheaper, but the PM asked for an icon, and the icon is what makes a project
  recognisable at a glance.

Recommendation: build E3-8 as written, after the current fixes. Mihai decides.
