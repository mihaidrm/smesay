# Golden spec 01: Bakery chain ordering

Format: Pasted from a Word document. Numbered, with meeting notes and two duplicates. Priorities as words, stars and nothing.

Project context: none.

## Document as received

```text
Requirements for the new ordering thing (shops -> central bakery) v0.3 DRAFT do not circulate

Notes from the 14 March call with the shop managers, please read before the list.
Dana says the fax still works and she does not want to lose it. Parking at the Oradea shop
is still an issue (not for this project).

1. Every shop can place the next-day order from a phone or the shop PC, until 16:00. MUST
2. The order form shows yesterday's order so you can copy it and change the numbers. (Important!!)
3. Products that are out of production for the day are greyed out, not hidden.
4. Central bakery sees all orders in one list by 16:15 and can print it per oven line.
5. a shop manager can set a standing order per weekday that is created automatically if nobody
   changes it by 15:30 ***
6. Order confirmation goes to the shop by SMS and email (or whatsapp?) with the totals.
7. Wastage: at closing the shop types what was thrown away per product; the report compares with
   the order. nice to have
8. Same as 2 basically: show last week same day as well, Dana asked for this twice.
9. Allergen list per product visible in the order form (legal, must).
10. Price changes are set centrally and shops cannot edit prices.
11. If the bakery cannot deliver the full quantity, the shop is told before 06:00 what is short.
12. Driver app: scan the crate label at drop-off so the shop knows the order arrived. (phase 2?)
13. Returns of unsold bread to the central bakery for the animal feed partner, counted per crate.
14. the dashboard for the owners: sales vs orders vs wastage per shop per week. must
15. Users: shop manager, shop staff (order only, no standing orders), bakery planner, driver, owner.
16. Works offline in the shop if the internet drops, syncs later. should
17. Order cut-off time can be different per shop (the airport shop closes late).
18. See 11 - also tell them the replacement product if there is one.

Parking Oradea: ask Mihnea.
```

## Expected, in words

17 distinct items in 4 areas (Ordering, Confirming and shortages, Catalogue and prices, Wastage and returns). Item 6 is ambiguous: WhatsApp is a question, not a channel. Item 12 says "phase 2?", so it stays an item, flagged ambiguous for scope; the model must not drop it. Item 8 restates 2 with a second window (last week), which is a real addition, so it is a duplicate only in part; the runner accepts it as its own item or as merged into G01-02 with "last week" kept. The meeting notes and the parking line are noise, not items.

The exact expectation is in expected/01.json.
