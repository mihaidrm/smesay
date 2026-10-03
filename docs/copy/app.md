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
| Status values | Draft, Open, Scheduled (E6-1: a link that opens later), Closed, Sample |
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
| Perspective chips under an item (E5-4; a group named "Perspectives of [REF]") | one chip per perspective of the newest instrument, pressed when the item carries it; none while the instrument has none, is published or is built on another version |
| Line under the grouped line when the instrument has perspectives but no chips show (E5-4) | These items are on version [N] of the list; the instrument is built on version [M]. Build on version [N] first, then tag items here. Go to Build / Published instruments keep their perspectives and tags. Build a new instrument to change them. |
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
| Newer version card (E3-6, acceptance 3) | Version [N] of the list was imported after this instrument was built on version [M]. The instrument keeps version [M] until you build on the new one; the intro, the fields, the scoring and the perspective names are copied over. Items are tagged again on Shape. [Button: Build on version [N]] |
| Intro card title and fields | Intro; Title (the project name by default), Intro |
| Intro hint, while the intro is empty | Write one or two lines so respondents know what the list is for. They see this first. |
| Intro count | [N] of 1,000 characters |
| Scoring card title and line (E5-2) | Scoring. How respondents rate each item. Changing the method empties nothing on a draft; a published instrument keeps its method. |
| Method cards (E5-2; the board's three) | Method: MoSCoW (Must, Should, Could, Not needed); 1 to 5 fit (How well the item fits the need); Keep, change, drop (For reviewing an existing list) |
| Proposed value switch (E5-2, decision 0003) | Show the proposed value to respondents. On: they agree or push back on your proposal. Off: they rate blind. Both feed the same dashboard. |
| Labels (E5-2) | Labels, optional. Rename a value for your respondents. The dashboard and the exports use the same word. Up to 20 characters. (one field per value, named "Label for [VALUE]", the default as placeholder) |
| Scoring card once published (E5-2) | Published instruments keep their method. Build a new instrument to change it. (the method, the switch and the labels disabled; the layout stays) |
| Layout cards (E5-3; the board's three, chapters first and default) | Layout. How the list is split into screens. Chapters are the default; a published instrument can still change its layout. Chapters (One area per screen, compact cards); One item per screen (One card at a time, with the chapter row); Single long page (Every area in order, no chapter row) |
| Items preview per layout (E5-3) | The chapter row: About you, every area (the first active), Wrap up, fading at the right edge when long. One item per screen: "Item 1 of [N] in [AREA]" (the instrument's title when the list has no areas) over one card; Single long page: "All [N] on one page", every area with its heading (items without an area under "Not shaped yet", as on Shape), no chapter row; Chapters: the chapter row and the first area's cards. Under an area with fewer cards drawn than it holds: "The first [N] of [M] items. The rest follow in the same way." |
| Scoring card on the sample | Method: [METHOD]: [LABELS], Unclear; Show the proposed value to respondents: On / Off; The sample project cannot be edited. |
| Perspectives card (E5-4) | Perspectives. Groups of respondents who see different items. An item with no perspective goes to everyone. Leave empty to show every item to everyone. Field: Perspectives, one per line. Under it: "[N] of [M] items carry a perspective. Tag items on Shape. Go to Shape" or "No perspectives yet. Every item goes to everyone." |
| Perspectives card once published (E5-4) | Published instruments keep their perspectives and tags. Build a new instrument to change them. (the field disabled, no Save, no link to Shape) |
| Perspectives card on the sample | [NAMES]. or "No perspectives yet. Every item goes to everyone." then The sample project cannot be edited. |
| Closing card (E5-5) | Closing. How the journey ends. Respondents review what they said, add what is missing, say how sure they are and sign off. Fields: Closing question, optional (hint: One open question at the end, up to 200 characters. Leave empty to ask none.); Ask for missing items (a switch; On: respondents can name an item the list lacks, with an area and a proposed value.); Ask how confident they are (Always asked, 1 to 5. The dashboard shows the spread.; a pill "Always on", no switch); Sign-off text (hint: What respondents tick before they submit, up to 300 characters.; prefilled with "I confirm these are my answers and they can be shared with the project team.") |
| Closing card once published (E5-5) | Published instruments keep their closing question. Build a new instrument to change it. (the question disabled; the switch and the sign-off still change) |
| Closing card on the sample | Closing question, optional: [QUESTION] or Off; Ask for missing items: On / Off; Ask how confident they are: Always on; Sign-off text: [TEXT]; The sample project cannot be edited. |
| Fields card title and line | Respondent fields. What respondents fill in before they rate. Required fields must be filled before Start. |
| Field row | Label; Type (Text, Dropdown, Email); Required (a switch); Remove (each control is named with its field for screen readers: "Required, Name", "Remove Name", "field 2" while the label is empty) |
| Dropdown options | Options, one per line |
| Buttons | Add a field (disabled at 8), Save (secondary, both cards); Saved. (until the next change) |
| Fields card on the sample | [LABEL] with Text, required / Dropdown, [N] options, required / Email, optional; The sample project cannot be edited. |
| Preview panel (E5-6 fills it in) | Preview; Phone; Highlighted: what this step changes. The fields respondents fill in, the chapter row and the rating row. (on the Wrap up screen, E5-5: Highlighted: what the Closing card changes. The missing-item form, the closing question and the sign-off; confidence is always asked.) |
| Preview screen switch (E5-2 and E5-5; the control is named "Preview screen"; focusing or clicking the Closing card opens Wrap up) | About you, Items, Wrap up (the Items screen: the workspace name, "0 of [N]" over the whole list, the chapter pills, "[AREA] [N] items", up to ten cards, then "The first 10 of [N] items. The rest follow in the same way."; an empty chapter: "No items in this chapter yet.") |

## Share (E6-1)

| Where | Text |
|---|---|
| Title and line | Share the list. One link anyone can open between the dates. Built on version [N] of the list. |
| Empty state, no instrument yet | Build the instrument first. Share sends what Build made. [Link: Go to Build] |
| Link card title and state pill | Public link; Draft / Published / Revoked (E6-4) |
| Note under the pill | Draft: Not published yet. Nobody can open the link. Published: Anyone with the link can respond until the close date. Published, opens later: The link opens on [DATE AND TIME UTC]. Until then it shows the opening date. Closed by its date: The link is closed. Respondents see the closed page. Revoked (E6-4): The link now shows a page saying it was withdrawn. Answers already given are kept. |
| Draft card under the link, after Build on version N on a published project | Draft on version [N] (pill: Draft). Version [N] is built but not published; the link above is on version [M]. Publishing version [N] makes a new link, and the link above closes then. (the same form, with Publish) |
| Link row, once published | [LINK] (a read-only field named Link) [Button: Copy link, then Copied. for two seconds] |
| Date fields | Opens (hint: Leave empty to open as soon as you publish.); Closes; under them: Times in [ZONE], your browser's time zone. |
| Passcode field | Passcode, optional (hint: At least 6 characters. Respondents type it once per device. Once set: A passcode is set. Type a new one to change it. [Checkbox: Remove the passcode]) |
| Buttons | Publish (primary, on a draft); Save (secondary, once published); Saved. (until the next change) |
| Link card on the sample | Opens: [DATE AND TIME UTC]; Closes: [DATE AND TIME UTC]; The sample project cannot be edited. |
| Personal invites card (E6-2), title and line | Personal invites. One link per person, sent by email from you. Each answers under their name and can carry on from any device. |
| Personal invites box | People, one per line (hint: Addresses apart by commas, spaces or new lines. A name and a role may follow an address after commas: ana@company.example, Ana Pop, Finance). Before the public link is published the box is off and the hint reads: Publish the public link first. Personal links take its open and close dates. [Button: Send] |
| After Send | [N] invites sent. (1 invite sent.) Under it, one line per address that was not sent (docs/copy/errors.md). The box clears when every invite went. |
| Invite list | Columns: Person ([NAME], then [EMAIL], [ROLE] under it; the email alone when no name); Status: Invited / In progress / Submitted / Not sent (with the provider's reason under it), and the last save or submit as [DATE AND TIME UTC] under the pill; Reminders: None sent, or [N] sent, last [DATE AND TIME UTC] (E6-3 sends them). Remind and Revoke per row come with E6-3 and E6-4. |
| Invite list, empty | Nobody invited yet. |
| Personal invites on the sample | The sample project cannot be edited. (the list shows) |

## Respondent link pages (E6-1; the words in docs/copy/errors.md, Respondent link states)

| Where | Text |
|---|---|
| Header | [WORKSPACE INITIALS] [WORKSPACE NAME] (the SMEsay mark when the link matches no workspace) |
| Passcode page | This link needs a passcode. The person who sent you the link has it. You type it once on this device. Field: Passcode. [Button: Continue] |
| Dates on these pages | [DATE AND TIME] UTC, as "6 Oct 2026, 09:00 UTC" |

## Respondent card (E5-2 preview and E7-2)

| Where | Text |
|---|---|
| Rating row label | Your rating |
| Pills, MoSCoW | Must, Should, Could, Not needed, Unclear (or the PM's labels) |
| Pills, 1 to 5 fit | 1, 2, 3, 4, 5, Unclear, with "no fit" under 1 and "fits fully" under 5 |
| Pills, keep change drop | Keep, Change, Drop, Unclear |
| Caption under the proposed pill | proposed |
| Footer note before an answer | Not rated yet (then the picked label; "Saved" and the missing lines are E7-2 and E7-3) |

## About you (the respondent instrument, E5-1 preview and E7-1)

| Where | Text |
|---|---|
| Preview strip (E5-6, acceptance 4) | Preview: nothing you enter here is saved |
| Header | [WORKSPACE INITIALS] [WORKSPACE NAME], and on a live link (E6-1): Closes [DATE AND TIME UTC] |
| Personal link (E6-2), above the fields | Answering as [NAME], [ROLE]. The person who invited you filled this in. Tell them if it is wrong. (the fields the invite carries are not asked) |
| Title and intro | [INSTRUMENT TITLE], [INTRO] |
| Field label | [LABEL] (an optional field: [LABEL] (optional)) |
| Dropdown first option | Choose one |
| Footer line | Your answers go to the project team at [WORKSPACE NAME]. They are saved as you go on this device, so you can close this page and come back. |
| Powered by | Powered by SMEsay |
| Start button | Start with [FIRST CHAPTER] (Start, while the list has no areas) |
| Perspectives question (E5-4; only when the instrument has perspectives) | Which of these describe you? Pick every one that fits. You see the items for your perspectives and the ones for everyone. (checkboxes, one per perspective) |
| Items screen when the picks leave nothing to rate (E5-4; in the preview now, the real screen in E7-4) | Nothing to rate yet. Go back to About you and pick the perspectives that describe you. |
| Hint under a disabled Start | Fill in your name and role to start. (while the required fields are exactly Name and Role; otherwise, decision 0043: Fill in the required fields to start.) |

## Wrap up (the respondent instrument, E5-5 preview and E7-5)

| Where | Text |
|---|---|
| Header | [WORKSPACE NAME], [ANSWERED] of [TOTAL] |
| Title | Wrap up |
| Tally tiles (decision 0018 item 5) | Agreed, Higher priority, Lower priority, Not needed, Unclear; rate-blind: Rated, Not needed, Unclear |
| Gaps box | [N] still to finish. [Button: Go to [FIRST CHAPTER]] |
| When nothing is left to review (E7-5) | You agreed with every proposed value. Nothing to review here. |
| When the respondent can see no item (E5-5 preview; every item hidden by the picks or an empty list) | No items to review. |
| Missing-item form (when the PM switched it on) | Is anything missing from the list? Optional. What is missing; Where it belongs (Choose one, then the chapters); How important it is (Choose one, then the method's values) |
| Closing question (when the PM set one) | [THE PM'S QUESTION], a text box |
| Confidence | How confident are you in these answers? 1, 2, 3, 4, 5, with Guessing under 1 and Certain under 5 |
| Sign-off | [THE PM'S SIGN-OFF TEXT], one 48 px label with a checkbox |
| Submit and the line under it | Submit; "Still needed: [N] items, how confident you are, the confirmation." or "Everything is in. Submit when you are ready." |
| Preview strip | Preview: nothing you enter here is saved (Submit stays disabled in the preview; once everything is picked the line under it says "Submit is off in the preview.") |

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
