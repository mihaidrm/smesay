import json, pathlib
ROOT = pathlib.Path('/home/user/smesay/evals')
SPECS = []

def spec(id, domain, slug, format_note, context, doc, areas, items, must_not_invent, notes):
    SPECS.append(dict(id=id, domain=domain, slug=slug, format_note=format_note, context=context, doc=doc.strip('\n'), areas=areas, items=items, must_not_invent=must_not_invent, notes=notes))

# item: (ref, meaning, must_keep, area, flags dict) ; flags: duplicate_of, ambiguous, proposed. The row
# each item is imported as comes from ROWS below (decision 0037).
def it(ref, meaning, keep, area, **flags): return dict(ref=ref, meaning=meaning, must_keep=keep, area=area, **flags)

spec('01', 'Bakery chain ordering', 'bakery-ordering',
'Pasted from a Word document. Numbered, with meeting notes and two duplicates. Priorities as words, stars and nothing.',
None,
'''
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
''',
[('Ordering', ['Placing orders', 'Orders'], ['G01-01','G01-02','G01-03','G01-05','G01-08','G01-15','G01-16','G01-17']),
 ('Confirming and shortages', ['Confirmation', 'Delivery'], ['G01-04','G01-06','G01-11','G01-12','G01-18']),
 ('Catalogue and prices', ['Products', 'Pricing'], ['G01-09','G01-10']),
 ('Wastage and returns', ['Reporting', 'Wastage'], ['G01-07','G01-13','G01-14'])],
[it('G01-01','A shop places the next-day order from a phone or the shop PC until 16:00.',['16:00','phone'],'Ordering',proposed='Must'),
 it('G01-02','The order form shows the previous order so it can be copied and adjusted.',['copy'],'Ordering'),
 it('G01-03','Products out of production that day are shown greyed out, not hidden.',['greyed','not hidden'],'Ordering'),
 it('G01-04','The central bakery sees all orders in one list by 16:15 and can print it per oven line.',['16:15','oven line'],'Confirming and shortages'),
 it('G01-05','A shop manager can set a standing order per weekday, created automatically unless changed by 15:30.',['standing order','15:30'],'Ordering'),
 it('G01-06','Order confirmation with totals goes to the shop by SMS and email.',['SMS','email'],'Confirming and shortages',ambiguous=True),
 it('G01-07','At closing the shop records what was thrown away per product and a report compares it with the order.',['thrown away','per product'],'Wastage and returns',proposed='Could'),
 it('G01-08','The order form also shows the same weekday of the previous week.',['last week','same day'],'Ordering',duplicate_of='G01-02'),
 it('G01-09','The allergen list per product is visible in the order form.',['allergen'],'Catalogue and prices',proposed='Must'),
 it('G01-10','Prices are set centrally; shops cannot edit them.',['centrally','cannot edit'],'Catalogue and prices'),
 it('G01-11','If the bakery cannot deliver the full quantity, the shop is told before 06:00 what is short.',['06:00','short'],'Confirming and shortages'),
 it('G01-12','The driver scans the crate label at drop-off so the shop knows the order arrived.',['scan','crate label'],'Confirming and shortages',ambiguous=True),
 it('G01-13','Unsold bread returned to the central bakery for the animal feed partner is counted per crate.',['returns','per crate'],'Wastage and returns'),
 it('G01-14','Owners see sales, orders and wastage per shop per week on a dashboard.',['per shop','per week'],'Wastage and returns',proposed='Must'),
 it('G01-15','Roles: shop manager, shop staff (order only), bakery planner, driver, owner.',['shop staff','driver','owner'],'Ordering'),
 it('G01-16','The shop can keep ordering offline and it syncs when the connection returns.',['offline','sync'],'Ordering',proposed='Should'),
 it('G01-17','The order cut-off time can differ per shop.',['cut-off','per shop'],'Ordering'),
 it('G01-18','A shortage notice names the replacement product when there is one.',['replacement'],'Confirming and shortages')],
['fax ordering', 'parking', 'WhatsApp confirmation as a requirement (it is a question in the source)', 'payment or invoicing', 'loyalty cards', 'recipes'],
'Item 6 is ambiguous: WhatsApp is a question, not a channel. Item 12 says "phase 2?", so it stays an item, flagged ambiguous for scope; the model must not drop it. Item 8 restates 2 with a second window (last week), which is a real addition, so it is a duplicate only in part; the runner accepts it as its own item or as merged into G01-02 with "last week" kept. The meeting notes and the parking line are noise, not items.')

spec('02', 'Veterinary clinic scheduling', 'vet-scheduling',
'Email thread, newest first, three people, with quoted replies. Requirements buried in sentences.',
None,
'''
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
''',
[('Booking', ['Scheduling', 'Appointments'], ['G02-01','G02-02','G02-03','G02-04','G02-07','G02-13']),
 ('Reminders', ['Notifications'], ['G02-05','G02-12']),
 ('Client and animal file', ['Records', 'Clients'], ['G02-06','G02-08','G02-10','G02-11']),
 ('Owner and reporting', ['Reporting', 'Management'], ['G02-09','G02-14'])],
[it('G02-01','Existing clients can book online; new clients book by phone.',['existing clients','new clients'],'Booking'),
 it('G02-02','Default durations: visit 20 minutes, vaccination 10, surgery as set by the doctor; 30 minutes for birds and reptiles.',['20','10','30','birds'],'Booking'),
 it('G02-03','Two doctors and two rooms; the shared X-ray room is booked together with the visit when needed.',['X-ray','shared'],'Booking'),
 it('G02-04','A doctor can block time (Thursday mornings for surgery) that no booking, online included, can take.',['block','online'],'Booking'),
 it('G02-05','SMS reminder two days before the appointment.',['SMS','two days'],'Reminders'),
 it('G02-06','The client file shows the animals, last visit, vaccines due and the balance owed.',['vaccines due','balance'],'Client and animal file'),
 it('G02-07','Late cancellations (under 24 hours) are visible per client with a count.',['24','late'],'Booking'),
 it('G02-08','An emergency can be overbooked on top of a full day.',['emergency','overbook'],'Client and animal file',ambiguous=True),
 it('G02-09','Daily revenue by doctor is visible on the owner\'s phone in the morning.',['revenue','by doctor'],'Owner and reporting'),
 it('G02-10','The vaccination certificate prints from the visit with the stamp image, in Romanian and English.',['stamp','Romanian','English'],'Client and animal file'),
 it('G02-11','The boarding kennel (6 places) has its own calendar but the same client file.',['kennel','6'],'Client and animal file'),
 it('G02-12','Reminders stop the same day an animal is marked deceased.',['deceased','same day'],'Reminders'),
 it('G02-13','No app; the website is enough.',['website','no app'],'Booking'),
 it('G02-14','Clients can request their file and the clinic exports it (GDPR).',['export','GDPR'],'Owner and reporting')],
['a paper agenda feature', 'online booking for new clients', 'a reminder one day before (superseded in the thread)', 'payments online', 'inventory of medicines', 'a mobile app'],
'The thread revises itself: one day before becomes two days before, 20 minutes becomes 30 for birds and reptiles. The expected items carry the final value. G02-08 belongs to Booking by meaning; the runner accepts it in Booking or Client file, the listed area is where it sits in the source. "Keep it cheap" is not an item.')

