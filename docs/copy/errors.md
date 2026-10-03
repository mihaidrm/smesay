# Error and state messages

Every message says what happened and what to do next (CLAUDE.md, WRITING.md). Second person,
present tense, no exclamation marks, no "something went wrong". Messages already on the
prototype boards are kept as they are, so the boards and this file say the same thing
(decision 0017). Placeholders in [CAPS] are filled by the app.

Where a message sits: inline means under the field or control; banner means a strip at the top
of the content; page means it replaces the screen.

## Sign-in and workspace (E2)

| Where | When | Message |
|---|---|---|
| Inline, email field | Email empty or not an address | Enter the email address you signed up with. |
| Banner, sign-in page | Link sent | Check your email. The link works once and stops working in [N] minutes. |
| Page | Link used twice or expired | This sign-in link has already been used or has expired. Ask for a new one. [Button: Send a new link] |
| Page | Five failed attempts | Too many sign-in attempts. Wait [MINUTES] minutes, then try again. |
| Inline, email field | The server refused the request for another reason | The link was not sent. Try again in a minute. |
| Inline, workspace name field | Name empty or over 80 characters | Enter a name for your workspace, up to 80 characters. |
| Inline, sidebar footer | Sign out request failed | Sign out did not complete. Try again. |
| Page | Google sign-in cancelled, refused, or the email unverified (E2-2; Microsoft and Apple after launch, decision 0034) | Sign-in with Google did not complete. Try again, or use the email link. |
| Inline, invite field | Member invite to an address already in the workspace | [EMAIL] is already a member of this workspace. |
| Inline, invite field | Member invite with an empty field | Enter the email address to invite. |
| Inline, invite field | Member invite to text that is not an address | [TEXT] is not an email address. Check it and try again. |
| Inline, invite field | More than [N] invites in [MINUTES] minutes from one workspace | Up to [N] invites every [MINUTES] minutes. Try again in [MINUTES] minutes. |
| Inline, invite field | The invite email could not be sent | The invite to [EMAIL] was not sent. Check the address and try again. |
| Inline, member row | Removing or changing someone who was removed in the meantime | This person is no longer a member of this workspace. |
| Inline, member row | Removing or demoting the last owner | This workspace needs at least one owner. Make someone else an owner first. |
| Inline, member row or invite field | A member tries an owner action (the server answers 403) | Only an owner of this workspace can do this. |
| Banner, settings | Accent colour under 4.5:1 on white | This colour is too light on white, so the respondent page uses the default. Pick a darker one to use yours. |
| Inline, settings name | Workspace name empty or over 80 characters | Enter a name for your workspace, up to 80 characters. |
| Inline, settings accent | Accent not a hex colour | Enter the colour as six hex digits, like #1F4F7A. |
| Inline, settings logo | File over 1 MB (checked in the browser before the upload and again on the server) | The logo is over 1 MB. Export a smaller PNG or SVG and try again. |
| Inline, settings logo | File is not a PNG or an SVG by content | The file is not a PNG or an SVG. Export the logo as one of those and try again. |
| Inline, settings logo | SVG with a script or an event handler | The SVG contains a script or an event handler, so it was refused. Export it again without them. |
| Banner, settings | Save by a member (the server answers 403) | Only an owner of this workspace can do this. |
| Page | Workspace deleted by its owner | This workspace was deleted on [DATE]. Its data is removed within 24 hours. Contact [OWNER EMAIL] if you did not expect this. |

## Import (E3)

