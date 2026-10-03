# PM app copy

Strings on the signed-in side that are not errors (those are in errors.md). Written 2026-10-02
with E2-1; each story that adds a screen adds its strings here first, then in the code. Scan with
`node scripts/scan-copy.mjs docs/copy` before adding a line.

## Sign-in (E2-1)

| Where | Text |
|---|---|
| Title | Sign in |
| Help line under the title | Enter your email and we send you a link. No password to remember. |
| Field label | Email |
| Button | Send me a link |
| Status box after sending | Check your email. The link works once and stops working in [N] minutes. |
| Link-used page title | This sign-in link has already been used or has expired. |
| Link-used page line | Ask for a new one. |
| Link-used page button | Send a new link |
| Divider under the email form (E2-2, only when Google is configured) | or |
| Google button (E2-2) | Continue with Google |
| Google-failed page title, line and button (E2-2) | Sign-in with Google did not complete. / Try again, or use the email link. / Back to sign-in |

## Workspace step (E2-3)

| Where | Text |
|---|---|
| Create page title | Name your workspace |
| Create page line | The sample project comes with it, so there is something to look at. |
| Field label | Workspace name |
| Button | Create workspace |
| Switch page title | Choose a workspace |
| Switch page line | Pick the workspace to work in. |
| Switch page line when the current workspace was removed | The workspace you were in is no longer available to you. Pick another one to work in. |
| Signed-in line under both pages | Signed in as [EMAIL]. |

## Settings, brand and plan (E2-5)

