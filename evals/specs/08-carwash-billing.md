# Golden spec 08: Car wash subscription billing

Format: Chat export between the owner and a developer friend, informal, with emoji stripped, some lines are jokes, decisions change mid-chat.

Project context: none.

## Document as received

```text
[09:12] Vlad: ok so the subscription thing. 3 plans: basic 99 lei (4 washes/month), plus 149
(unlimited exterior), premium 249 (unlimited everything). per car, plate number is the id
[09:13] Vlad: card on file, charged on the 1st, if it fails retry on the 3rd and 5th then
suspend
[09:14] Dev: what about people with 2 cars
[09:15] Vlad: second car 20% off, same account, separate plates
[09:16] Vlad: the gate reads the plate (we have the camera already, Hikvision) and opens if the
plan is active, staff see the plan on the tablet
[09:17] Vlad: unlimited means max 1 wash per day, otherwise the taxi guys will kill us
[09:18] Dev: lol
[09:19] Vlad: cancel anytime, ends at the end of the paid month, no refunds
[09:20] Vlad: actually basic also 1 per day max
[09:21] Vlad: gift cards for xmas, 3 or 6 months, code on paper
[09:22] Vlad: receipts by email, invoices for companies with CUI, monthly
[09:23] Dev: ANAF e-factura?
[09:24] Vlad: yes for companies it has to go to e-factura, that is law now
[09:25] Vlad: dashboard: active subs per plan, churn per month, revenue, and failed payments
list so the girls can call them
[09:26] Vlad: also pause: a sub can be paused up to 2 months a year, e.g. when they go abroad
[09:27] Vlad: plate change: customer changes the plate himself, max once a month, staff can
always
[09:28] Vlad: thats it i think. oh and the washing machines are not part of this, separate
contract
[09:29] Vlad: no app. web + the gate.
```

## Rows as imported (decision 0037)

What a PM imports from the document above: one row per item, nothing else. The runner feeds these rows with no area column.

```text
1. 3 plans: basic 99 lei (4 washes/month), plus 149 (unlimited exterior), premium 249 (unlimited everything). per car, plate number is the id
2. unlimited means max 1 wash per day, otherwise the taxi guys will kill us; actually basic also 1 per day max
3. second car 20% off, same account, separate plates
4. cancel anytime, ends at the end of the paid month, no refunds
5. card on file, charged on the 1st, if it fails retry on the 3rd and 5th then suspend
6. receipts by email, invoices for companies with CUI, monthly; for companies it has to go to e-factura, that is law now
7. the gate reads the plate (we have the camera already, Hikvision) and opens if the plan is active, staff see the plan on the tablet
8. gift cards for xmas, 3 or 6 months, code on paper
9. pause: a sub can be paused up to 2 months a year, e.g. when they go abroad
10. plate change: customer changes the plate himself, max once a month, staff can always
11. no app. web + the gate.
12. dashboard: active subs per plan, churn per month, revenue, and failed payments list so the girls can call them
```

## Expected, in words

12 rows, 12 distinct items in 4 areas (Plans and pricing, Billing, Gate and site, Reporting). The chat revises itself: at 09:20 Basic also gets the daily limit, so G08-02 covers all plans. "lol", "thats it" and the washing machines line (a scope remark) are not rows.

The exact expectation is in expected/08.json.