spec('03', 'Municipal library catalogue', 'library-catalogue',
'A table copied from a spreadsheet into plain text, columns misaligned, two rows empty, one row in Romanian.',
None,
'''
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
''',
[('Search and borrowing', ['Public catalogue', 'Borrowing'], ['G03-01','G03-02','G03-03','G03-08','G03-11','G03-15']),
 ('Accounts and fines', ['Members', 'Accounts'], ['G03-04','G03-05','G03-10','G03-13']),
 ('Branch operations', ['Branches', 'Staff'], ['G03-06','G03-07','G03-09','G03-12']),
 ('Website', ['Public site'], ['G03-14'])],
[it('G03-01','Search the catalogue by title, author, ISBN and subject.',['ISBN','subject'],'Search and borrowing',proposed='1'),
 it('G03-02','Reserve a book that is out, up to 3 reservations, with an email when it is back.',['3','email'],'Search and borrowing',proposed='1'),
 it('G03-03','Renew online twice unless someone reserved the book.',['twice','reserved'],'Search and borrowing',proposed='2'),
 it('G03-04','Children\'s accounts have no fines and carry a parent email.',['no fines','parent'],'Accounts and fines',proposed='2'),
 it('G03-05','Fines are calculated per day late and capped at the book price.',['per day','capped'],'Accounts and fines',proposed='1'),
 it('G03-06','Interlibrary loan requests to the county library with status tracking.',['county','status'],'Branch operations',proposed='3'),
 it('G03-07','Self-checkout kiosk using the card barcode.',['kiosk','barcode'],'Branch operations',proposed='3'),
 it('G03-08','Weekly new arrivals list on the website and by email to subscribers.',['weekly','subscribers'],'Search and borrowing',proposed='2'),
 it('G03-09','Branch staff can move a copy between branches and the catalogue shows where it is.',['between branches','where'],'Branch operations',proposed='1'),
 it('G03-10','Reading history is private to the user and can be turned off.',['private','turned off'],'Accounts and fines',proposed='1'),
 it('G03-11','E-books link to the national e-lending platform; no own e-book system.',['national','no own'],'Search and borrowing',proposed='2'),
 it('G03-12','Report of the most borrowed titles per branch per month.',['per branch','per month'],'Branch operations',proposed='2'),
 it('G03-13','A lost card is blocked and replaced for 10 lei.',['10 lei','blocked'],'Accounts and fines',proposed='3'),
 it('G03-14','The public site passes WCAG AA.',['WCAG','AA'],'Website',proposed='1'),
 it('G03-15','Renew online twice unless someone reserved the book (the Romanian row, same as L-4).',['2','rezervat'],'Search and borrowing',proposed='2',duplicate_of='G03-03')],
['an own e-book system', 'a mobile app', 'late-fee payment online', 'L-3 or L-11 as items (they are empty rows)', 'a Romanian-only requirement separate from renewal'],
'L-7 is the Romanian duplicate of L-4: it stays a row (G03-15) and the duplicate flag is expected to point at G03-03. The empty rows L-3 and L-11 are not rows. Priorities are numbers 1 to 3; the model keeps them as given, it does not convert them to MoSCoW.')

spec('04', 'Ski resort lift ticketing', 'ski-ticketing',
'Nested bullets from a wiki page, some bullets are headings, product names with odd capitalisation. Has a context block.',
dict(goal='Replace the lift ticket system before the December season: online sales, gate validation and season passes for a resort with 14 lifts.',
     audience='Ticket office staff, lift operators, the finance lead and the ski school, who will answer the list.',
     glossary=['SkiPass+', 'Valley Card', 'Gate 7', 'RFID', 'ski school']),
'''
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
''',
[('Sales', ['Tickets', 'Selling'], ['G04-01','G04-02','G04-03','G04-04','G04-05']),
 ('Access', ['Gates', 'Validation'], ['G04-06','G04-07','G04-08','G04-09']),
 ('Passes and renewals', ['Season passes'], ['G04-10','G04-11','G04-12']),
 ('Reporting', ['Finance and reporting'], ['G04-13','G04-14','G04-15'])],
[it('G04-01','Sell day, multi-day and season tickets online and at the 3 ticket offices.',['3','online'],'Sales'),
 it('G04-02','SkiPass+ includes 5 friend days redeemable at the gate without visiting the office.',['SkiPass+','5','gate'],'Sales'),
 it('G04-03','Valley Card holders get the resident price automatically when the card is scanned.',['Valley Card','resident'],'Sales'),
 it('G04-04','When more than 50 percent of lifts close for weather, the day is credited automatically.',['50','credit'],'Sales'),
 it('G04-05','Group bookings of 10 or more get one invoice and individual tickets.',['10','one invoice'],'Sales'),
 it('G04-06','RFID gates on all 14 lifts read the card at 1 m without taking it out.',['RFID','14','1 m'],'Access'),
 it('G04-07','Gate 7 is free for ski school children under 8 accompanied by an instructor badge.',['Gate 7','8','instructor'],'Access'),
 it('G04-08','A ticket used at two gates more than 10 km apart within 5 minutes is blocked.',['10 km','5 minutes'],'Access'),
 it('G04-09','Gates keep validating from a local list for 4 hours when the network drops.',['4 hours','local'],'Access'),
 it('G04-10','The season pass photo is taken at the office or uploaded and checked by staff before activation.',['photo','before activation'],'Passes and renewals'),
 it('G04-11','SkiPass+ renews for next season at a discount until 30 September.',['SkiPass+','30 September'],'Passes and renewals'),
 it('G04-12','A lost card is blocked and replaced for 20 EUR with the history transferred.',['20 EUR','history'],'Passes and renewals'),
 it('G04-13','Live count of people on the mountain by lift.',['live','by lift'],'Reporting'),
 it('G04-14','Sales by channel by day, exported to the accounting package (Saga).',['Saga','by channel'],'Reporting'),
 it('G04-15','Photo and name are deleted 2 years after the pass expires.',['2 years','deleted'],'Reporting',ambiguous=True)],
['a redesign of the website as a requirement (the source says the design is done elsewhere)', 'a mobile app', 'parking tickets', 'equipment rental', 'a loyalty programme beyond SkiPass+'],
'Context spec (decision 0011). The glossary terms SkiPass+, Valley Card, Gate 7 and RFID must appear exactly as written in the reader versions; "Premium season pass" instead of SkiPass+ is a failure. The context names the ski school as an audience, so the group booking item keeps "ski school". Without the context a model may rename the areas to "Online sales" or "Gates"; with it, the four source headings are expected (aliases accepted). G04-15 is ambiguous: it sits under Misc and could go to Passes; both are accepted.')

