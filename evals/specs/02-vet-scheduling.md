# Golden spec 02: Veterinary clinic scheduling

Format: Email thread, newest first, three people, with quoted replies. Requirements buried in sentences.

Project context: none.

## Document as received

```text
Subject: RE: RE: RE: new booking system, what we actually need

From: Ana (reception)
Fine with all of that. One more: when a pet is marked deceased the reminders must stop the same
day, we had a complaint last month. And the SMS reminder two days before, not one.

> From: Dr. Iliescu
> Replying inline. Also, I need to block my Thursday mornings for surgery and nobody should be
> able to book a consultation into that block, including online bookings.
>
> > From: Ana (reception)
> > What I need, in no particular order:
> > - online booking for existing clients only, new clients call us (we need to check the animal
> >   first)
> > - a visit takes 20 minutes, a vaccination 10, surgery is whatever the doctor sets
> > - two doctors, two rooms, the X-ray room is shared and must be booked with the visit when
> >   needed
> > - reminders: SMS the day before (see above, Ana later says two days)
> > - the client file shows the animals, last visit, vaccines due, and the balance owed
> > - we must be able to see who cancelled late (less than 24h) and how many times
> > - ok to lose: the paper agenda. Not ok to lose: the ability to overbook an emergency
> >   on top of a full day
> > - printing the vaccination certificate from the visit, with the stamp image
> > - the boarding kennel (6 places) is a different calendar but the same client file
> > - GDPR: clients can ask for their file and we export it
>
> Dr. I: the 20 minutes is wrong for exotic animals, make it 30 for birds and reptiles.
> Dr. I: the certificate must have both languages, Romanian and English, the EU pet passport
> people ask for it.

> > > From: Mihnea (owner)
> > > Keep it cheap. No app, the website is enough. And I want the daily revenue by doctor
> > > on my phone in the morning.
```

## Rows as imported (decision 0037)

What a PM imports from the document above: one row per item, nothing else. The runner feeds these rows with no area column.

```text
1. online booking for existing clients only, new clients call us (we need to check the animal first)
2. a visit takes 20 minutes (30 for birds and reptiles), a vaccination 10, surgery is whatever the doctor sets
3. two doctors, two rooms, the X-ray room is shared and must be booked with the visit when needed
4. Dr. Iliescu: I need to block my Thursday mornings for surgery and nobody should be able to book a consultation into that block, including online bookings
5. reminders: SMS two days before, not one
6. the client file shows the animals, last visit, vaccines due, and the balance owed
7. we must be able to see who cancelled late (less than 24h) and how many times
8. ok to lose: the paper agenda. Not ok to lose: the ability to overbook an emergency on top of a full day
9. Mihnea (owner): I want the daily revenue by doctor on my phone in the morning
10. printing the vaccination certificate from the visit, with the stamp image, in both languages, Romanian and English (the EU pet passport people ask for it)
11. the boarding kennel (6 places) is a different calendar but the same client file
12. when a pet is marked deceased the reminders must stop the same day (we had a complaint last month)
13. No app, the website is enough.
14. GDPR: clients can ask for their file and we export it
```

## Expected, in words

14 rows, 14 distinct items in 4 areas (Booking, Reminders, Client and animal file, Owner and reporting). The thread revises itself: one day before becomes two days before, 20 minutes becomes 30 for birds and reptiles. The expected items carry the final value. G02-08 is listed under Client file, where it sits in the source; the runner reports placement and does not fail on it. "Keep it cheap" is not a row.

The exact expectation is in expected/02.json.
