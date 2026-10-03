# Golden spec 09: Theatre box office

Format: A formal tender-style list with legalistic numbering (3.1.4), long sentences, two items that contradict each other.

Project context: none.

## Document as received

```text
3. Functional requirements for the box office and front-of-house system

3.1 Ticket sales
3.1.1 The system shall allow the sale of tickets for reserved seating performances through the
      box office, the website and authorised resellers, with a single seat map.
3.1.2 The system shall hold a seat for a maximum of 10 minutes during an online purchase.
3.1.3 The system shall apply the discount schedule (students, pensioners, groups of 15 or more,
      staff) upon presentation of the relevant proof at the box office; online purchases of
      discounted tickets shall be validated at the entrance.
3.1.4 The system shall support season subscriptions of 6 performances with a fixed seat.
3.1.5 The system shall not permit the sale of more tickets than the hall capacity as declared
      to the fire authority (486 seats, 4 wheelchair spaces).
3.2 Entrance
3.2.1 Tickets shall be scanned at the entrance from paper or a phone screen; a ticket shall
      be accepted once.
3.2.2 The system shall operate the entrance scanners without an internet connection for the
      duration of a performance.
3.3 Reporting and finance
3.3.1 A settlement report per performance shall be available within 30 minutes of the end of
      the performance, showing sales by channel and by price category.
3.3.2 Author royalties shall be computed per performance as a percentage of net sales, with the
      percentage set per production.
3.3.3 The system shall export daily sales to the accounting system in the format annexed
      (Annex C).
3.4 Audience
3.4.1 Patrons may create an account to see their purchase history and receive the programme by
      email; an account shall not be required to buy a ticket.
3.4.2 All ticket purchases shall require a patron account so that the marketing department can
      contact the audience.
3.5 Accessibility
3.5.1 The website shall conform to WCAG 2.1 level AA; wheelchair spaces shall be bookable
      online with a companion seat adjacent.
```

## Rows as imported (decision 0037)

What a PM imports from the document above: one row per item, nothing else. The runner feeds these rows with no area column.

```text
1. 3.1.1 The system shall allow the sale of tickets for reserved seating performances through the box office, the website and authorised resellers, with a single seat map.
2. 3.1.2 The system shall hold a seat for a maximum of 10 minutes during an online purchase.
3. 3.1.3 The system shall apply the discount schedule (students, pensioners, groups of 15 or more, staff) upon presentation of the relevant proof at the box office; online purchases of discounted tickets shall be validated at the entrance.
4. 3.1.4 The system shall support season subscriptions of 6 performances with a fixed seat.
5. 3.1.5 The system shall not permit the sale of more tickets than the hall capacity as declared to the fire authority (486 seats, 4 wheelchair spaces).
6. 3.2.1 Tickets shall be scanned at the entrance from paper or a phone screen; a ticket shall be accepted once.
7. 3.2.2 The system shall operate the entrance scanners without an internet connection for the duration of a performance.
8. 3.3.1 A settlement report per performance shall be available within 30 minutes of the end of the performance, showing sales by channel and by price category.
9. 3.3.2 Author royalties shall be computed per performance as a percentage of net sales, with the percentage set per production.
10. 3.3.3 The system shall export daily sales to the accounting system in the format annexed (Annex C).
11. 3.4.1 Patrons may create an account to see their purchase history and receive the programme by email; an account shall not be required to buy a ticket.
12. 3.4.2 All ticket purchases shall require a patron account so that the marketing department can contact the audience.
13. 3.5.1 The website shall conform to WCAG 2.1 level AA; wheelchair spaces shall be bookable online with a companion seat adjacent.
```

## Expected, in words

13 rows, 13 distinct items in 5 areas (Ticket sales, Entrance, Reporting and finance, Audience, Accessibility). 3.4.1 and 3.4.2 contradict each other. Both are expected as items, both flagged ambiguous, and the ambiguity flag should name the contradiction. Dropping one of them, or rewriting one to agree with the other, is a failure. "Shall" wording becomes plain sentences in the reader version without losing the numbers.

The exact expectation is in expected/09.json.