spec('05', 'Community choir management', 'choir-membership',
'Prose paragraphs from a committee member, no list at all. Items must be extracted from sentences.',
None,
'''
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
''',
[('Rehearsals and attendance', ['Attendance', 'Rehearsals'], ['G05-01','G05-02','G05-03']),
 ('Membership and fees', ['Members', 'Fees'], ['G05-04','G05-05','G05-06','G05-07','G05-10']),
 ('Music and concerts', ['Concerts', 'Sheet music'], ['G05-08','G05-09'])],
[it('G05-01','A member sees the season rehearsal calendar and marks attendance for each rehearsal.',['calendar','coming'],'Rehearsals and attendance'),
 it('G05-02','Attendance for a rehearsal is known by the Monday before.',['Monday'],'Rehearsals and attendance',ambiguous=True),
 it('G05-03','When a member misses three rehearsals in a row before a concert, the section leader is told so a person can call; no automatic email to the member.',['three','section leader','not an automatic email'],'Rehearsals and attendance'),
 it('G05-04','The annual fee is 120 lei; the site shows who has paid.',['120','paid'],'Membership and fees'),
 it('G05-05','Fee reminders go to unpaid members in February and again in March.',['February','March'],'Membership and fees'),
 it('G05-06','Waiting list: people add their name and voice part themselves; the committee picks who joins, not first come first served.',['voice part','committee','not first come'],'Membership and fees'),
 it('G05-07','Members over 70 pay half and the site applies it without anyone remembering.',['70','half'],'Membership and fees'),
 it('G05-08','Sheet music PDFs are behind the member login and not available to the waiting list.',['PDF','login','waiting list'],'Music and concerts'),
 it('G05-09','Concert dates show the dress code and call time; a public page lists the next three concerts with a link to Eventbook for tickets.',['dress code','call time','three','Eventbook'],'Music and concerts'),
 it('G05-10','The site is the source of truth for membership, not the notebook.',['truth'],'Membership and fees',ambiguous=True)],
['an own ticketing system', 'a WhatsApp integration', 'a mobile app', 'an automatic email to a member who missed rehearsals', 'first come first served admission', 'a feature for the notebook'],
'Prose only. The model must find ten items in sentences and keep the negatives: "not an automatic email, a person" and "not first come first served". G05-02 is an ambiguity flag candidate (whose deadline is it, and what happens after Monday); G05-10 could be dropped as not a requirement or kept as a principle, both accepted. "Half of whom left years ago" is background, not an item.')

spec('06', 'Wind farm maintenance logging', 'wind-maintenance',
'Technician shorthand, abbreviations, numbers everywhere, a second author appended corrections at the bottom. Has a context block.',
dict(goal='Replace the paper maintenance log for a 22-turbine onshore wind farm with a tablet app that technicians use on the turbine.',
     audience='Technicians, the site manager, the HSE officer and the asset owner\'s engineer, who will answer the list.',
     glossary=['WTG', 'LOTO', 'SCADA', 'nacelle', 'HSE', 'OEM']),
'''
MAINT LOG APP - what techs need (compiled by R.T. from the toolbox talks)

- open a job on a WTG from the tablet, job types: scheduled service, fault, inspection, retrofit
- LOTO checklist must be completed and signed by 2 techs before the job can go to "in progress"
  (no exceptions, HSE)
- nacelle work: log the climb, the harness check, and who is the second person on the ground
- parts used: scan the part barcode, stock comes from the container inventory, warns when a
  part drops below min stock
- time per job per tech, for the OEM warranty claims they want the hours
- photos: before / after, attached to the job, max 10, compressed on the tablet
- the job report is a PDF in the OEM format (they have a template, see attached, not attached
  sorry) so the warranty people accept it
- SCADA alarm that triggered a fault job is linked to the job by alarm id, we type the id now
- works with no signal up in the nacelle, syncs at the base
- site manager sees all open jobs by WTG and by tech, overdue scheduled services in red
- HSE officer: monthly export of all LOTO records and near misses
- near miss report: 3 fields, what, where, photo, from any tech, anonymous option
- weather: the app shows wind speed from SCADA and blocks opening a nacelle job above 12 m/s
- retrofit jobs from the OEM bulletin need the bulletin number on the job

Corrections from M.D. (site mgr): the wind limit is 15 m/s for nacelle work per the OEM manual,
12 is for the rotor. Also the overdue colour, make it configurable not red, we have a colour
blind tech. And anonymity on near misses: anonymous to the site, visible to HSE, otherwise we
cannot follow up.
''',
[('Jobs', ['Work orders', 'Job management'], ['G06-01','G06-05','G06-06','G06-07','G06-08','G06-09','G06-14']),
 ('Safety', ['HSE', 'LOTO'], ['G06-02','G06-03','G06-11','G06-12','G06-13']),
 ('Parts', ['Inventory'], ['G06-04']),
 ('Oversight', ['Site manager', 'Reporting'], ['G06-10'])],
[it('G06-01','Open a job on a WTG from the tablet; types: scheduled service, fault, inspection, retrofit.',['WTG','retrofit'],'Jobs'),
 it('G06-02','The LOTO checklist is completed and signed by 2 technicians before a job can go to in progress, no exceptions.',['LOTO','2','before'],'Safety'),
 it('G06-03','Nacelle work logs the climb, the harness check and the second person on the ground.',['nacelle','harness','ground'],'Safety'),
 it('G06-04','Parts used are scanned by barcode from the container inventory, with a warning below minimum stock.',['barcode','min stock'],'Parts'),
 it('G06-05','Time per job per technician is recorded for OEM warranty claims.',['OEM','warranty','per tech'],'Jobs'),
 it('G06-06','Before and after photos attach to the job, at most 10, compressed on the tablet.',['10','compressed'],'Jobs'),
 it('G06-07','The job report is a PDF in the OEM template so warranty claims are accepted.',['PDF','OEM'],'Jobs',ambiguous=True),
 it('G06-08','A fault job links to the SCADA alarm that triggered it by alarm id.',['SCADA','alarm id'],'Jobs'),
 it('G06-09','The app works without signal in the nacelle and syncs at the base.',['no signal','sync'],'Jobs'),
 it('G06-10','The site manager sees open jobs by WTG and by technician, with overdue scheduled services marked in a configurable colour.',['by WTG','overdue','configurable'],'Oversight'),
 it('G06-11','HSE gets a monthly export of all LOTO records and near misses.',['monthly','LOTO','near miss'],'Safety'),
 it('G06-12','Near miss report: what, where, photo, from any technician; anonymous to the site, visible to HSE.',['anonymous','visible to HSE'],'Safety'),
 it('G06-13','The app shows SCADA wind speed and blocks opening a nacelle job above 15 m/s.',['15 m/s','nacelle'],'Safety'),
 it('G06-14','Retrofit jobs carry the OEM bulletin number.',['bulletin'],'Jobs')],
['a 12 m/s limit for nacelle work (corrected to 15)', 'overdue jobs shown in red (corrected to configurable)', 'fully anonymous near misses (corrected)', 'the OEM template contents (not attached)', 'spare parts ordering from the OEM', 'a rotor job type'],
'Context spec (decision 0011). Glossary terms WTG, LOTO, SCADA, nacelle, HSE and OEM stay as written; "turbine" for WTG is accepted only in addition, never instead. The corrections at the bottom override the list: 15 m/s, configurable colour, anonymous to the site but visible to HSE. G06-07 is flagged ambiguous because the template is missing. The 12 m/s rotor limit is not an item; it is an explanation.')