| Where | When | Message |
|---|---|---|
| Inline, upload | File is not xlsx or csv (by extension; a file without one reads "without an extension") | This file is [EXTENSION]. Upload an xlsx or csv, or paste the list instead. |
| Inline, upload | File over 5 MB (checked in the browser before the upload and again on the server; E3-2) | This file is [SIZE]. The limit is 5 MB. Remove sheets or columns you do not need and upload again. |
| Inline, upload or preview | Over 2,000 rows below the header, on any sheet at upload or on the sheet and row picked (E3-2) | This file has [N] rows. The limit is 2,000. Split the list and upload the first part. (a workbook: Sheet [NAME] has [N] rows. ...) |
| Inline, upload | Upload pressed with no file chosen (E3-2) | Choose an xlsx or csv file, then press Upload. |
| Inline, upload | The file has the extension but is not a workbook or readable text (E3-2) | The file could not be read as a spreadsheet. Export it again as xlsx or csv and upload it. |
| Inline, upload | Upload on the sample project, through the server (E3-2) | The sample project cannot be edited. |
| Inline, preview | No header row found | No header row found. Pick the row that holds the column names, or tell us which column is the requirement. |
| Inline, mapping card | No column mapped to the item text (E3-3) | Pick the column that holds the requirement text. Without it there is nothing to import. |
| Select option, mapping card | A sixth Custom field (E3-3) | Up to five custom fields |
| Inline, paste box | Empty or one line (E3-4) | Paste at least two lines, one item per line. |
| Inline, paste box | Over 2,000 lines (E3-4) | This list has [N] lines. The limit is 2,000. Split it and paste the first part. |
| Inline, paste box | Over 5 MB (E3-4) | This list is [SIZE]. The limit is 5 MB. Paste a shorter list. |
| Card, check before import | Empty rows, duplicates, long items (counts already on the board) | [N] empty rows, skipped. [N] exact duplicates, imported once. [N] items over 1,000 characters, imported whole; consider splitting them in Shape. |
| Page, the signed-in error page | Upload interrupted: the connection drops before the server action runs, so nothing is stored and the error page shows (E3-2; its copy is the 500 row below, E11-6) | The upload stopped before the file arrived. Check your connection and upload it again. Nothing was imported. (the wording for E11-6 to show when the failed request was an upload) |
| Inline, check card | Import pressed while every row is empty in the item text column (E3-5) | Nothing to import: every row is empty in the item text column. Map the column that holds the text, or upload another file. |
| Inline, check card | Import pressed again for a file already imported (E3-5; a replayed form) | This file is already imported as version [N]. Upload or paste the next version to import again. |
| Banner, import | New version of a list already published | This list is published. Importing a new version does not change the published instrument; you build a new one on the new version. [Button: Import as version [N]] |

## Shaping (E4)

