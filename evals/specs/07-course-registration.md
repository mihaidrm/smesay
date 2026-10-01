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

## Expected, in words

13 distinct items in 3 areas (Registration, People and roles, Data and reporting). Statuses matter: Bug rows and the Won't do row are not items; the Closed-Duplicate row folds into G07-02. Thirteen items from seventeen rows. The model must not convert "Won't do" into a Not needed item on the list; it is excluded from the list.

The exact expectation is in expected/07.json.