spec('07', 'University course registration', 'course-registration',
'A list exported from a ticketing tool: ticket ids, statuses, some tickets are bugs of the old system, not requirements.',
None,
'''
REG-101 | Open | Students register for courses in a window per year of study, 48h each, year 4 first
REG-102 | Open | Prerequisite check at registration, with the list of missing prerequisites shown
REG-103 | Closed-Duplicate | see REG-102
REG-104 | Open | Capacity per course; waiting list with automatic promotion when a seat opens, by timestamp
REG-105 | Open | Timetable clash warning, registration still allowed with dean's approval
REG-106 | Bug | Old system crashes when more than 300 students register at the same time
REG-107 | Open | A student can drop a course until week 3 without a mark on the transcript
REG-108 | Open | Advisors see their students' registrations and can hold a registration pending a meeting
REG-109 | Open | Export of enrolment per course to the department secretaries, xlsx, every night
REG-110 | Open | Erasmus students register through the same system with a provisional student id
REG-111 | Bug | Password reset emails go to the old domain
REG-112 | Open | Fees: a student with unpaid fees from last semester cannot register (finance flag)
REG-113 | Open | Registration confirmation PDF with the student's courses and the timetable
REG-114 | Won't do | Mobile app
REG-115 | Open | Audit log of every registration change, who and when, kept 5 years
REG-116 | Open | Course description page with ECTS, lecturer, language, assessment method
REG-117 | Open | The system must hold 3,000 concurrent registrations in the first hour of the window
''',
[('Registration', ['Registering', 'Enrolment'], ['G07-01','G07-02','G07-03','G07-04','G07-05','G07-08','G07-09']),
 ('People and roles', ['Advisors', 'Students'], ['G07-06','G07-07']),
 ('Data and reporting', ['Exports', 'Records'], ['G07-10','G07-11','G07-12','G07-13'])],
[it('G07-01','Students register in a 48-hour window per year of study, year 4 first.',['48','year 4'],'Registration'),
 it('G07-02','Prerequisites are checked at registration and the missing ones are listed.',['prerequisite','missing'],'Registration'),
 it('G07-03','Courses have a capacity; the waiting list promotes automatically by timestamp when a seat opens.',['waiting list','timestamp'],'Registration'),
 it('G07-04','A timetable clash warns but registration is still allowed with the dean\'s approval.',['clash','dean'],'Registration'),
 it('G07-05','A student can drop a course until week 3 without a transcript mark.',['week 3','transcript'],'Registration'),
 it('G07-06','Advisors see their students\' registrations and can hold one pending a meeting.',['advisor','hold'],'People and roles'),
 it('G07-07','Erasmus students use the same system with a provisional student id.',['Erasmus','provisional'],'People and roles'),
 it('G07-08','A student with unpaid fees from last semester cannot register.',['unpaid','cannot register'],'Registration'),
 it('G07-09','Registration confirmation PDF with the courses and the timetable.',['PDF','timetable'],'Registration'),
 it('G07-10','Nightly xlsx export of enrolment per course to the department secretaries.',['xlsx','nightly'],'Data and reporting'),
 it('G07-11','Audit log of every registration change, who and when, kept 5 years.',['audit','5 years'],'Data and reporting'),
 it('G07-12','Course description page with ECTS, lecturer, language and assessment method.',['ECTS','assessment'],'Data and reporting'),
 it('G07-13','The system holds 3,000 concurrent registrations in the first hour of the window.',['3,000','first hour'],'Data and reporting')],
['a mobile app (REG-114 is Won\'t do)', 'fixing the old system crash (REG-106 is a bug, not a requirement)', 'password reset emails (REG-111 is a bug)', 'REG-103 as a separate item', 'online fee payment', 'grades or transcripts beyond the drop rule'],
'Statuses matter: Bug rows and the Won\'t do row are not items; the Closed-Duplicate row folds into G07-02. Thirteen items from seventeen rows. The model must not convert "Won\'t do" into a Not needed item on the list; it is excluded from the list.')

