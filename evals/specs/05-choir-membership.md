# Golden spec 05: Community choir management

Format: Prose paragraphs from a committee member, no list at all. Items must be extracted from sentences.

Project context: none.

## Document as received

```text
What we need from the membership site, from Ruxandra, after the AGM

We have 64 members and a waiting list of about 20. Right now everything is in Carmen's notebook
and a WhatsApp group with 90 people in it, half of whom left years ago. The site should let a
member see the rehearsal calendar for the season and say whether they are coming to each one,
because we need to know by the Monday before if we have enough tenors. If someone misses three
rehearsals in a row before a concert, the section leader should be told so they can call them,
not an automatic email, a person. The membership fee is 120 lei a year and we need to see who
has paid, with a reminder going out in February and again in March to those who have not.
Sheet music: we have the right to share PDFs with members only, so they must be behind a login
and not downloadable by the waiting list. The waiting list people should be able to put their
name and voice part on the site themselves, and when a place opens the committee picks someone,
it is not first come first served. Concert dates with the dress code and the call time, and a
page the public can see with the next three concerts and a way to buy tickets, we use a third
party for tickets (Eventbook) so just a link. Carmen wants to keep the notebook, that is fine,
but the site is the truth. One more thing from the AGM: members over 70 pay half, and we should
not have to remember who that is.
```

## Rows as imported (decision 0037)

What a PM imports from the document above: one row per item, nothing else. The runner feeds these rows with no area column.

```text
1. The site should let a member see the rehearsal calendar for the season and say whether they are coming to each one
2. we need to know by the Monday before if we have enough tenors
3. If someone misses three rehearsals in a row before a concert, the section leader should be told so they can call them, not an automatic email, a person
4. The membership fee is 120 lei a year and we need to see who has paid
5. a reminder going out in February and again in March to those who have not paid
6. The waiting list people should be able to put their name and voice part on the site themselves, and when a place opens the committee picks someone, it is not first come first served
7. members over 70 pay half, and we should not have to remember who that is
8. Sheet music: we have the right to share PDFs with members only, so they must be behind a login and not downloadable by the waiting list
9. Concert dates with the dress code and the call time, and a page the public can see with the next three concerts and a way to buy tickets, we use a third party for tickets (Eventbook) so just a link
10. Carmen wants to keep the notebook, that is fine, but the site is the truth
```

## Expected, in words

10 rows, 10 distinct items in 3 areas (Rehearsals and attendance, Membership and fees, Music and concerts). Prose only. The model must find ten items in sentences and keep the negatives: "not an automatic email, a person" and "not first come first served". G05-02 is an ambiguity flag candidate (whose deadline is it, and what happens after Monday); G05-10 could be dropped as not a requirement or kept as a principle, both accepted. "Half of whom left years ago" is background, not an item.

The exact expectation is in expected/05.json.
