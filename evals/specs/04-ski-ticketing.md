# Golden spec 04: Ski resort lift ticketing

Format: Nested bullets from a wiki page, some bullets are headings, product names with odd capitalisation. Has a context block.

## Project context (decision 0011)

Goal: Replace the lift ticket system before the December season: online sales, gate validation and season passes for a resort with 14 lifts.

Audience: Ticket office staff, lift operators, the finance lead and the ski school, who will answer the list.

Terms to keep as written: SkiPass+, Valley Card, Gate 7, RFID, ski school

## Document as received

```text
* Sales
  * sell day, multi-day and season tickets online and at the 3 ticket offices
  * SkiPass+ (the premium season pass) includes 5 friend days, must be redeemable at the gate
    without going to the office
  * Valley Card holders (locals) get the resident price automatically when the card is scanned
  * refunds: weather closure of more than 50% of lifts = automatic credit for that day
  * group bookings (ski school, 10+) with one invoice and individual tickets
* Access
  * RFID gates on all 14 lifts, read at 1 m without taking the card out
  * Gate 7 (beginner lift) is free for ski school kids under 8 when accompanied by an instructor
    badge
  * a ticket used at two gates more than 10 km apart within 5 minutes is blocked (sharing)
  * offline mode for gates: keep validating from the local list for 4 hours if the network drops
* Passes and renewals
  * season pass photo taken at the office or uploaded, checked by staff before activation
  * renew SkiPass+ for next season at a discount until 30 September
  * lost card: block old, issue new, 20 EUR, history transferred
* Reporting
  * live count of people on the mountain by lift
  * sales by channel by day for finance, exported to the accounting package (they use Saga)
* Misc
  * the website must not look like the old one (Mihai will do the design)
  * GDPR: photo and name deleted 2 years after the pass expires
```

## Expected, in words

15 distinct items in 4 areas (Sales, Access, Passes and renewals, Reporting). Context spec (decision 0011). The glossary terms SkiPass+, Valley Card, Gate 7 and RFID must appear exactly as written in the reader versions; "Premium season pass" instead of SkiPass+ is a failure. The context names the ski school as an audience, so the group booking item keeps "ski school". Without the context a model may rename the areas to "Online sales" or "Gates"; with it, the four source headings are expected (aliases accepted). G04-15 is ambiguous: it sits under Misc and could go to Passes; both are accepted.

The exact expectation is in expected/04.json.