spec('08', 'Car wash subscription billing', 'carwash-billing',
'Chat export between the owner and a developer friend, informal, with emoji stripped, some lines are jokes, decisions change mid-chat.',
None,
'''
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
''',
[('Plans and pricing', ['Subscriptions', 'Plans'], ['G08-01','G08-02','G08-03','G08-04','G08-08','G08-10']),
 ('Billing', ['Payments', 'Invoicing'], ['G08-05','G08-06','G08-09','G08-13']),
 ('Gate and site', ['Access', 'Operations'], ['G08-07','G08-11']),
 ('Reporting', ['Dashboard'], ['G08-12'])],
[it('G08-01','Three plans per car: Basic 99 lei (4 washes a month), Plus 149 (unlimited exterior), Premium 249 (unlimited everything); the plate number is the id.',['99','149','249','plate'],'Plans and pricing'),
 it('G08-02','Unlimited plans and Basic allow at most one wash per day.',['1','per day'],'Plans and pricing'),
 it('G08-03','A second car on the same account gets 20 percent off with its own plate.',['20','second car'],'Plans and pricing'),
 it('G08-04','Cancel any time; the subscription ends at the end of the paid month, no refunds.',['end of the paid month','no refunds'],'Plans and pricing'),
 it('G08-05','Card on file charged on the 1st; failed payments retry on the 3rd and 5th, then the subscription is suspended.',['1st','3rd','5th','suspend'],'Billing'),
 it('G08-06','Receipts by email; monthly invoices for companies with a CUI, sent to e-Factura.',['CUI','e-Factura','monthly'],'Billing'),
 it('G08-07','The gate camera reads the plate and opens if the plan is active; staff see the plan on the tablet.',['plate','opens','tablet'],'Gate and site'),
 it('G08-08','Gift cards for 3 or 6 months with a code on paper.',['3','6','code'],'Plans and pricing'),
 it('G08-09','A subscription can be paused for up to 2 months a year.',['2 months','pause'],'Billing'),
 it('G08-10','A customer can change the plate at most once a month; staff can always change it.',['once a month','staff'],'Plans and pricing'),
 it('G08-11','No app: web and the gate only.',['no app','web'],'Gate and site'),
 it('G08-12','Dashboard: active subscriptions per plan, churn per month, revenue, and a failed payments list to call.',['churn','failed payments'],'Reporting'),
 it('G08-13','Payments are charged per car, with cards stored on file.',['card on file'],'Billing',duplicate_of='G08-05')],
['a washing machine or laundry feature', 'refunds', 'a mobile app', 'a plan with no daily limit', 'a loyalty programme', 'a Hikvision integration beyond reading the plate'],
'The chat revises itself: at 09:20 Basic also gets the daily limit, so G08-02 covers all plans. G08-13 is listed to test duplicate detection; the runner accepts it merged into G08-05. "lol", "thats it" and the washing machines line are noise.')

spec('09', 'Theatre box office', 'theatre-boxoffice',
'A formal tender-style list with legalistic numbering (3.1.4), long sentences, two items that contradict each other.',
None,
'''
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
''',
[('Ticket sales', ['Sales'], ['G09-01','G09-02','G09-03','G09-04','G09-05']),
 ('Entrance', ['Access control'], ['G09-06','G09-07']),
 ('Reporting and finance', ['Finance'], ['G09-08','G09-09','G09-10']),
 ('Audience', ['Patrons', 'Accounts'], ['G09-11','G09-12']),
 ('Accessibility', [], ['G09-13'])],
[it('G09-01','Tickets for reserved seating sell through the box office, the website and authorised resellers from a single seat map.',['resellers','single seat map'],'Ticket sales'),
 it('G09-02','A seat is held for at most 10 minutes during an online purchase.',['10 minutes'],'Ticket sales'),
 it('G09-03','Discounts (students, pensioners, groups of 15 or more, staff) need proof at the box office; discounted online tickets are validated at the entrance.',['15','proof','entrance'],'Ticket sales'),
 it('G09-04','Season subscriptions of 6 performances with a fixed seat.',['6','fixed seat'],'Ticket sales'),
 it('G09-05','Never sell more than the declared hall capacity: 486 seats and 4 wheelchair spaces.',['486','4'],'Ticket sales'),
 it('G09-06','Tickets scan at the entrance from paper or a phone screen and are accepted once.',['once','phone'],'Entrance'),
 it('G09-07','Entrance scanners work without internet for the whole performance.',['without','performance'],'Entrance'),
 it('G09-08','A settlement report per performance within 30 minutes of its end, by channel and price category.',['30 minutes','channel'],'Reporting and finance'),
 it('G09-09','Author royalties per performance as a percentage of net sales, the percentage set per production.',['royalties','net sales','per production'],'Reporting and finance'),
 it('G09-10','Daily sales export to the accounting system in the Annex C format.',['Annex C','daily'],'Reporting and finance'),
 it('G09-11','Patrons may create an account for purchase history and the programme by email; no account is required to buy.',['not be required','history'],'Audience',ambiguous=True),
 it('G09-12','All purchases require a patron account so marketing can contact the audience.',['require','marketing'],'Audience',ambiguous=True),
 it('G09-13','The website conforms to WCAG 2.1 AA; wheelchair spaces are bookable online with an adjacent companion seat.',['WCAG','companion'],'Accessibility')],
['the contents of Annex C', 'a resolution of the account contradiction (the model flags it, it does not pick a side)', 'a loyalty scheme', 'a mobile app', 'dynamic pricing', 'a seat map for standing performances'],
'3.4.1 and 3.4.2 contradict each other. Both are expected as items, both flagged ambiguous, and the ambiguity flag should name the contradiction. Dropping one of them, or rewriting one to agree with the other, is a failure. "Shall" wording becomes plain sentences in the reader version without losing the numbers.')

