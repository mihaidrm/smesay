# Golden spec 03: Municipal library catalogue

Format: A table copied from a spreadsheet into plain text, columns misaligned, two rows empty, one row in Romanian.

Project context: none.

## Document as received

```text
ID	Req	Prio	Who	Comment
L-1	Search the catalogue by title, author, ISBN and subject	1	public
L-2	Reserve a book that is out and get an email when it is back	1	public	max 3 reservations
L-3		
L-4	Renew online twice, unless someone reserved it	2	public
L-5	Children's accounts: no fines, parent email on the account	2	desk
L-6	Fines calculated per day late, capped at the book price	1	desk	currently done by hand
L-7	Prelungirea online de 2 ori, daca nu e rezervata de altcineva	2	public	(same as L-4, Romanian version from the old list)
L-8	Interlibrary loan request to the county library with status tracking	3	desk
L-9	Self-checkout kiosk with the card barcode	3	branch
L-10	Weekly new arrivals list on the website and by email to subscribers	2	public
L-11
L-12	Branch staff can move a copy between branches and the catalogue shows where it is	1	branch
L-13	Reading history is private, only the user sees it, can be turned off	1	public	legal
L-14	E-books: link to the national e-lending platform, no own e-book system	2	desk
L-15	Report: most borrowed titles per branch per month	2	manager
L-16	Lost card: block the card and issue a new one for 10 lei	3	desk
L-17	Accessibility: the public site passes WCAG AA	1	public
```

## Rows as imported (decision 0037)

What a PM imports from the document above: one row per item, nothing else. The runner feeds these rows with no area column.

```text
1. Search the catalogue by title, author, ISBN and subject
2. Reserve a book that is out and get an email when it is back (max 3 reservations)
3. Renew online twice, unless someone reserved it
4. Children's accounts: no fines, parent email on the account
5. Fines calculated per day late, capped at the book price (currently done by hand)
6. Interlibrary loan request to the county library with status tracking
7. Self-checkout kiosk with the card barcode
8. Weekly new arrivals list on the website and by email to subscribers
9. Branch staff can move a copy between branches and the catalogue shows where it is
10. Reading history is private, only the user sees it, can be turned off (legal)
11. E-books: link to the national e-lending platform, no own e-book system
12. Report: most borrowed titles per branch per month
13. Lost card: block the card and issue a new one for 10 lei
14. Accessibility: the public site passes WCAG AA
15. Prelungirea online de 2 ori, daca nu e rezervata de altcineva (same as L-4, Romanian version from the old list)
```

## Expected, in words

15 rows, 14 distinct items in 4 areas (Search and borrowing, Accounts and fines, Branch operations, Website). L-7 is the Romanian duplicate of L-4: it stays a row (G03-15) and the duplicate flag is expected to point at G03-03. The empty rows L-3 and L-11 are not rows. Priorities are numbers 1 to 3; the model keeps them as given, it does not convert them to MoSCoW.

The exact expectation is in expected/03.json.
