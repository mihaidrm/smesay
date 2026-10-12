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

## Built, 2026-10-12

Mihai said yes (decision 0066). As built:
- The popover: 308 px wide, 12 px padding, the hairline border, the card shadow and the
  surface colour; two labelled groups, Icons (three rows of eight, 32 px cells, the icon at
  16 px) and Colours (one row of eight, the gradient on a 24 px square with a tick on the
  one picked), then Back to the initials as a text item. The picked icon's cell is violet
  soft with the icon in violet. It stays open after a pick so the icon and the colour are
  set in one visit, and closes on Escape (focus back on the tile), Tab, a press outside, a
  scroll or the tile again. It sits at a fixed position 8 px under the tile, read when it
  opens, because the list's card clips what overflows it.
- The keyboard: the menu pattern of the WAI-ARIA Authoring Practices
  (w3.org/WAI/ARIA/apg/patterns/menu/). role="menu" on the popover, menuitemradio with
  aria-checked on the 32 picks, menuitem on the reset; one item in the tab order at a time;
  Right and Left move one item with wrap, Down and Up one row of eight (the last or the
  first item where no row is there), Home and End the ends; Enter or Space presses; Down or
  Up on the tile opens the popover. The pure moves are in src/lib/tile-picker.ts.
- The tile: the icon at 18 px (list, 32 px tile) or 14 px (header, 24 px tile) in ink,
  stroke 2.25, on the gradient; the initials when no icon is set. data-icon and data-tile
  carry the pick for the tests. The pick shows at once from the picker's own state and pops
  once (.tile-pop, 240 ms); router.refresh() then brings the server's row. A refused pick
  puts the saved values back and says so under the items.
- The colours are named by their stops: Coral to sun, Lavender to mint, Coral to lavender,
  Mint to sun, Sun to lavender, Mint to coral, Coral, soft, Mint, soft.
- No new component in src/components/ui: the popover is this one file,
  src/app/app/(shell)/project-tile-picker.tsx, until a second popover needs the same.