spec('10', 'Beekeeping cooperative traceability', 'honey-traceability',
'Mixed: a short list from the cooperative president, then a forwarded message from the lab, then a list of questions nobody answered.',
None,
'''
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
''',
[('Harvest and batches', ['Batches', 'Harvests'], ['G10-02','G10-03','G10-08']),
 ('Lab and quality', ['Lab results'], ['G10-04','G10-10']),
 ('Labels and public page', ['Traceability', 'Consumer page'], ['G10-01','G10-05','G10-09']),
 ('Stock and sales', ['Warehouse', 'Sales'], ['G10-06','G10-07'])],
[it('G10-01','Every jar has a QR code opening a page with the beekeeper, the apiary village (not GPS), the harvest date and the lab result.',['QR','village','not GPS'],'Labels and public page'),
 it('G10-02','Beekeepers record each harvest from their phone: apiary, date, kg, honey type.',['phone','kg','type'],'Harvest and batches'),
 it('G10-03','A batch mixes honey from several beekeepers and its page lists each with their share.',['batch','share'],'Harvest and batches'),
 it('G10-04','Lab results attach to the batch as the lab PDF; the public page shows pass or fail only, not the numbers.',['PDF','pass','not the numbers'],'Lab and quality'),
 it('G10-05','Labels with the batch number and QR print on the cooperative\'s Zebra printer.',['Zebra','batch number'],'Labels and public page'),
 it('G10-06','Warehouse stock in kg per honey type, by batch.',['kg','by batch'],'Stock and sales'),
 it('G10-07','Sales to shops with an invoice per shop; honey leaves stock by batch, oldest first.',['invoice','oldest first'],'Stock and sales'),
 it('G10-08','A beekeeper sees only their own harvests and the batches they are part of.',['only their own'],'Harvest and batches'),
 it('G10-09','No public map of apiaries; the public page shows the village only.',['no','map','village'],'Labels and public page'),
 it('G10-10','Pass or fail thresholds are set per honey type (acacia and polyfloral have different moisture limits); the lab also sends a CSV with HMF, moisture, diastase and pollen origin.',['per honey type','moisture','CSV'],'Lab and quality',ambiguous=True)],
['a public apiary map', 'a price on the public page (open question, not decided)', 'GPS coordinates', 'selling outside the cooperative (open question)', 'hosting arrangements', 'an online shop for consumers'],
'The lab message adds one real requirement (thresholds per honey type) and an option (CSV), expected as one item flagged ambiguous. The three open questions are not items; a model that turns "do we show the price" into a requirement has invented one. Item 9 is a negative requirement and stays.')

