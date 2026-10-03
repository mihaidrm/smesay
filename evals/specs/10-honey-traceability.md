# Golden spec 10: Beekeeping cooperative traceability

Format: Mixed: a short list from the cooperative president, then a forwarded message from the lab, then a list of questions nobody answered.

Project context: none.

## Document as received

```text
From the president, for the traceability project (36 beekeepers, 2,400 hives):

1) every jar has a QR code that opens a page with the beekeeper, the apiary location (village,
   not GPS), the harvest date and the lab result
2) beekeepers record each harvest from their phone: apiary, date, kg, honey type
3) the cooperative mixes honey from several beekeepers into one batch, the batch page lists all
   of them with their share
4) lab results are attached to the batch, PDF from the lab, and the page shows pass/fail only,
   not the numbers
5) label printing with the batch number and the QR, on the cooperative's Zebra printer
6) stock: how many kg of each honey type is in the warehouse, by batch
7) sales to the shops, invoice per shop, honey leaves the stock by batch (oldest first)
8) a beekeeper sees only their own harvests and the batches they are part of
9) the mayor wants a public map of the apiaries. NO. village only, see 1

Forwarded from the lab (Dr. Pop):
"We can send the results as PDF and as a CSV with the parameters (HMF, moisture, diastase,
pollen origin). If you want pass/fail we need the thresholds from you per honey type. Acacia
and polyfloral have different moisture limits."

Open questions (asked in June, no answers yet):
- who pays for the QR page hosting
- do we show the price on the public page (president says no, two beekeepers say yes)
- can a beekeeper sell outside the cooperative with the same QR
```

## Rows as imported (decision 0037)

What a PM imports from the document above: one row per item, nothing else. The runner feeds these rows with no area column.

```text
1. every jar has a QR code that opens a page with the beekeeper, the apiary location (village, not GPS), the harvest date and the lab result
2. beekeepers record each harvest from their phone: apiary, date, kg, honey type
3. the cooperative mixes honey from several beekeepers into one batch, the batch page lists all of them with their share
4. lab results are attached to the batch, PDF from the lab, and the page shows pass/fail only, not the numbers
5. label printing with the batch number and the QR, on the cooperative's Zebra printer
6. stock: how many kg of each honey type is in the warehouse, by batch
7. sales to the shops, invoice per shop, honey leaves the stock by batch (oldest first)
8. a beekeeper sees only their own harvests and the batches they are part of
9. the mayor wants a public map of the apiaries. NO. village only, see 1
10. From the lab (Dr. Pop): we can send the results as PDF and as a CSV with the parameters (HMF, moisture, diastase, pollen origin). If you want pass/fail we need the thresholds from you per honey type. Acacia and polyfloral have different moisture limits.
```

## Expected, in words

10 rows, 10 distinct items in 4 areas (Harvest and batches, Lab and quality, Labels and public page, Stock and sales). The lab message adds one real requirement (thresholds per honey type) and an option (CSV), expected as one item flagged ambiguous. The three open questions are not items; a model that turns "do we show the price" into a requirement has invented one. Item 9 is a negative requirement and stays.

The exact expectation is in expected/10.json.
