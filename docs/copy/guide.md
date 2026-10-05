# The guide: what the robot says

Every line the guide card (stories/E15-1) can show, with its id, its pose, its screen and
the data condition. The code reads these ids; a line that is not here does not exist. One
line per card, up to 140 characters, one action at most. Plain English, WRITING.md.

## First project path (E15-2), Projects

| Id | Pose | Condition | Line | Action |
|---|---|---|---|---|
| path.start | hi | no project of the person's own | Your first link is four steps away. Start with the list you were about to email round. | Start a project (secondary: Try it on the sample first) |
| path.import | idea | a project, no set | Upload the spreadsheet or paste the list. The columns are mapped on the next card. | Go to Import |
| path.shape | idea | a set, no shape run | Let the AI group the items into areas and write a readable version of each. Nothing changes until you accept. | Go to Shape |
| path.build | idea | a run, instrument without an intro | Write two lines so respondents know what the list is for, and check the fields they fill in. | Go to Build |
| path.share | idea | an instrument with an intro, no link | Publish one link, or send personal invites. Respondents need no account. | Go to Share |
| path.done | hi | a published link (the card's last show before it goes) | Your link is live. Answers arrive on Results as they come in. | See results |

Card title: Your first validation. Steps: Import the list, Shape it, Build the instrument,
Share one link. Line under the steps: Then: read the results.

## Step tips (E15-3)

| Id | Pose | Screen and condition | Line | Action |
|---|---|---|---|---|
| import.empty | reading | Import, no upload and no set | Upload an xlsx or csv, or paste the list. One item per row. | none (the upload card is there) |
| import.mapping | reading | Import, an upload or paste with columns to map, not imported yet, under ten minutes old | Tell us which column is the item and which is the proposed value. The rest is kept as custom fields. | none |
| shape.notRun | idea | Shape, a set and no run | Shape with AI groups the items and writes a readable version of each. The originals are never changed. | none (the button is there) |
| shape.pending | idea | Shape, suggestions not yet accepted or rejected | Accept the reader versions you like. Respondents read the accepted version; you keep the original. | none |
| build.intro | idea | Build, intro empty | Write one or two lines so respondents know what the list is for. They see this first. | none (the field is there) |
| build.fields | idea | Build, fields still Name and Role as text | A dropdown Role lets Results split answers by group. Pick Dropdown and type the roles. | none |
| share.draft | idea | Share, link in draft | Publish when the instrument is ready. You can withdraw the link at any time; answers already given are kept. | none |

## Sample walkthrough (E15-3), the sample project's Results

| Id | Pose | Screen | Line | Action |
|---|---|---|---|---|
| sample.strip | analysis | Results, headline strip and agreement table | The numbers at the top count answers; the table shows each item with who agreed, who chose a different priority and who disagreed. | Next |
| sample.registers | analysis | Different priority and Disagree tab | Every different priority and every disagree comes with a reason. This is what you read before the meeting. | Next |
| sample.detail | analysis | an item's detail | This page shows every answer to one item. The AI's to-do list cites these rows. | Start a project |

## Rescue tips (E15-4)

| Id | Pose | Condition | Line | Action |
|---|---|---|---|---|
| rescue.mapping | help | Import, an upload or paste with columns to map, stored ten minutes ago or more and not imported yet | The list is uploaded but not imported yet. Map the item column and press Import. | Map the columns |
| rescue.shapeFailed | help | Shape, a run refused or failed (a shape_failed event) after the newest list was imported and after its last run that applied. Try again only when the reason can pass on a second run (failed, invalid, rate limited) | The last run did not finish. Try again, or move on: Build works without the AI's version. | Try again |
| rescue.noResponse | help | Share, a link open for three days or more (from the publish, or the open date when later) with no response | Nobody has answered in three days. A personal invite with a name gets more replies than a shared link. | Send invites |

## Sidebar

| Where | Text |
|---|---|
| Switch in the sidebar footer, above the mode toggle | Show tips |
| Dismiss on every card | Dismiss |
| The card's name for screen readers | Tip |
| A step of the path, read after its name | done (ticked); next (the next step) |
| Under the card or the switch, when Dismiss or Show tips was not stored | That was not saved. Check the connection and try again. |