# ---------- rows as imported (decision 0037) ----------
# The row a PM imports for each expected item: the source line as it stands, numbering and
# status columns stripped, a correction from later in the document folded into its row, a
# prose sentence cut out as its own row (spec 05). Rows that are not items (meeting notes,
# bugs, Won't do, closed duplicates, open questions, empty rows) have no entry and are never
# imported. The runner feeds these rows, in this order, with no area column.
ROWS = {
 'G01-01': 'Every shop can place the next-day order from a phone or the shop PC, until 16:00. MUST',
 'G01-02': "The order form shows yesterday's order so you can copy it and change the numbers. (Important!!)",
 'G01-03': 'Products that are out of production for the day are greyed out, not hidden.',
 'G01-04': 'Central bakery sees all orders in one list by 16:15 and can print it per oven line.',
 'G01-05': 'a shop manager can set a standing order per weekday that is created automatically if nobody changes it by 15:30 ***',
 'G01-06': 'Order confirmation goes to the shop by SMS and email (or whatsapp?) with the totals.',
 'G01-07': 'Wastage: at closing the shop types what was thrown away per product; the report compares with the order. nice to have',
 'G01-08': 'Same as 2 basically: show last week same day as well, Dana asked for this twice.',
 'G01-09': 'Allergen list per product visible in the order form (legal, must).',
 'G01-10': 'Price changes are set centrally and shops cannot edit prices.',
 'G01-11': 'If the bakery cannot deliver the full quantity, the shop is told before 06:00 what is short.',
 'G01-12': 'Driver app: scan the crate label at drop-off so the shop knows the order arrived. (phase 2?)',
 'G01-13': 'Returns of unsold bread to the central bakery for the animal feed partner, counted per crate.',
 'G01-14': 'the dashboard for the owners: sales vs orders vs wastage per shop per week. must',
 'G01-15': 'Users: shop manager, shop staff (order only, no standing orders), bakery planner, driver, owner.',
 'G01-16': 'Works offline in the shop if the internet drops, syncs later. should',
 'G01-17': 'Order cut-off time can be different per shop (the airport shop closes late).',
 'G01-18': 'See 11 - also tell them the replacement product if there is one.',
 'G02-01': 'online booking for existing clients only, new clients call us (we need to check the animal first)',
 'G02-02': 'a visit takes 20 minutes, a vaccination 10, surgery is whatever the doctor sets; Dr. I: the 20 minutes is wrong for exotic animals, make it 30 for birds and reptiles',
 'G02-03': 'two doctors, two rooms, the X-ray room is shared and must be booked with the visit when needed',
 'G02-04': 'Dr. Iliescu: I need to block my Thursday mornings for surgery and nobody should be able to book a consultation into that block, including online bookings',
 'G02-05': 'reminders: SMS the day before; Ana later: the SMS reminder two days before, not one',
 'G02-06': 'the client file shows the animals, last visit, vaccines due, and the balance owed',
 'G02-07': 'we must be able to see who cancelled late (less than 24h) and how many times',
 'G02-08': 'ok to lose: the paper agenda. Not ok to lose: the ability to overbook an emergency on top of a full day',
 'G02-09': 'Mihnea (owner): I want the daily revenue by doctor on my phone in the morning',
 'G02-10': 'printing the vaccination certificate from the visit, with the stamp image; Dr. I: the certificate must have both languages, Romanian and English, the EU pet passport people ask for it',
 'G02-11': 'the boarding kennel (6 places) is a different calendar but the same client file',
 'G02-12': 'Ana: when a pet is marked deceased the reminders must stop the same day, we had a complaint last month',
 'G02-13': 'Mihnea (owner): Keep it cheap. No app, the website is enough.',
 'G02-14': 'GDPR: clients can ask for their file and we export it',
 'G03-01': 'Search the catalogue by title, author, ISBN and subject',
 'G03-02': 'Reserve a book that is out and get an email when it is back (max 3 reservations)',
 'G03-03': 'Renew online twice, unless someone reserved it',
 'G03-04': "Children's accounts: no fines, parent email on the account",
 'G03-05': 'Fines calculated per day late, capped at the book price (currently done by hand)',
 'G03-06': 'Interlibrary loan request to the county library with status tracking',
 'G03-07': 'Self-checkout kiosk with the card barcode',
 'G03-08': 'Weekly new arrivals list on the website and by email to subscribers',
 'G03-09': 'Branch staff can move a copy between branches and the catalogue shows where it is',
 'G03-10': 'Reading history is private, only the user sees it, can be turned off (legal)',
 'G03-11': 'E-books: link to the national e-lending platform, no own e-book system',
 'G03-12': 'Report: most borrowed titles per branch per month',
 'G03-13': 'Lost card: block the card and issue a new one for 10 lei',
 'G03-14': 'Accessibility: the public site passes WCAG AA',
 'G03-15': 'Prelungirea online de 2 ori, daca nu e rezervata de altcineva (same as L-4, Romanian version from the old list)',
 'G04-01': 'sell day, multi-day and season tickets online and at the 3 ticket offices',
 'G04-02': 'SkiPass+ (the premium season pass) includes 5 friend days, must be redeemable at the gate without going to the office',
 'G04-03': 'Valley Card holders (locals) get the resident price automatically when the card is scanned',
 'G04-04': 'refunds: weather closure of more than 50% of lifts = automatic credit for that day',
 'G04-05': 'group bookings (ski school, 10+) with one invoice and individual tickets',
 'G04-06': 'RFID gates on all 14 lifts, read at 1 m without taking the card out',
 'G04-07': 'Gate 7 (beginner lift) is free for ski school kids under 8 when accompanied by an instructor badge',
 'G04-08': 'a ticket used at two gates more than 10 km apart within 5 minutes is blocked (sharing)',
 'G04-09': 'offline mode for gates: keep validating from the local list for 4 hours if the network drops',
 'G04-10': 'season pass photo taken at the office or uploaded, checked by staff before activation',
 'G04-11': 'renew SkiPass+ for next season at a discount until 30 September',
 'G04-12': 'lost card: block old, issue new, 20 EUR, history transferred',
 'G04-13': 'live count of people on the mountain by lift',
 'G04-14': 'sales by channel by day for finance, exported to the accounting package (they use Saga)',
 'G04-15': 'GDPR: photo and name deleted 2 years after the pass expires',
 'G05-01': 'The site should let a member see the rehearsal calendar for the season and say whether they are coming to each one',
 'G05-02': 'we need to know by the Monday before if we have enough tenors',
 'G05-03': 'If someone misses three rehearsals in a row before a concert, the section leader should be told so they can call them, not an automatic email, a person',
 'G05-04': 'The membership fee is 120 lei a year and we need to see who has paid',
 'G05-05': 'a reminder going out in February and again in March to those who have not paid',
 'G05-06': 'The waiting list people should be able to put their name and voice part on the site themselves, and when a place opens the committee picks someone, it is not first come first served',
 'G05-07': 'members over 70 pay half, and we should not have to remember who that is',
 'G05-08': 'Sheet music: we have the right to share PDFs with members only, so they must be behind a login and not downloadable by the waiting list',
 'G05-09': 'Concert dates with the dress code and the call time, and a page the public can see with the next three concerts and a way to buy tickets, we use a third party for tickets (Eventbook) so just a link',
 'G05-10': 'Carmen wants to keep the notebook, that is fine, but the site is the truth',
 'G06-01': 'open a job on a WTG from the tablet, job types: scheduled service, fault, inspection, retrofit',
 'G06-02': 'LOTO checklist must be completed and signed by 2 techs before the job can go to "in progress" (no exceptions, HSE)',
 'G06-03': 'nacelle work: log the climb, the harness check, and who is the second person on the ground',
 'G06-04': 'parts used: scan the part barcode, stock comes from the container inventory, warns when a part drops below min stock',
 'G06-05': 'time per job per tech, for the OEM warranty claims they want the hours',
 'G06-06': 'photos: before / after, attached to the job, max 10, compressed on the tablet',
 'G06-07': 'the job report is a PDF in the OEM format (they have a template, see attached, not attached sorry) so the warranty people accept it',
 'G06-08': 'SCADA alarm that triggered a fault job is linked to the job by alarm id, we type the id now',
 'G06-09': 'works with no signal up in the nacelle, syncs at the base',
 'G06-10': 'site manager sees all open jobs by WTG and by tech, overdue scheduled services in red; M.D.: the overdue colour, make it configurable not red, we have a colour blind tech',
 'G06-11': 'HSE officer: monthly export of all LOTO records and near misses',
 'G06-12': 'near miss report: 3 fields, what, where, photo, from any tech, anonymous option; M.D.: anonymous to the site, visible to HSE, otherwise we cannot follow up',
 'G06-13': 'weather: the app shows wind speed from SCADA and blocks opening a nacelle job above 12 m/s; M.D.: the wind limit is 15 m/s for nacelle work per the OEM manual, 12 is for the rotor',
 'G06-14': 'retrofit jobs from the OEM bulletin need the bulletin number on the job',
 'G07-01': 'Students register for courses in a window per year of study, 48h each, year 4 first',
 'G07-02': 'Prerequisite check at registration, with the list of missing prerequisites shown',
 'G07-03': 'Capacity per course; waiting list with automatic promotion when a seat opens, by timestamp',
 'G07-04': "Timetable clash warning, registration still allowed with dean's approval",
 'G07-05': 'A student can drop a course until week 3 without a mark on the transcript',
 'G07-06': "Advisors see their students' registrations and can hold a registration pending a meeting",
 'G07-07': 'Erasmus students register through the same system with a provisional student id',
 'G07-08': 'Fees: a student with unpaid fees from last semester cannot register (finance flag)',
 'G07-09': "Registration confirmation PDF with the student's courses and the timetable",
 'G07-10': 'Export of enrolment per course to the department secretaries, xlsx, every night',
 'G07-11': 'Audit log of every registration change, who and when, kept 5 years',
 'G07-12': 'Course description page with ECTS, lecturer, language, assessment method',
 'G07-13': 'The system must hold 3,000 concurrent registrations in the first hour of the window',
 'G08-01': '3 plans: basic 99 lei (4 washes/month), plus 149 (unlimited exterior), premium 249 (unlimited everything). per car, plate number is the id',
 'G08-02': 'unlimited means max 1 wash per day, otherwise the taxi guys will kill us; actually basic also 1 per day max',
 'G08-03': 'second car 20% off, same account, separate plates',
 'G08-04': 'cancel anytime, ends at the end of the paid month, no refunds',
 'G08-05': 'card on file, charged on the 1st, if it fails retry on the 3rd and 5th then suspend',
 'G08-06': 'receipts by email, invoices for companies with CUI, monthly; for companies it has to go to e-factura, that is law now',
 'G08-07': 'the gate reads the plate (we have the camera already, Hikvision) and opens if the plan is active, staff see the plan on the tablet',
 'G08-08': 'gift cards for xmas, 3 or 6 months, code on paper',
 'G08-09': 'pause: a sub can be paused up to 2 months a year, e.g. when they go abroad',
 'G08-10': 'plate change: customer changes the plate himself, max once a month, staff can always',
 'G08-11': 'no app. web + the gate.',
 'G08-12': 'dashboard: active subs per plan, churn per month, revenue, and failed payments list so the girls can call them',
 'G08-13': 'payments per car with the card on file (repeated from 09:12 and 09:13)',
 'G09-01': 'The system shall allow the sale of tickets for reserved seating performances through the box office, the website and authorised resellers, with a single seat map.',
 'G09-02': 'The system shall hold a seat for a maximum of 10 minutes during an online purchase.',
 'G09-03': 'The system shall apply the discount schedule (students, pensioners, groups of 15 or more, staff) upon presentation of the relevant proof at the box office; online purchases of discounted tickets shall be validated at the entrance.',
 'G09-04': 'The system shall support season subscriptions of 6 performances with a fixed seat.',
 'G09-05': 'The system shall not permit the sale of more tickets than the hall capacity as declared to the fire authority (486 seats, 4 wheelchair spaces).',
 'G09-06': 'Tickets shall be scanned at the entrance from paper or a phone screen; a ticket shall be accepted once.',
 'G09-07': 'The system shall operate the entrance scanners without an internet connection for the duration of a performance.',
 'G09-08': 'A settlement report per performance shall be available within 30 minutes of the end of the performance, showing sales by channel and by price category.',
 'G09-09': 'Author royalties shall be computed per performance as a percentage of net sales, with the percentage set per production.',
 'G09-10': 'The system shall export daily sales to the accounting system in the format annexed (Annex C).',
 'G09-11': 'Patrons may create an account to see their purchase history and receive the programme by email; an account shall not be required to buy a ticket.',
 'G09-12': 'All ticket purchases shall require a patron account so that the marketing department can contact the audience.',
 'G09-13': 'The website shall conform to WCAG 2.1 level AA; wheelchair spaces shall be bookable online with a companion seat adjacent.',
 'G10-01': 'every jar has a QR code that opens a page with the beekeeper, the apiary location (village, not GPS), the harvest date and the lab result',
 'G10-02': 'beekeepers record each harvest from their phone: apiary, date, kg, honey type',
 'G10-03': 'the cooperative mixes honey from several beekeepers into one batch, the batch page lists all of them with their share',
 'G10-04': 'lab results are attached to the batch, PDF from the lab, and the page shows pass/fail only, not the numbers',
 'G10-05': "label printing with the batch number and the QR, on the cooperative's Zebra printer",
 'G10-06': 'stock: how many kg of each honey type is in the warehouse, by batch',
 'G10-07': 'sales to the shops, invoice per shop, honey leaves the stock by batch (oldest first)',
 'G10-08': 'a beekeeper sees only their own harvests and the batches they are part of',
 'G10-09': 'the mayor wants a public map of the apiaries. NO. village only, see 1',
 'G10-10': 'From the lab (Dr. Pop): we can send the results as PDF and as a CSV with the parameters (HMF, moisture, diastase, pollen origin). If you want pass/fail we need the thresholds from you per honey type. Acacia and polyfloral have different moisture limits.',
}