| Where | Text |
|---|---|
| Page line | Name, logo and accent appear on every instrument. |
| Card title | Brand on the respondent side |
| Name field label | Workspace name |
| Logo label and line | Logo. PNG or SVG, up to 1 MB. Shown at 24 px in the respondent header in place of the mark. |
| Logo, none yet (a member's view) | No logo yet |
| Logo remove checkbox | Remove logo |
| Accent label | Accent colour |
| Accent line, readable | Contrast on white [RATIO]:1. Used on the selected answer, the active chapter and the progress bar. Buttons stay ink. |
| Accent line, none set | No accent set. The respondent page uses violet. |
| Save button | Save |
| Line after saving | Saved. Your instruments carry the new name, logo and accent. |
| Plan card title and value | Plan, Free |
| Plan pill | While we build it with the first users |
| Plan note | Paid plans come later. Nothing you build now is lost or locked. |
| Usage line under the plan note (E2-6) | [N] projects, [N] responses this month, [N] AI runs this month. |
| Note | No AI budget on the page: the workspace budget will be set and seen in the admin area only (decision 0036; E14-2, not built yet). |

## Settings, Members (E2-4)

| Where | Text |
|---|---|
| Sidebar nav item (design v2; was a link beside the workspace name) | Settings |
| Page title | Workspace settings |
| Page line | Name, logo and accent appear on every instrument created after you save. |
| Section title | Members |
| Section line | Owners manage the workspace and its members. Members can do everything else. |
| Table headers | Name, Email, Role, Joined |
| Row of a person without a name | No name yet |
| Marker on the signed-in person's row | you |
| Role control values | Owner, Member |
| Role control label for screen readers | Role of [EMAIL] |
| Row of an open invitation, name column | Invited |
| Remove button | Remove |
| Field label and placeholder | Invite by email, name@company.example |
| Button | Send invite |
| Line after sending | Invite sent. They get a sign-in link that works once and expires in [N] minutes. |

## Projects and the project frame (E3-1)

| Where | Text |
|---|---|
| Projects page title, archived view | Projects, Archived projects |
| Projects page line | One project per validation. |
| New project button | New project |
| Table headers | Project, Items, Responses, Status, Updated (project.updated_at: the last context save, archive or unarchive) |
| Responses cell | [N] of [N] |
| Status values | Draft, Open, Closed, Sample |
| Updated cell of the sample | Created with the workspace |
| Row buttons | Open, Delete sample (then the confirm line from errors.md with Cancel and Delete sample) |
| Empty state when the workspace has no project of its own, archived ones included | No projects yet. Start one and import your list. [New project] |
| Empty state when every project is archived and the sample is deleted (the list is empty) | All your projects are archived. Unarchive one from the archived list, or start a new one. [Show archived] [New project] |
| Empty state of the archived view | No archived projects. Archived projects appear here. |
| Links under the table | Show archived, Back to projects |
| New project title and line | New project. A name is enough. The list comes on the next step. |
| New project field and button | Project name, Create project |
| Project frame breadcrumb | [WORKSPACE NAME] (the sample: [WORKSPACE NAME] · sample project) |
| Archived marker and buttons | Archived; Archive project, Unarchive |
| Stepper | Import, Shape, Build, Share, Results |
| Import step title | Import the list |
| About card title | About this project |
| About card line | A few words on what the list is for and who answers. The AI reads this when it groups and rewrites the items and when it writes the actions. It is not shown to respondents; the intro they see is set in Build. |
| About card fields | What is this about?; Terms to keep as written, optional (placeholder: Product names, internal acronyms, the client's own labels) |
| About card count | [N] of 2,000 characters |
| About card button and saved line | Save; Saved. |
| About card on the sample | The sample project cannot be edited. |

## Import, upload and preview (E3-2)

| Where | Text |
|---|---|
| Upload card title and line | The list. Upload the spreadsheet you already have. We find the header row and show the first ten rows before anything is imported. |
| File field label | Your file (after the first upload: Upload another file) |
| File field line | xlsx or csv, up to 5 MB and 2,000 rows. One item per row; the columns are mapped on the next card. |
| Upload button | Upload |
| Preview card title | Preview |
| Summary line (the board's wording) | [FILE], [N] rows read, header found on row [N]. (no header: [FILE], [N] rows read, no header row found.) |
| Sheet picker | Sheet; Show sheet |
| Header row picker | Header row; No header row, Row [N]; Use this row (both pickers show a loading button while the file is re-read) |
| Column headers | [LETTER] [NAME] (the letter alone when there is no header) |
| Line under the rows | The first 10 of [N] rows. |
| Empty sheet | This sheet has no rows. Pick another sheet, or upload another file. |

## Import, paste a list (E3-4)

| Where | Text |
|---|---|
| Link under the file input | Paste a list instead |
| Box label | Paste a list |
| Box placeholder, two lines | Receipts captured by phone; then: Approval from the notification email \| Approving \| Must |
| Line under the box | One item per line. Add an area and a proposed value with a bar: text \| area \| value. |
| Button | Use this list |
| Summary line of a pasted list | Pasted list, [N] items. |
| Column headers of a pasted list | A Item, B Area, C Proposed value (no header row, no pickers) |
| File name in the import log (E3-6) | Pasted list |

## Import, check and commit (E3-5)

| Where | Text |
|---|---|
| Check card title (board) | Check before import |
| The three counts (board, errors.md) | [N] empty rows, skipped. / [N] exact duplicates, imported once. / [N] items over 1,000 characters, imported whole; consider splitting them in Shape. |
| Fourth line, only above zero | [N] proposed values not recognised, kept as written. |
| Rows under a count | Row [N]; Row [N], same as row [N]; Row [N]: [VALUE] |
| Import button | Import [N] items (disabled at 40 percent without a text column or with nothing to import) |
| After the import, in the check card | Imported as version [N]. |
| Under the Import title, once a set exists | Imported [N] items as version [N] on [DATE]. Import a new version (a link to the upload card) |
| Check card without a text column | Pick the column that holds the item text above, and the check appears here. |

## Import, versions (E3-6)

| Where | Text |
|---|---|
| Log card title | Versions |
| Table headers | Version, Source, File, Imported, Items, Checks, By |
| Version cell | Version [N] (a link to the read-only version) |
| File cell of a pasted list | Pasted list |
| Checks cell | [N] empty, [N] duplicates, [N] long, [N] values (singular at 1) |
| Diff line under the table | Version [N] to [N]: [N] items unchanged, [N] changed, [N] new, [N] gone. |
| Version page title and line | Version [N]. [FILE], imported [DATE], [N] items. Read-only. Back to Import |
| Version page headers | #, Ref, Item, Area, Proposed value |

## Shape (E4-2)

| Where | Text |
|---|---|
| Title | Shape the list |
| Intro, before the first run | The AI groups the items into areas, orders the areas with a reason each, and writes a readable version of every item. The originals are never changed. |
| Button, before the first run | Shape with AI |
| Button, while running | Shaping... |
| Button, after a run | Run again |
| Grouped line, after a run | AI grouped [N] items into [M] areas and wrote a readable version of each. [A] of [R] reader versions accepted. Run again replaces the areas the AI chose. Items you moved stay where they are. |
| Counter alone, on the sample (E4-3) | [A] of [R] reader versions accepted. |
| Title row, while suggested versions exist (E4-3) | Accept all, Reject all |
| Confirm lines for the two (E4-3) | Accept all [N] suggested reader versions? / Reject all [N] suggested reader versions and keep the originals? [Buttons: Accept all or Reject all, Cancel] |
| Item: the reader version, then the original under it (E4-3) | [reader version] / Original: [original] |
| Item: the reader version is the original again (E4-3) | The readable version is the same as the original, so there is nothing to accept. (no pill, no buttons) |
| Item pills (E4-3; pushed back, agree and disagree tints) | Suggested / Reader version used / Original kept |
| Item buttons (E4-3) | Accept, Edit, Reject while suggested; Undo once decided; Save and Cancel in the edit, whose field is labelled "Readable version of [ref]". Saving the original's own words back counts as Reject: the original is kept and the suggestion stays for Undo. |
| Item without a reader version, through the server (E4-3) | This item has no reader version. Run Shape with AI first. |
| Context line under the grouped line, not on the sample (E4-5, PM app board ctxLine): after a run, what it was given; before one, what the next run will get; "none given" stands for a blank goal | Context used: [goal]. Kept as written: [terms]. / Context the AI will use: [goal]. Kept as written: [terms]. / No project context given. Add one on Import so the AI keeps your names and terms. [Link: Add it on Import] |
| After the line, when the context on Import differs from the one the run used (E4-5) | The context on Import has changed since this run; Run again to use it. |
| Flag banners above the areas, one per flag (an item with both has two; Dismiss hides both), the refs as links to the rows (E4-4) | Ambiguity in [REF]. [What the item does not say]. Respondents may mark it unclear. [Dismiss] / [REF] may duplicate [REF]. If they ask for the same thing, remove one in the file and import it again. [Dismiss] |
| Item notes under the text, one line per flag (E4-4) | Ambiguity: [what the item does not say]. / May duplicate [REF]. |
| Dismiss on an item without a flag, through the server (E4-4) | This item has no flag to dismiss. Reload the page to see the flags as they are now. |
| Area header | [Name] [rationale, the model's one sentence] |
| Group of items without an area, before a run | Not shaped yet |
| Pill on an item the model placed (the import had an area column and the item none) | Placed by AI |
| Pill on an item the PM moved | Moved by you |
| Per item: the select (its label is visually hidden) and its button; the keyboard path, dragging an item onto an area does the same | Move [ref] to [area], Move |
| Empty state, no list yet | Import a list first. Shape works on the latest version. [Link: Go to Import] |
| Refusals, from the model call and from the size checks | docs/copy/errors.md, Shaping; shown beside the button, with Try again where a second try can help |

## Build (E5-1)

| Where | Text |
|---|---|
| Title | Build the instrument |
| Line under the title | What respondents see, from version [N] of the list. The preview on the right follows every save. |
| Empty state, no list yet | Import a list first. Build works on an imported version. Go to Import |
| Newer version card (E3-6, acceptance 3) | Version [N] of the list was imported after this instrument was built on version [M]. The instrument keeps version [M] until you build on the new one; the intro and the fields are copied over. [Button: Build on version [N]] |
| Intro card title and fields | Intro; Title (the project name by default), Intro |
| Intro hint, while the intro is empty | Write one or two lines so respondents know what the list is for. They see this first. |
| Intro count | [N] of 1,000 characters |
| Fields card title and line | Respondent fields. What respondents fill in before they rate. Required fields must be filled before Start. |
| Field row | Label; Type (Text, Dropdown, Email); Required (a switch); Remove (each control is named with its field for screen readers: "Required, Name", "Remove Name", "field 2" while the label is empty) |
| Dropdown options | Options, one per line |
| Buttons | Add a field (disabled at 8), Save (secondary, both cards); Saved. (until the next change) |
| Fields card on the sample | [LABEL] with Text, required / Dropdown, [N] options, required / Email, optional; The sample project cannot be edited. |
| Preview panel (E5-6 fills it in) | Preview; Phone; Highlighted: what this step changes. The fields respondents fill in. |

## About you (the respondent instrument, E5-1 preview and E7-1)

| Where | Text |
|---|---|
| Preview strip (E5-6, acceptance 4) | Preview: nothing you enter here is saved |
| Header | [WORKSPACE INITIALS] [WORKSPACE NAME] |
| Title and intro | [INSTRUMENT TITLE], [INTRO] |
| Field label | [LABEL] (an optional field: [LABEL] (optional)) |
| Dropdown first option | Choose one |
| Footer line | Your answers go to the project team at [WORKSPACE NAME]. They are saved as you go on this device, so you can close this page and come back. |
| Powered by | Powered by SMEsay |
| Start button | Start with [FIRST CHAPTER] (Start, while the list has no areas) |
| Hint under a disabled Start | Fill in your name and role to start. (while the required fields are exactly Name and Role; otherwise, decision 0043: Fill in the required fields to start.) |

## Import, column mapping (E3-3)

| Where | Text |
|---|---|
| Mapping card title | Column mapping |
| Row | [HEADER] (or Column [LETTER] without a header), Column [LETTER], maps to |
| Roles | Item text, Area, Proposed value, Reference, Custom field, Do not import (the board's wording; the story said Ignore) |
| Sixth custom field | Custom field (up to five custom fields), disabled |
| Remembered line, above the card | Mapping remembered from [DATE] |
| Footer line | This mapping is remembered for files with the same headers. |

## Signed-in shell (E2-1, E2-3)

| Where | Text |
|---|---|
| Sidebar, workspace block label | Workspace |
| Sidebar, member count | 1 member / [N] members |
| Sidebar, settings nav item | Settings |
| Sidebar, projects label and link | Projects, All |
| Sidebar and list, sample pill | Sample |
| Sidebar footer button | Sign out |
| Sidebar, sample card title, line and button (design v2) | Try the sample / [SAMPLE NAME]: every screen has data, nothing to set up. / Open the sample |
| Sidebar, mode toggle label and state (design v2) | Dark mode (the switch's name); Light / Dark |
| Projects page, stat tiles (design v2) | [N] project(s) of your own / [N] response(s) this month / [N] AI run(s) this month |
| Projects page, archive buttons | Show archived / Back to projects |
| Projects page breadcrumb | [WORKSPACE NAME] |
| Loading state of any page | Loading. |
| Error state of any page, title | The server could not finish this request. |
| Error state of any page, line | It has been logged. Try again in a minute. |
| Error state button | Try again |
| 404 page title and line (errors.md) | This page does not exist. Check the address, or go to your projects. |
| 404 page button | Go to your projects |