| Where | When | Message |
|---|---|---|
| Banner, Shape | AI call failed | The AI did not answer. Nothing changed. Try again; if it fails again, use the items as imported and come back later. [Button: Try again] |
| Banner, Shape | The product's monthly AI cap reached (ANTHROPIC_MONTHLY_BUDGET_EUR, decision 0036) | AI is paused until next month. The list is imported and can be published as it is. |
| Banner, Shape | Workspace AI budget spent (the budget is hidden from the workspace, decision 0036) | This workspace has used its AI budget for the month. The list is imported and can be published as it is. Come back next month. |
| Banner, Shape | Rate limited | Too many AI requests at once. Wait a minute and try again. |
| Banner, Shape | Plan's AI run cap reached (E2-6, E4-1; no plan carries a cap today) | This workspace has used its AI runs for the month on its plan. The list is imported and can be published as it is. Change the plan, or come back next month. |
| Banner, Shape | AI answered but the answer is unusable: refused, cut off, or failed the schema or the check (E4-1) | The AI answered in a form the app could not use. Nothing changed. Try again; if it fails again, use the items as imported and come back later. [Button: Try again] |
| | The Try again button sits beside the two messages above only; a paused, budget, plan, size or sample refusal has none (E4-2). | |
| Inline, Shape | Shape on the sample project, through the server (E4-1) | The sample project cannot be changed by AI. |
| Banner, Shape | The area column has more than 12 distinct areas (E4-2) | This list has [N] areas in its area column. Shape works with up to 12. Merge some in the file and import it again. |
| Banner, Shape | An imported area name is over 60 characters (E4-2) | An area name in the list is [N] characters long. Shape works with names up to 60. Shorten it in the file and import it again. |
| Banner, Shape | More than 400 items in the set (E4-2; the ceiling of one answer, see design note 27) | This list has [N] items. Shape works on lists up to 400 items for now. Split the list, or come back when larger lists are supported. |
| Banner, Shape | The prompt would pass E4-1's 500,000 characters (E4-2; N is the whole prompt as sent) | The AI call for this list, its context and the instructions comes to [N] characters, more than one call can take. Shorten the longest items, or split the list. |
| Inline, Shape | Move to an area that is not one of the set's, through the server (E4-2) | That area does not exist. Pick one from the list. |
| Inline, Shape | Move before the first run, through the server (E4-2) | Run Shape with AI first. Items can be moved once the areas exist. |
| Inline, Shape | Move on the sample project, through the server (E4-2) | The sample project cannot be edited. |
| Banner, Shape | Context over 2,000 characters | Your project context is [N] characters. Shorten it to 2,000 or fewer. (Count shown live on Import.) |
| Inline, Import, About this project | Save with the context over 2,000 characters | Your project context is [N] characters. Shorten it to 2,000 or fewer. |
| Inline, New project | Name empty or over 80 characters | Enter a name for the project, up to 80 characters. |
| Inline, New project | The plan has no room for another project (E2-6; never on the free entry; archived projects count too, usage.ts) | Your plan has no room for another project. Change the plan. |
| Inline, About this project | Save on the sample project, through the server | The sample project cannot be edited. |
| Banner, Shape (already on the board) | Ambiguity flag | Ambiguity in [REF]. [What the item does not say]. Respondents may mark it unclear. [Dismiss] |
| Banner, Shape | Duplicate flag (E4-4) | [REF] may duplicate [REF]. If they ask for the same thing, remove one in the file and import it again. [Dismiss] |
| Inline, Shape | Dismiss on an item without a flag, through the server (E4-4) | This item has no flag to dismiss. Reload the page to see the flags as they are now. |
| Inline, Shape | Dismiss on the sample project, through the server (E4-4) | The sample project cannot be edited. |
| Inline, Shape | Reader version identical to the original | The readable version is the same as the original, so there is nothing to accept. |
| Inline, Shape | A blank edit of a reader version (E4-3, decision 0031 item 8) | Write the readable version, or reject the suggestion to keep the original. |
| Inline, Shape | An edit over 1,000 characters (E4-3; the model's versions have the same cap) | The readable version is [N] characters. Keep it to 1,000 or fewer. |
| Inline, Shape | Accept, Reject or Undo on a version that is the original again, through the server (E4-3) | The readable version is the same as the original, so there is nothing to accept. |
| Inline, Shape | Accept, Reject, Undo or Edit on an item without a reader version, through the server (E4-3) | This item has no reader version. Run Shape with AI first. |

## Build and Share (E5, E6)

| Where | When | Message |
|---|---|---|
| Inline, intro | Intro empty (a hint under the field, not a refusal: a draft may have no intro yet) | Write one or two lines so respondents know what the list is for. They see this first. |
| Inline, fields | No respondent field (Remove on the last one, and the server on an empty list) | Keep at least one field, so you can tell answers apart. Name is the usual one. |
| Inline, intro (E5-1) | Title empty or over 80 characters | Give the instrument a title, up to 80 characters. Respondents see it in the header. |
| Inline, intro (E5-1) | Intro over 1,000 characters | The intro is over 1,000 characters. Shorten it; respondents read it on a phone. |
| Inline, fields (E5-1) | A ninth field, through the server | Up to 8 fields. Remove one to add another. |
| Inline, fields (E5-1) | A label empty or over 60 characters | Give every field a label, up to 60 characters. |
| Inline, fields (E5-1) | A dropdown with under 2 or over 20 options, a repeated option, or an option over 60 characters | A dropdown needs 2 to 20 different options, one per line, each up to 60 characters. |
| Inline, fields (E5-1) | A type that is not text, dropdown or email, through the server | Pick a type for every field: Text, Dropdown or Email. |
| Inline, fields (E5-1) | The posted list is not JSON or not a list | The fields did not reach the server as a list. Reload the page and try again. |
| Inline, Build on version (E5-1) | The instrument is already on the latest set | This instrument is already built on the latest version of the list. |
| Inline, scoring (E5-2) | A method that is not one of the three, through the server | Pick one of the three methods: MoSCoW, 1 to 5 fit, or keep, change, drop. |
| Inline, scoring (E5-2) | A label over 20 characters | Each label is 1 to 20 characters. Leave one empty to keep the default. |
| Inline, scoring (E5-2) | Two values with the same label, or a label "Unclear" | Each value needs its own label, and Unclear is taken. |
| Inline, scoring (E5-2) | The posted labels are not JSON or not an object | The labels did not reach the server as a list. Reload the page and try again. |
| Inline, scoring (E5-2) | Save on a published instrument (a link or an invite exists) | Published instruments keep their method. Build a new instrument to change it. |
| Inline, Build (E5-1) | Save or Build on version on a draft that is no longer the project's newest (a stale tab) | This draft was replaced by one built on a newer version of the list. Reload the page to edit the current one. |
| Inline, Build (E5-1) | Save or Build on version on the sample, through the server (E8-8) | The sample project cannot be edited. |
| Inline, dates | Close date before open date or in the past | The close date is before the open date. Pick a later close date. |
| Inline, passcode | Passcode under 6 characters | Use at least 6 characters. Respondents type it once per device. |
| Card, public link (already on the board) | Draft | Not published yet. Nobody can open the link. |
| Card, public link (already on the board) | Published | Anyone with the link can respond until the close date. |
| Card, public link (already on the board) | Revoked | The link now shows a page saying it was withdrawn. Answers already given are kept. |
| Inline, invites | Address already invited | [EMAIL] already has a personal link. Press Remind to send it again. |
| Inline, invites | Invalid address | [TEXT] is not an email address. Check it and try again. |
| Inline, invites | Reminder too soon | Reminded [DAYS] days ago. The next reminder can go on [DATE]. |
| Banner, invites | Email could not be sent | The invite to [EMAIL] was not sent: [PROVIDER REASON]. Check the address and try again. |

## Respondent link states (E7)

| Where | When | Message |
|---|---|---|
| Page (already on the board) | Link closed | Link closed. The project team at [WORKSPACE] stopped collecting answers for [PROJECT] on [DATE]. Nothing you sent is lost. If you were still answering, contact the project team: [PM CONTACT] |
| Page (already on the board) | Link revoked | Link inactive. The project team at [WORKSPACE] withdrew this link. If you were asked to answer, ask them for a new one. Nothing was saved from this visit. |
| Page | Link not yet open | This link opens on [OPEN DATE AND TIME]. Come back then; nothing to do now. |
| Page | Token unknown | This link does not match any project. Check that you copied the whole link, or ask the person who sent it for a new one. |
| Inline, passcode | Wrong passcode | That passcode is not right. Ask the person who sent you the link. |
| Page | Passcode attempts exceeded | Too many passcode attempts. Wait [MINUTES] minutes and try again. |
| Page | Personal link already submitted, answers still editable | Welcome back, [NAME]. You submitted on [DATE]. You can change your answers until [CLOSE DATE]. [Button: Change my answers] |
| Page | Personal link already submitted, link closed | Your answers were submitted on [DATE]. The link closed on [CLOSE DATE]; nothing can be changed now. |

## Respondent answering (E7)

| Where | When | Message |
|---|---|---|
| Note under the Start button (already on the board) | A required field empty, the required fields being exactly Name and Role | Fill in your name and role to start. |
| Note under the Start button (decision 0043) | A required field empty, any other set of required fields | Fill in the required fields to start. |
| Card note (already on the board) | Not rated | Not rated yet |
| Card note (already on the board) | Different priority or Not needed, no reason | Say why. |
| Card note (already on the board) | Unclear, no question | Write your question. |
| Card note (already on the board) | Saved | Saved |
| Banner (already on the board) | Connection lost | Not saved. Your connection dropped; this page keeps trying. Your answers stay on this device until it reconnects. |
| Page | Saved answers on this device belong to a newer version of the list | The list changed since you last answered. [N] of your answers still apply and are kept; [N] items are new or changed and are marked. |
| Wrap up, list (already on the board) | Still to finish | [N] still to finish, with the item and what is missing. |
| Wrap up | Confidence not given | Pick how sure you are, 1 to 5, before you submit. |
| Wrap up | Sign-off not ticked | Tick the confirmation to submit. |
| Wrap up | Submit failed | Your answers were not submitted; they are still saved on this device. Check your connection and press Submit again. |
| Page | Device storage unavailable (private window, storage cleared) | This browser does not keep answers between visits. You can still answer in one go; if you close the page before you submit, your answers are lost. |

## Dashboard and exports (E8, E10)

| Where | When | Message |
|---|---|---|
| Empty state, results | No responses yet | No answers yet. The link is [open until DATE / not published]. Share it, or open the sample project to see what results look like. |
| Empty state, results (E8-1, 2026-10-03) | A filter matches no answer | No answers match these filters. [Button: Clear filters] |
| Line under the strip (E8-1) | Any filter on | Showing [N] of [M] responses: [FILTERS]. |
| Banner, results | Live updates lost | Live updates stopped. The page keeps the last numbers; reload to catch up. |
| Banner, results | Fewer than 3 responses in a group | Groups with fewer than 3 answers are shown but not compared, so one person cannot be singled out. (3: decision 0031.) |
| Inline, export | Export failed | The [FORMAT] export did not finish. Try again; if it fails again, export the answers as CSV, which always works. |
| Inline, PDF | PDF over the page limit | The summary runs to [N] pages. It still downloads; the deck version is the first [N]. |
| Inline, sample project | Delete sample | The sample project and its invented answers are deleted. Your own projects are not affected. [Button: Delete sample] |

## Everything else

| Where | When | Message |
|---|---|---|
| Page | 404 | This page does not exist. Check the address, or go to your projects. |
| Page | 500 | The server could not finish this request. It has been logged. Try again in a minute; if it keeps failing, email [SUPPORT EMAIL]. |
| Page | Maintenance | SMEsay is being updated and is back within [MINUTES] minutes. Respondent links keep their saved answers. |
| Banner, any form | Session expired | You were signed out after [HOURS] hours. Sign in again; what you typed on this page is kept. |
| Inline, any form | Server validation | [FIELD] [what is wrong]. [What to enter.] Never "invalid input". |

## Rules for new messages

- Name the thing: the file, the field, the item reference, the date.
- One sentence for what happened, one for what to do. A button when the next step is one click.
- Counts and dates come from the app, never typed into copy.
- Scan with `node scripts/scan-copy.mjs docs/copy` before adding a message.
