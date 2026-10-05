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
| Accent line, readable | Contrast on white [RATIO]:1. Used on the selected answer, the active chapter, the progress bar, the confidence picked and the initials shown when there is no logo. Buttons stay ink. |
| Accent line, none set | No accent set. The respondent page uses violet. |
| Save button | Save |
| Line after saving | Saved. Your instruments carry the new name, logo and accent. |
| Plan card title and value | Plan, Free |
| Plan pill | While we build it with the first users |
| Plan note | Paid plans come later. Nothing you build now is lost or locked. |
| Usage line under the plan note (E2-6; the spend added with E9-3) | [N] projects, [N] responses this month, [N] AI runs this month, EUR [SPENT] on AI this month. |
| Note | No AI budget on the page: the workspace budget will be set and seen in the admin area only (decision 0036; E14-2, not built yet). |

## Settings, Data (E11-2; owners only)

| Where | Text |
|---|---|
| Section title | Data |
| Export everything | Export everything / One zip file with every project's JSON file, the workspace's settings, the members and the logo. / [Button: Download zip], while it waits Preparing the file; a failed download: The zip export did not finish. Try again; if it fails again, reload the page and export again. File name: [WORKSPACE]-everything-[YYYY-MM-DD].zip, holding projects/[NNN]-[PROJECT].json, workspace.json, members.csv (Name, Email, Role, Joined) and logo/[FILE] |
| Delete this workspace | Delete this workspace / Every project, response and file in this workspace is removed within 24 hours, and every member loses access at once. This cannot be undone. Export everything first if you want a copy. / Field: Type the workspace's name, [WORKSPACE], to confirm / [Button: Delete workspace] (destructive; off until the name matches); refusals in docs/copy/errors.md, Sign-in and workspace |
| Deleted page | Workspace deleted / the line from docs/copy/errors.md / [Button: Go to your workspaces] |

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
| New project button | New project; beside it (E10-2) [Button: Import a project] |
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
| Import a project page (E10-2) | Import a project. Choose the .json file made with Whole project on a project's Export tab. The project comes in with its lists, instruments, responses and actions. Its public link comes in revoked: press Publish again on the Share page for a new one. Personal invites keep their state, with links nobody has yet: Remind sends a new one to the people who have not submitted, and Revoke then New link sends one to anyone.; field: Project file (.json); [Button: Import project]; refusals in docs/copy/errors.md, Projects |
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
| The chapters per layout (E5-3; the live link and the preview) | The chapter row: About you, every area (the first active), Wrap up, fading at the right edge when long. One item per screen: "Item 1 of [N] in [AREA]" (the instrument's title when the list has no areas) over one card; Single long page: "All [N] on one page", every area with its heading (items without an area under "Other items", as on the live link), no chapter row; Chapters: the chapter row and the first area's cards. The builder's preview shows every card (E5-6). |
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
| Preview panel (E5-6; on Import, Shape, Build and Share, not on Results, Projects, Settings or the sample project) | Preview; [Toggle: Desktop / Phone] (named Device); [Link: Open full size] (a new tab; screen readers hear "Open full size (opens in a new tab)"); the caption: Import sets the chapters and the cards. / Shape changes the wording on the cards. / Build changes the rating row, the chapter row, About you and the Wrap up. / Share sets the closing date in the header.; the frame's name for screen readers: What respondents see.; while the frame loads: Loading the preview Inside, the respondent app with "Preview: nothing you enter here is saved" on every screen |
| The preview's own pages (E5-6) | An expired or another person's preview: This preview has expired. / Open the project again in SMEsay to see its preview.; the same PM's preview for another workspace: This preview is for another workspace. / Switch to the workspace the project is in, then open the project again.; before a list: [PROJECT NAME] / Import a list to see what respondents get.; a revoked link on Share: the withdrawn page (Link inactive.) |

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
| Buttons | Publish (primary, on a draft); Save (secondary, once published); Saved. (until the next change); Publish again (primary, once revoked, E6-4: a new link with a new token) |
| Revoke (E6-4), under the form while a link is in force | Nobody can open the link after this. Answers already given are kept. Publish again makes a new link. [Button: Revoke link] (no confirmation; the card reads Revoked at once, the link row goes) |
| Link card on the sample | Opens: [DATE AND TIME UTC]; Closes: [DATE AND TIME UTC]; The sample project cannot be edited. |
| Personal invites card (E6-2), title and line | Personal invites. One link per person, sent by email from you. Each answers under their name and can carry on from any device. |
| Personal invites box | People, one per line (hint: Addresses apart by commas, spaces or new lines. A name and a role may follow an address after commas: ana@company.example, Ana Pop, Finance). The box is off, with the reason as its hint, while the public link is not published (Publish the public link first. Personal links take its open and close dates.), closed (The public link is closed. Move its close date to send invites.) or revoked (The public link is revoked. Publish again to send invites.). [Button: Send] |
| After Send | [N] invites sent. (1 invite sent.) Under it, one line per address that was not sent (docs/copy/errors.md). The box keeps only those addresses, one per line, so Send tries them again. |
| Invite list | Columns: Person ([NAME], then [EMAIL], [ROLE] under it; the email alone when no name); Status: Invited / In progress / Submitted / Not sent (with the provider's reason under it, or: Paste the address again to send it. A send in progress holds the address for 15 minutes.), and the last save or submit as [DATE AND TIME UTC] under the pill; Reminders: None sent, or [N] sent, last [DATE AND TIME UTC]; the last column: [Button: Remind] (E6-3), or in its place: Reminded [DAYS] days ago. The next reminder can go on [DATE AND TIME UTC]. (nothing for a submitted person or a Not sent row); under it [Button: Revoke] (E6-4), or on a revoked row [Button: New link]. A revoked row: Status Revoked, under it: Revoked [DATE AND TIME UTC]. The link shows the inactive page. |
| Reminders line and button over the list (E6-3) | Reminders go only when you press the button, at most one per person every three days, never after they submit. [Button: Remind everyone who has not submitted] (off with: Nobody is due a reminder.) |
| After Remind or Remind everyone (E6-3) | [N] reminders sent. (1 reminder sent.) Under it, one line per person not sent (docs/copy/errors.md). Remind everyone with nobody due (a stale tab): Nobody is due a reminder. |
| Invite list, empty | Nobody invited yet. |
| Personal invites on the sample | The sample project cannot be edited. (the list shows) |

## Results (E8-1)

| Where | Text |
|---|---|
| Band on every step of the sample and on its link page (E8-1, E8-8; never dismissed) | Sample data: invented answers, for looking around |
| The sample's header (E8-8) | [WORKSPACE] · sample project; [Button: Delete sample] in Archive's place, then the confirm line from docs/copy/errors.md with [Button: Cancel] [Button: Delete sample] |
| Shape on the sample (E8-8) | The sample project cannot be edited. |
| Switch at the top | Include unsubmitted answers (on by default, decision 0030; kept per PM per instrument; the URL always carries it, so a shared view counts the same answers) |
| Button and dialog | [Button: Choose tiles]; title: Choose the tiles; line: Up to six, shown in this order. Only you see your choice.; count: [N] of 6 chosen; [Button: Cancel] [Button: Save] |
| Dialog errors | Pick at least one tile. / Pick up to six tiles. |
| The twelve tiles (the checklist, in this order) | Submitted of invited; Agreement; Different priority; Disagree; Unclear; Missing items suggested; Answers with a reason or comment; Items with no answer yet; Items fully agreed; Items with a different priority or disagree; Median minutes to submit; Responses in progress. The first six are on by default. |
| Tile values and labels on the strip | [N] of [M], Submitted of invited; [P]%, Agreement, [A] of [B] answers (None yet with no answer); a count with the tile's name for the rest; Median minutes to submit reads None yet before a Submit |
| Filter bar (labelled Filter the results) | Each respondent field by its label (a dropdown's options as chips; a text field as [LABEL] contains); Answer: Agree, Different priority, Disagree, Unclear, Rated (only where the proposal is hidden), Not answered, With a reason or comment; Status: Submitted, In progress; Perspective: Any perspective / [NAME]; [Button: Clear filters] while a filter is on |
| Tabs (labelled Results views) | Agreement; Different priority and Disagree ([N]); Questions and gaps ([N]); Responses; Actions ([N]); Export |
| Responses tab (E8-2) | Columns: Name, [each other respondent field], Status, Progress, Submitted, Source, Reminders, With a reason or comment; a personal invite with no name: the invite's name, else its email; a public-link response with no name: Anonymous [N]; the table's caption for screen readers: [N] people (1 person); Status: Invited / In progress / Submitted, with Changes not submitted again or Submitted again; Progress: [N] of [M]; Submitted: [DATE, HH:MM] UTC or Not yet; Source: Public link / Personal invite; Reminders: [N], None on the public link; each header sorts, ascending then descending |
| Agreement tab (E8-3) | View: Table / Columns / Share; Split by: No split / [each dropdown field]; Sort items by: Reference / Agreement / Different priority / Disagree / Unclear; Order: Ascending / Descending; the series Agree, Different priority, Disagree, Unclear, Rated (an item with no proposal), Not answered, or, rate-blind, the scale's values with the line Values picked, where no proposal was shown; an area's items under its name, loose items under Other items; Answered of could see ([N] of [M]) when the instrument has perspectives; a percentage, or No answers; Share: The whole list, [N] of [M] agree ([N] rated where no proposal was shown: on a rate-blind list, for an area with no proposed item, or a list with none); a small group: Fewer than 3 answers: not compared; the banner from docs/copy/errors.md (groups with fewer than 3 answers); under each bar its counts in words, as [N] agree · [N] different priority · [N] disagree · [N] unclear · [N] not answered (only the counts above 0; a value's own label on a rate-blind list); a figure of [P]%, [N] rated (where no proposal was shown), or No answers; column headers Item, Proposed, Answers, Agreement, and Answered of could see with perspectives (a rate-blind list: Item, Answers, Rated); the area's first row: All items; a summed group not compared: Fewer than 3 answers: not compared, or, short of people, Not compared, so one person cannot be singled out; under each aligned bar its series' name; the group of the people who left the split field empty: Not given; the donut line with no answer kept: No answers under this filter, or No answers yet with no filter on; every chart's name for screen readers: Answers on [ITEM], Answers on [ITEM], [GROUP], Answers on [AREA], all items, Answers on [AREA], Answers on [AREA], [GROUP], Answers on The whole list, Answers on [GROUP] |
| Registers (E8-4) | Different priority and Disagree tab: Different priority [N] (Item, Respondent, [Role], Proposed, Their value, Reason) and Disagree [N] (Item, Respondent, [Role], Reason); Questions and gaps tab: Unclear [N] (Item, Respondent, [Role], Question) and Missing items suggested [N] (Suggested item, Suggested area, Suggested value, Respondent, [Role]); a respondent who has not submitted: Not submitted; one who changed answers after Submit: Changes not submitted again; an empty register: None under this filter., or with no filter on, None yet.; each table named for screen readers by its register's title |
| Item detail (E8-5; opened from an item's title on the Agreement table and the registers, in place of the tabs) | [Link: Back to [tab name]] (the tab's name in lower case; Escape too; also beside the error banner) [REFERENCE] · [AREA]; the reader text as the title; Original: [ORIGINAL TEXT] when the title differs; Proposed [VALUE LABEL in a pill]; On this item: Agree, Different priority, Disagree, Unclear, Not yet answered, each with [N] (an item with no proposal: Rated, Unclear, Not yet answered); the table Every answer on this item with the columns Respondent, Answer, Reason, question or comment: name (as on the Responses tab), role, the pill (Agree, Different priority, Disagree, Unclear, Rated; In progress, Not started; the Not answered pill), Not submitted where the answer counts before a Submit, their value where it differs from the proposal, the reason, question or comment, or No answer yet. in muted text; with no row: No one the filter keeps sees this item. Change the filter to see their answers.; an item not in the current version: This item is not in the list's current version. Go back and open an item from the list. |
| Where groups disagree (E8-6; under the views of the Agreement tab, only items with a proposal shown, not on a rate-blind list) | Where groups disagree, by [FIELD]; Compare by: [each dropdown field]; per item: the reference and text (a link to its detail), [N] points apart (1 point apart), a bar per group with [A] of [N], the line [GROUP]: [A] of [N] agree. per group, or [GROUP]: fewer than 3 answers. (no bar, no numbers); the people with no value: Not given; an item nobody answered: No answers to compare.; none compared: No item has two groups with 3 answers or more yet., or under a filter: No item has two groups with 3 answers or more under this filter. Clear the filter or compare by another field.; groups compared that agree on every item: Where groups have 3 answers or more, they agree on every item.; Show all [N] items; the banner from docs/copy/errors.md (groups with fewer than 3 answers), once per page |
| Actions tab (E9-1) | [Button: Write actions], once there are actions [Button: Write again] (secondary), while it runs Writing actions; with none: No actions yet. Write them from the answers: each one names the answers behind it.; a run that kept none (the open actions stay): The answers gave no new action worth writing. Nothing changed. Try again once more answers are in.; each action: its kind in a pill (Rewrite, Groups disagree, Follow up, Coverage), on an open action [Button: Mark done] [Button: Dismiss] (none open: No open actions. Write again to look for new ones, or reopen one below.; for screen readers the open list is headed Open ([N])), then the sections Done ([N]) and Dismissed ([N]) with each action greyed, Done [DATE AND TIME] UTC or Dismissed [DATE AND TIME] UTC in a pill and [Button: Reopen] (E9-2; none on the sample), the title, why, and the citations after From: [Name] and [Name] on [REF] (three or more: [A], [B] and [C] on [REF]; an item with no reference: on "[ITEM TEXT]", cut at 40 characters with ...), each a link to the item's detail, and [Name], missing item; the sample: The sample's actions are invented, to show what this tab looks like., no Write actions, and with none to show: The sample has no actions to show.; an action whose every citation is gone (an answer or missing item removed since) is not shown; under the actions once Write actions has run (E9-3): Last run [DATE AND TIME] UTC: [N] tokens, EUR [COST]. This workspace this month: EUR [SPENT]. (the workspace's AI spend this month, the same sum as Settings' usage line; no budget number; not on the sample); refusals in docs/copy/errors.md, Dashboard and exports |
| Export tab (E10-1) | Each CSV file and the summary hold what this page shows: the same filter and the same switch; Whole project holds everything, whatever the filter. The answer counts, the item counts, the people and the missing items on this page add up from the files' rows.; on the sample: The sample's files start with the line "Sample data, invented".; four cards: Answers / One row per answer: the respondent and their fields, the item, the answer, their value, the reason or question and the comment.; Items with totals / One row per item: the counts of each answer, not answered, and the agreement.; People / One row per person: the Responses tab's columns and the minutes to submit.; Missing items / One row per missing item suggested, with who suggested it.; each [Button: Download CSV], while it waits Preparing the file; a failed download: the line from docs/copy/errors.md, Export failed |
| Whole project card (E10-2) | Whole project / One JSON file with every version of the list, the instruments, the invites without their links, every response with its answers, the missing items and the actions. Import it into another workspace from the project list.; [Button: Download JSON]; file name [PROJECT]-project-[YYYY-MM-DD].json; a failed download: The JSON export did not finish. Try again; if it fails again, reload the page and export again. |
| Summary for the deck card (E10-3) | Summary for the deck / A PDF of what this page shows: the headline numbers, the agreement by area, the items, the registers, the sign-off record and the actions. / [Button: Download PDF], while it waits Preparing the file; over 30 pages, after the download: the line from docs/copy/errors.md, PDF over the page limit; a failed download: Export failed (PDF) |
| The PDF summary (E10-3) | Header on every page: [WORKSPACE] · [PROJECT], on the sample the band Sample data, invented; footer: Page [N] of [M]. Page 1: [PROJECT], [WORKSPACE] · [INSTRUMENT TITLE], Made [DATE, HH:MM] UTC, the filter line as on the CSV files, the tiles, Agreement by area with the legend Agree, Different priority, Disagree, Unclear, Rated, Not answered and each area's counts in words, How confident respondents are (1 to 5). Items: per area, Reference, Item, Proposed, Agree, Different priority, Disagree, Unclear, Rated, Not answered, Agreement. The registers as on Results, each titled with its count, None under this filter. when empty. Sign-off record: Respondent, Submitted, Confidence (Not given; a person who changed answers after Submit: [DATE], changes not submitted again); No one has submitted yet. Actions: kind · state (Open, Done [DATE], Dismissed [DATE]), the title, why, From: [citations]; No actions written. |
| The CSV files (E10-1) | Lines before the header: Sample data, invented (the sample); Filtered: [FILTERS] (a filter on, named as the filter bar names it); Includes answers not submitted yet (the switch on); with none of these the header is the first line. Answers headers: Respondent, [each respondent field], Reference, Area, Item, Proposed value, Proposed label, Answer, Their value, Their label, Reason or question, Comment, Submitted at, Since submitting, Source, Perspectives. Items with totals headers: Reference, Item, Original text, Area, Proposed value, Proposed label, Agree, Different priority, Disagree, Unclear, Rated, Not answered, Agreement %. People headers: Respondent, [each respondent field], Status, Since submitting, Answered, Items seen, Submitted at, Minutes to submit, Source, Reminders, Answers with a reason or comment. Missing items headers: Suggested item, Suggested area, Suggested value, Suggested label, Respondent, [each respondent field], Status, Since submitting. Values: Public link / Personal invite; Invited / In progress / Submitted; Since submitting: Changes not submitted again, or empty (People also: Submitted again); a text cell that starts with =, +, -, @, a tab or a line break has a single quote in front. File name: [PROJECT]-[answers, items, people or missing]-[YYYY-MM-DD].csv |
| Empty states, filter line and errors | docs/copy/errors.md, Dashboard and exports |

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
| Caption under the proposed pill | proposed (the pill is named "[VALUE], proposed" for screen readers, E7-7) |
| Footer note | Not rated yet; Say why.; Write your question.; Saved (the respondent page, E7-2); Not saved yet while the page cannot reach the server (E7-3). The Build preview shows the picked label once complete (it saves nothing) |
| Reason box over a value other than the proposal (E7-2) | Why [VALUE] and not [PROPOSED]? The team reads every reason. |
| Reason box over Not needed (E7-2) | Why is it not needed, or what should it say instead? |
| Question box over Unclear (E7-2) | What would you need to know to rate it? |
| Comment (E7-2; an answer that needs no reason) | [Toggle: + comment / Hide comment], box label: Comment, optional |
| Details (E7-2; when the import carried more text and a box is open) | [Toggle: Details / Hide details] |
| Details that scroll (E7-7; the name a screen reader reads for the details when they are longer than their slot) | Details: [ITEM] |
| One item per screen (E7-2) | Item [N] of [M] in [AREA] over one card; [Button: Previous item] [Button: Next item] |
| Single long page (E7-2) | All [N] on one page, every area as a heading over its cards |

## About you (the respondent instrument, E5-1 preview and E7-1)

| Where | Text |
|---|---|
| Preview strip (E5-6, acceptance 4) | Preview: nothing you enter here is saved |
| Header | [WORKSPACE LOGO at 24 px, or the INITIALS when there is none] [WORKSPACE NAME], and on a live link (E6-1): Closes [DATE AND TIME UTC]; "Not saved" instead while answers cannot reach the server (offline, or the server failed or refused for now), until every failed answer has gone through (E7-3) |
| Personal link (E6-2), above the fields | Answering as [NAME], [ROLE]. The person who invited you filled this in. Tell them if it is wrong. (the fields the invite carries are not asked) |
| Title and intro | [INSTRUMENT TITLE], [INTRO] |
| Field label | [LABEL] (an optional field: [LABEL] (optional)) |
| Dropdown first option | Choose one |
| Footer line | Your answers go to the project team at [WORKSPACE NAME]. They are saved as you go on this device, so you can close this page and come back. |
| Powered by | Powered by SMEsay (while the workspace is on the Free plan, E7-7; on About you, the chapters, the Wrap up, Done, the nothing-to-rate screen, the link pages with a workspace and the Build preview); on About you and Done, on every plan, beside it: How your answers are used (a link to /legal/privacy, new tab; screen readers hear "(opens in a new tab)"; E11-3) |
| Start button | Start with [FIRST CHAPTER] (Start, while the list has no areas); it lands on the first chapter (E7-1) |
| Chapter screen (E7-1; E7-2 to E7-4 add the answers, the row and Continue) | [CHAPTER NAME] (the instrument's title when the list has no areas), [THE AREA'S ONE-LINE INTRO], the cards; footer [Button: Back] [Button: Continue to [NEXT AREA] / Continue to Wrap up] |
| Chapter row (E7-4; not on the single long page) | About you, [AREA] [DONE]/[COUNT] for each chapter (read as "[AREA], [DONE]/[COUNT] answered"), Wrap up; named "Chapters" for screen readers; under it a bar named "Items answered" ([N] of [M]) |
| Footer note on a chapter (E7-4) | [N] of [M] still to rate here. You can come back later. / All [M] rated in this chapter. (one item: The item in this chapter is rated.) (the single long page: All [M] rated., one item: The item is rated.) (the single long page counts every item) |
| Chapter pill count, as a screen reader reads it (E7-4) | [CHAPTER], [N] of [M] answered (the pill shows [N]/[M]); the bar: [N] of [M] |
| Returning visit, over the chapter or the Wrap up it lands on (E7-4) | Welcome back, [FIRST NAME]. (Welcome back. without a name) You answered [N] of [M] last time. (Nothing complete yet: Your answers so far are kept; none is complete yet.) |
| Chapter name for items with no area (E7-1; the Build preview uses it too) | Other items |
| Perspectives question (E5-4; only when the instrument has perspectives) | Which of these describe you? Pick every one that fits. You see the items for your perspectives and the ones for everyone. (checkboxes, one per perspective) |
| Chapter screen when the picks leave nothing to rate (E5-4; the live link and the preview) | Nothing to rate yet. Go back to About you and pick the perspectives that describe you. [Button: About you] |
| Hint under a disabled Start | Fill in your name and role to start. (while the required fields are exactly Name and Role; otherwise, decision 0043: Fill in the required fields to start.) |

## Wrap up (the respondent instrument, E5-5 preview, E7-4 and E7-5)

| Where | Text |
|---|---|
| Header | Build preview: [WORKSPACE NAME], [ANSWERED] of [TOTAL]. Live link (E7-4): the respondent header with Closes [DATE AND TIME UTC] and the chapter row |
| Title | Wrap up |
| Tally tiles (decision 0018 item 5) | Agreed, Higher priority, Lower priority, Not needed, Unclear; rate-blind: Rated, Not needed, Unclear |
| Gaps box | [N] still to finish. [Button: Go to [CHAPTER OF THE FIRST ITEM STILL TO FINISH]] (Build preview: the first chapter) |
| Live link, nothing left to finish (E7-4) | All [M] items are answered. (one item: The item is answered.) |
| Live link, the list (E7-4) | Still to finish, then each item: [REFERENCE] [TITLE] and what is missing (Not rated yet, Say why., Write your question., Not saved yet), each opening its own item |
| Live link, footer (E7-4, E7-5) | [Button: Back] [Button: Submit] (Submitting while it posts; Back, the chapter row and the Wrap up's Go to, Change and Still to finish rows are disabled until it answers, E7-6) and the line under them: Still needed: ..., or Pick how sure you are, 1 to 5, before you submit. when only the confidence is left, or Everything is in. Submit when you are ready. |
| When nothing is left to review (E7-5) | You agreed with every proposed value. Nothing to review here. |
| When the respondent can see no item (E5-5 preview; every item hidden by the picks or an empty list) | No items to review. |
| Missing-item form (when the PM switched it on) | Is anything missing from the list? Optional. What is missing; Where it belongs (Choose one, then the chapters); How important it is (Choose one, then the method's values) |
| Closing question (when the PM set one) | [THE PM'S QUESTION], a text box |
| Confidence | How confident are you in these answers? 1, 2, 3, 4, 5, with Guessing under 1 and Certain under 5 |
| Sign-off | [THE PM'S SIGN-OFF TEXT], one 48 px label with a checkbox |
| Submit and the line under it | Submit; "Still needed: [N] items, your details on About you, how confident you are, the confirmation." (the parts that apply) or "Everything is in. Submit when you are ready."; while posting: Submitting |
| Sections (E7-5; agreed items are not listed) | Higher priority [N], Lower priority [N], Not needed [N], Your questions [N]: each row the reference, the item, the value picked and the reason or question, [Button: Change] (named "Change: [ITEM]" for screen readers) |
| Tally on the live link (E7-5) | the five tiles with the respondent's counts; "Rated" appears beside them when an item had no proposal |
| Done (E7-5 and E7-6) | Thank you, [FIRST NAME]. (Thank you. without a name) Submitted [DATE], [HH:MM] UTC. Then the summary line: [N] agreed, [N] changed, [N] not needed, [N] unclear, [N] items added (with ", [N] rated" after "changed" when items without a proposal were rated; rate-blind: [N] rated, [N] not needed, [N] unclear, [N] items added). After a change not submitted again (E7-6), on Done and over the Wrap up: You changed answers after submitting. Submit again to send them. [Button: Change my answers] (reopens the Wrap up with the sign-off cleared) |
| Preview strip | Preview: nothing you enter here is saved (Submit stays disabled in the preview; once everything is picked the line under it says "Submit is off in the preview.") |

## The visitors' sample (E12-4, /sample)

| Element | Copy |
|---|---|
| Band above the header, the watermark's dashed outline | Sample: nothing you enter here is saved |
| A card's saved note | Saved on this device (Kept until you leave this page, when the browser keeps nothing) |
| Powered by | Powered by SMEsay, a link to the landing page |
| Done | as Done above, with "Nothing was sent: this is the sample." in place of the submitted time, then [Button: Start free] (to sign-in) |
| Tab title | Sample instrument · SMEsay |

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
| Sidebar footer link (E12-2) | Help (opens the quickstart, docs/copy/quickstart.md) |
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

## Admin Overview (E13-2, /admin; Mihai only)

| Where | Text |
|---|---|
| Crumb, title and line | SMEsay admin / Overview / Every workspace, its usage, and the steps from sign-up to submission. The sample projects are left out. |
| Totals | [N] workspaces / [N] projects / [N] instruments published / [N] responses submitted |
| Paid-plan metric | the metric's label from src/lib/plans.ts (now: Workspaces with a response submitted this month), and under it: [N]. No threshold set yet: paid plans stay off. (with a threshold: [N] of [THRESHOLD] to switch paid plans on.; reached: [N] of [THRESHOLD]: the threshold is reached, paid plans can switch on.) |
| Funnel title and note | Funnel per week / Each step's count, and under it the share of the step before in the same week; a step can count more than the one before (one publish, many invites). Weeks start on Monday, UTC. |
| Tab title | the app's (SMEsay): the page has no title of its own, so its 404 is like any other |
| Funnel columns | Week of, Sign-ups, Workspaces, Projects, Imports, Published, Invites, Links opened, Started, Submitted, Exports |
| Workspaces | Workspaces; columns Name, Created, Members, Projects, Published, Responses this month, AI cost this month, Last activity; empty: No workspaces yet. |
| Loading | Loading the overview |

## Admin shell (E14-1, every /admin page)

| Where | Text |
|---|---|
| Under the lockup | Admin |
| Nav (label "Admin pages") | Overview, Workspaces, People, Audit log |
| Bottom | Back to the app; the signed-in email |

## Admin audit log (E14-1, /admin/audit)

| Where | Text |
|---|---|
| Crumb, title and line | SMEsay admin / Audit log / Every action an admin took, newest first. Each row is written before its action runs, then marked with what became of it. |
| Filters | Workspace, Admin (each with All), Show, Clear the filters |
| Columns | Time (UTC), Admin, Action, Outcome, Workspace or person, What changed |
| Outcome | Done, Refused, Failed, Not recorded |
| Actions | Changed the plan, Set the AI budget, Sent an invitation again, Revoked a link, Restored the workspace, Added a support note, Sent a sign-in link, Signed the person out everywhere, Removed a member, Deleted the account, Started viewing as the owner, Stopped viewing |
| A target or admin removed since | deleted; a workspace waiting for removal: [NAME] (deleted, removal pending); in the filters: deleted ([first 8 characters of the id]) |
| What changed | key: value pairs by key in alphabetical order (none for an empty value) |
| Empty | No admin actions yet. (filtered: No admin actions match these filters.) |
| Pages | Page [N] of [M], [T] actions (1 action); Newer, Older |
| Loading | Loading the audit log |

## Admin workspaces (E14-2, /admin/workspaces)

| Where | Text |
|---|---|
| Crumb, title and line | SMEsay admin / Workspaces / Every workspace, deleted ones too, by last activity. The figures leave the sample projects out. |
| Search | placeholder and label: Name, slug or a member's email; Search; Clear |
| Columns | Name (slug under it; Deleted [DATE] when marked), Plan, Created, Owners, Members, Projects, Published, Responses this month, AI cost this month, Last activity |
| Empty | No workspaces yet. (search: No workspace matches "[QUERY]".) |
| Loading | Loading the workspaces |

## Admin workspace page (E14-2, /admin/workspaces/[ID])

| Where | Text |
|---|---|
| Back link and title | All workspaces / [WORKSPACE NAME] |
| Sections | Marked deleted, Settings, AI budget, Members, Invitations waiting, Projects, Uploads, Last 20 product events, Support notes |
| Marked deleted | Deleted [DATE, TIME] by [EMAIL]. The removal job deletes it within 24 hours of that; until then it can be restored. |
| Settings | Slug, Accent (default), Logo (set, none), Plan, Created |
| AI budget | [EUR N.NN] spent this month of EUR [N]. Seen and set only here (decision 0036). Field: Monthly AI budget in euro |
| Members | Name, Email, Role (Owner, Member), Joined; none: No members. Members of a deleted workspace can leave it before it is removed. |
| Invitations waiting | every invitation not accepted: Email, Invited, Link expires ([TIME], or [TIME] (expired)); none: No invitations waiting. |
| Projects | [NAME], status, [N] items, version [N] (not set), Archived [DATE]; instruments: Instrument, State (Draft, Published, Closed, Revoked), Built on, Links (public, [N] personal, none), Created, Published, Opens, Closes; where the product would refuse a revoke, in place of the button: sample, project archived, replaced by a newer instrument; none: No projects. |
| Uploads | File, Project, Kind, Size, Uploaded; none: No uploads. |
| Events | [TIME] [EVENT NAME] [KEY=VALUE]; none: No product events yet. |
| Support notes | [TIME], [ADMIN EMAIL or deleted] and the text; none: No notes yet. Field: A note for this workspace, seen only here |
| Buttons | Change the plan, Set the budget, Send again, Revoke the link, Restore the workspace, Add the note; Confirm, Cancel |
| Confirm lines | Change the plan of [NAME] to [PLAN]? The workspace's limits change at once. / Set the AI budget of [NAME] to EUR [N] a month? / Send the invitation to [EMAIL] again? They get a new sign-in link; an earlier one still works until it expires. / Revoke the public link of [TITLE]? Respondents see that it is no longer active; answers given so far stay. / Restore [NAME]? Members who have not left it get it back. Files the removal job already deleted do not come back. / Add this note? It cannot be edited or removed. |
| Done lines | Plan changed to [PLAN]. / AI budget set to EUR [N] a month. / Invitation sent again to [EMAIL]. / Link revoked. / Workspace restored. / Note added. |
| Refusals | in docs/copy/errors.md, Admin |

## Admin people (E14-3, /admin/people)

| Where | Text |
|---|---|
| Crumb, title and line | SMEsay admin / People / Everyone with an account, by last sign-in. Respondents have no account and are not here. |
| Search | placeholder and label: Email or name; Search; Clear |
| Columns | Email, Name, Email verified (yes, no), Signs in with (Sign-in link, Google), Workspaces ([NAME] (owner or member)), Created, Last sign-in (never), Open sessions |
| Empty | No accounts yet. (search: Nobody matches "[QUERY]".) |
| Loading | Loading the people |

## View as (E14-4, the workspace's admin page and every PM page during a view)

| Where | Text |
|---|---|
| Admin workspace page, section and line | View as the owner / Opens this workspace's pages as its owner sees them, read-only, for 60 minutes. Respondent names and answers are visible there; starting and stopping are recorded in the audit log. |
| Button and confirm line | View as the owner / View [WORKSPACE] as its owner sees it? Respondent names and answers will be visible to you. |
| Banner on every PM page | Viewing [WORKSPACE] as its owner sees it. Changes are off. The view ends at [HH:MM] UTC. / Stop viewing |
| Every button and field of the page | shown, disabled (buttons and download links at 40 percent, fields at 50); links still go everywhere |
| Build, a project with a list and no instrument yet | The owner has not opened Build for this project yet, so it has no instrument to show. |
| Refusal | in docs/copy/errors.md, View as |

## Admin person page (E14-3, /admin/people/[ID])

| Where | Text |
|---|---|
| Back link and title | All people / [EMAIL] |
| Sections | Account, Workspaces, Sessions, Invitations waiting, Last 20 product events, Delete the account |
| Account | Name, Email verified, Signs in with, Created, Last sign-in; buttons Send a sign-in link, Sign out everywhere |
| Workspaces | [NAME] [ROLE] and Remove; none: Not a member of any workspace. |
| Sessions | Started, Expires, Browser ([BROWSER] on [SYSTEM]), State (open, expired); none: No sessions. |
| Invitations waiting | [WORKSPACE], invited [TIME] (the link has expired); none: No invitations waiting. |
| Events | [TIME] [EVENT NAME] ([WORKSPACE]) [KEY=VALUE]; none: No product events yet. |
| Delete the account | Only at the person's own request. Their memberships go; what they made in workspaces stays without their name. |
| Confirm lines | Send a sign-in link to [EMAIL]? It works once and expires in 15 minutes. / Sign [EMAIL] out on every device? / Remove [EMAIL] from [WORKSPACE]? / Delete the account of [EMAIL]? This cannot be undone. |
| Done lines | Sign-in link sent to [EMAIL]. / [N] sessions ended. (1 session ended.) / Removed from [WORKSPACE]. / Account deleted. |
| Refusals | in docs/copy/errors.md, Admin |