# ---------- emit ----------
spec_index = []
for s in SPECS:
    md = [f"# Golden spec {s['id']}: {s['domain']}", '', f"Format: {s['format_note']}", '']
    if s['context']:
        c = s['context']
        md += ['## Project context (decision 0011)', '', f"Goal: {c['goal']}", '', f"Audience: {c['audience']}", '', 'Terms to keep as written: ' + ', '.join(c['glossary']), '']
    else:
        md += ['Project context: none.', '']
    for i in s['items']:
        assert i['ref'] in ROWS, (s['id'], i['ref'], 'no row')
        i['row'] = ROWS[i['ref']]
    md += ['## Document as received', '', '```text', s['doc'], '```', '',
           '## Rows as imported (decision 0037)', '',
           'What a PM imports from the document above: one row per item, nothing else. The runner feeds these rows with no area column.', '', '```text']
    md += [f"{n + 1}. {i['row']}" for n, i in enumerate(s['items'])]
    md += ['```', '', '## Expected, in words', '',
           f"{len(s['items'])} rows, {len([i for i in s['items'] if not i.get('duplicate_of')])} distinct items in {len(s['areas'])} areas (" + ', '.join(a[0] for a in s['areas']) + '). ' + s['notes'], '',
           'The exact expectation is in expected/' + s['id'] + '.json.', '']
    (ROOT / 'specs' / f"{s['id']}-{s['slug']}.md").write_text('\n'.join(md))
    exp = {
        'id': s['id'], 'domain': s['domain'], 'source': f"specs/{s['id']}-{s['slug']}.md",
        'context': s['context'],
        'item_count': len(s['items']),
        'item_count_tolerance': 0,
        'area_count_tolerance': 1,
        'areas': [{'name': a[0], 'aliases': a[1], 'items': a[2]} for a in s['areas']],
        'items': s['items'],
        'must_not_invent': s['must_not_invent'],
        'notes': s['notes']
    }
    (ROOT / 'expected' / f"{s['id']}.json").write_text(json.dumps(exp, indent=2, ensure_ascii=False) + '\n')
    spec_index.append((s['id'], s['domain'], s['slug'], len(s['items']), len([i for i in s['items'] if not i.get('duplicate_of')]), len(s['areas']), bool(s['context']), sum(1 for i in s['items'] if i.get('ambiguous')), sum(1 for i in s['items'] if i.get('duplicate_of'))))
    # consistency: every area item exists, every item in exactly one area
    refs = {i['ref'] for i in s['items']}
    in_areas = [r for a in s['areas'] for r in a[2]]
    assert set(in_areas) == refs and len(in_areas) == len(refs), (s['id'], set(in_areas) ^ refs)
    for i in s['items']:
        assert i['area'] in [a[0] for a in s['areas']], (s['id'], i['ref'])
        assert i['ref'] in next(a[2] for a in s['areas'] if a[0] == i['area']), (s['id'], i['ref'], 'area mismatch')
print('| Spec | Domain | Rows imported | Distinct items | Areas | Context | Ambiguous | Duplicates |')
for r in spec_index: print(f"| {r[0]} | {r[1]} | {r[3]} | {r[4]} | {r[5]} | {'yes' if r[6] else 'no'} | {r[7]} | {r[8]} |")
