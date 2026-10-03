# Golden spec 07: University course registration

Format: A list exported from a ticketing tool: ticket ids, statuses, some tickets are bugs of the old system, not requirements.

Project context: none.

## Document as received

```text
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
```

## Rows as imported (decision 0037)

What a PM imports from the document above: one row per item, nothing else. The runner feeds these rows with no area column.

```text
1. Students register for courses in a window per year of study, 48h each, year 4 first
2. Prerequisite check at registration, with the list of missing prerequisites shown
3. Capacity per course; waiting list with automatic promotion when a seat opens, by timestamp
4. Timetable clash warning, registration still allowed with dean's approval
5. A student can drop a course until week 3 without a mark on the transcript
6. Advisors see their students' registrations and can hold a registration pending a meeting
7. Erasmus students register through the same system with a provisional student id
8. Fees: a student with unpaid fees from last semester cannot register (finance flag)
9. Registration confirmation PDF with the student's courses and the timetable
10. Export of enrolment per course to the department secretaries, xlsx, every night
11. Audit log of every registration change, who and when, kept 5 years
12. Course description page with ECTS, lecturer, language, assessment method
13. The system must hold 3,000 concurrent registrations in the first hour of the window
```

## Expected, in words

13 rows, 13 distinct items in 3 areas (Registration, People and roles, Data and reporting). Statuses matter: the Bug lines, the Won't do line and the Closed-Duplicate line are not rows. Thirteen rows from seventeen lines.

The exact expectation is in expected/07.json.
