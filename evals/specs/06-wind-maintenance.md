# Golden spec 06: Wind farm maintenance logging

Format: Technician shorthand, abbreviations, numbers everywhere, a second author appended corrections at the bottom. Has a context block.

## Project context (decision 0011)

Goal: Replace the paper maintenance log for a 22-turbine onshore wind farm with a tablet app that technicians use on the turbine.

Audience: Technicians, the site manager, the HSE officer and the asset owner's engineer, who will answer the list.

Terms to keep as written: WTG, LOTO, SCADA, nacelle, HSE, OEM

## Document as received

```text
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
```

## Expected, in words

14 distinct items in 4 areas (Jobs, Safety, Parts, Oversight). Context spec (decision 0011). Glossary terms WTG, LOTO, SCADA, nacelle, HSE and OEM stay as written; "turbine" for WTG is accepted only in addition, never instead. The corrections at the bottom override the list: 15 m/s, configurable colour, anonymous to the site but visible to HSE. G06-07 is flagged ambiguous because the template is missing. The 12 m/s rotor limit is not an item; it is an explanation.

The exact expectation is in expected/06.json.
