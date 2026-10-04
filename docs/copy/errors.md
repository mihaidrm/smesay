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
| Banner, import | The project has a public link in force (E6-1: shown above the versions on every visit; the text only, the upload card keeps its own Import button) | This list is published. Importing a new version does not change the published instrument; you build a new one on the new version. |

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
| Inline, scoring (E5-2) | Shown under the locked controls of a published instrument (a link or an invite exists); the server ignores a posted method, switch or label then and saves the layout only (E5-3) | Published instruments keep their method. Build a new instrument to change it. |
| Inline, scoring (E5-3) | A layout that is not one of the three, through the server | Pick one of the three layouts: chapters, one item per screen, or a single long page. |
| Inline, perspectives (E5-4) | An eleventh perspective | Up to 10 perspectives. Remove one to add another. |
| Inline, perspectives (E5-4) | A name over 30 characters | Each perspective is 1 to 30 characters, one per line. |
| Inline, perspectives (E5-4) | Two lines naming the same perspective, ignoring case | Each perspective once. Two lines name the same one. |
| Inline, perspective chips on Shape (E5-4) | A tag that is not one of the instrument's names, through the server | That perspective is not on the instrument. Define it on Build first. |
| Inline, perspective chips on Shape (E5-4) | Tagging while the instrument has no perspectives, through the server | Define perspectives on Build first, then tag items here. |
| Inline, perspectives and chips (E5-4) | Saving the names or a tag on a published instrument (a link or an invite exists), through the server | Published instruments keep their perspectives and tags. Build a new instrument to change them. |
| Inline, perspective chips on Shape (E5-4) | A tag on an item of a newer version than the one the instrument is built on, through the server | These items are on version [N] of the list; the instrument is built on version [M]. Build on version [N] first, then tag items here. |
| Inline, perspective chips on Shape (E5-4) | A tag on an item of an older version than the instrument's (a stale Shape tab after Build on version N) | These items are version [N] of the list; the instrument is now built on version [M]. Reload the page to tag the current items. |
| Inline, perspectives (E5-4) | The names or the tags did not arrive as text or a list | The tags did not reach the server as a list. Reload the page and try again. |
| Inline, closing (E5-5) | The confidence flag posted off, through the server | The confidence question is always asked. It cannot be switched off. Reload the page and try again. |
| Inline, closing (E5-5) | The closing question over 200 characters | The closing question is over 200 characters. Shorten it; respondents answer it on a phone. |
| Inline, closing (E5-5) | The sign-off empty or over 300 characters | Write the sign-off in 1 to 300 characters. Respondents tick it before they submit. |
| Inline, closing (E5-5) | An em dash in the question or the sign-off (the one copy rule applied to the PM's words) | Replace the em dash with a comma, a colon or a full stop. Respondents read this as written. |
| Inline, closing (E5-5) | Shown under the question of a published instrument; the server refuses a save that posts another question then (a stale tab), and saves the switch and the sign-off when the question is unchanged | Published instruments keep their closing question. Build a new instrument to change it. |
| Inline, Build (E5-1) | Save or Build on version on a draft that is no longer the project's newest (a stale tab) | This draft was replaced by one built on a newer version of the list. Reload the page to edit the current one. |
| Inline, Build (E5-1) | Save or Build on version on the sample, through the server (E8-8) | The sample project cannot be edited. |
| Inline, dates (E6-1) | Close date before the open date (a published link's close date may be moved into the past, which closes it) | The close date is before the open date. Pick a later close date. |
| Inline, dates (E6-1) | No close date | Pick a close date. The link closes then. |
| Inline, dates (E6-1) | Close date in the past on Publish | The close date is in the past. Pick a date in the future. |
| Inline, Share (E6-1) | Publish or Save on an archived project | This project is archived. Unarchive it to share the list. |
| Inline, dates (E6-1) | A date that did not arrive as one, through the server | The dates did not reach the server as dates. Reload the page and try again. |
| Inline, passcode | Passcode under 6 characters | Use at least 6 characters. Respondents type it once per device. |
| Inline, passcode (E6-1) | Passcode over 64 characters | Use at most 64 characters for the passcode. |
| Inline, Share (E6-1) | Save on a draft that has no link yet (a stale tab) | This instrument is not published yet. Press Publish first. |
| Inline, Share (E6-1) | Publish when the link already exists (a second press, another tab) | This instrument is already published. Reload the page to see its link. |
| Card, public link (already on the board) | Draft | Not published yet. Nobody can open the link. |
| Card, public link (already on the board) | Published | Anyone with the link can respond until the close date. |
| Card, public link (already on the board) | Revoked | The link now shows a page saying it was withdrawn. Answers already given are kept. |
| Inline, invites (E6-2) | Address already sent (the whole send is refused, nothing goes; a Not sent address goes again instead; the second of two sends racing on one new address gets this line under the count) | [EMAIL] already has a personal link. Press Remind to send it again. |
| Inline, invites (E6-2) | A piece of the list that is not an address (the whole send is refused) | [TEXT] is not an email address. Check it and try again. |
| Inline, invites (E6-2) | Empty box | Enter at least one email address, one person per line. |
| Inline, invites (E6-2) | More than 100 people in one send | Up to 100 people per send. Split the list and send again. |
| Inline, invites (E6-2) | A name or role over 80 characters | Keep each name and role to 80 characters. |
| Inline, invites (E6-2) | Send before the public link exists (the box is off; a stale tab) | Publish the public link first. Personal links take its open and close dates. |
| Inline, invites (E6-2) | Send while the public link is closed by its date | The public link is closed. Move its close date to send invites. |
| Inline, invites (E6-2) | Send while the public link is revoked (E6-4) | The public link is revoked. Publish again to send invites. |
| Inline, invites (E6-2) | The list would pass 500 personal invites in the workspace in any 24 hours | This workspace can send [N] more invites right now (500 in any 24 hours). Shorten the list, or try again later. (none left: This workspace sent 500 invites in the last 24 hours. Try again later.) |
| Inline, invites (E6-2), under "[N] invites sent." | A Not sent address pasted again within 15 minutes of its last send start (another request may still be sending it, or that request died) | A send to [EMAIL] started in the last 15 minutes and may still be going. If the row still says Not sent after that, paste the address again. |
| Inline, invites (E6-2) | Send on an instrument whose link a newer version's publish replaced between the page load and the check under the lock (a stale tab gets the Build page's replaced message from own() first) | A newer version of the list was published while you were sending. Nothing was sent. Reload the page, paste the people again and send: the invites go with the newer version's link. |
| Inline, invites (E6-2) | The list did not arrive as text | The list did not reach the server as text. Reload the page and try again. |
| Inline, invites (E6-3), in place of Remind and as the server's refusal | Reminder too soon (under three days since the last) | Reminded [DAYS] days ago. The next reminder can go on [DATE AND TIME UTC]. |
| Inline, invites (E6-3), under the count | The reminder's email failed (the claim is given back) | The reminder to [EMAIL] was not sent: [PROVIDER REASON]. Try again later. |
| Inline, invites (E6-3) | Remind pressed twice at once and the row reads too soon when read again (under "[N] reminders sent.") | [EMAIL]: Reminded [DAYS] days ago. The next reminder can go on [DATE AND TIME UTC]. |
| Inline, invites (E6-3) | Remind pressed twice at once and the row still reads due when read again (the other request's email failed and its claim came back, or a respondent's save moved the newest response) | [EMAIL] was not reminded: another request changed the row just now. Reload the page to see the row as it is. |
| Inline, invites (E6-3) | Remind on a person who submitted, a Not sent row or a revoked invite (a stale tab) | [EMAIL] cannot be reminded: the invite was not sent, was revoked, or the person has submitted. Reload the page to see the row as it is. |
| Inline, invites (E6-3), under the button | Remind everyone when nobody is due (a stale tab) | Nobody is due a reminder. |
| Inline, invites (E6-3) | Remind while the public link is not published, closed or revoked | The same three lines as sending an invite (E6-2 rows above). |
| Inline, Share (E6-4) | Revoke link on a link already revoked (a stale tab) | This link is already revoked. Press Publish again for a new one. |
| Inline, Share (E6-4) | Revoke link before publishing (a stale tab) | This instrument is not published yet. Press Publish first. |
| Inline, Share (E6-4) | Revoke link in a tab that showed a link published again since | This link changed since the page opened. Reload the page to see where it stands. |
| Inline, invites (E6-4) | Revoke in a tab that showed a row given a new link since | [EMAIL] got a new link since the page opened. Reload the page to see the row as it is. |
| Inline, invites (E6-4) | A revoked address pasted in the box again | [EMAIL] is revoked. Press New link on its row to send a fresh one. |
| Inline, Share (E6-4) | Save the dates of a revoked link (a stale tab) | This link is revoked. Press Publish again for a new one; its dates are set then. |
| Inline, invites (E6-4) | Revoke on a row already revoked (a stale tab) | [EMAIL] is already revoked. Press New link to send a fresh one. |
| Inline, invites (E6-4) | New link on a row that is not revoked (a stale tab) | [EMAIL] is not revoked, so it has its link. Reload the page to see the row as it is. |
| Inline, invites (E6-4), under New link | The new link's email failed (the row reads Not sent with the reason) | The new link for [EMAIL] was made but not sent: [PROVIDER REASON]. Paste the address again to send it. |
| Inline, invites (E6-4) | New link while the public link is not published, closed or revoked | The same three lines as sending an invite (E6-2 rows above). |
| Inline, invites (E6-4) | New link on an instrument whose link a newer version replaced since the page opened | A newer version of the list was published since the page opened. Nothing was sent. Reload the page to see where things stand. |
| Inline, Share (E6-4) | Save the dates in a tab that showed a link published again since | This link changed since the page opened. Reload the page to see where it stands. |
| Inline, invites (E6-2), under "[N] invites sent.", one line per address; the row stays with the status Not sent and the reason | Email could not be sent | The invite to [EMAIL] was not sent: [PROVIDER REASON]. Check the address and try again. ([PROVIDER REASON] is the server's first line, cut to 200 characters, its final period dropped, with every word holding a host, an address or a login cut to "[server]" (SECURITY.md); when nothing but servers was in it: the mail server refused it, and its reason named only servers; when it was empty: the mail server refused it) |

## Respondent link states (E7)

| Where | When | Message |
|---|---|---|
| Page (already on the board) | Link closed (by its close date, by a newer version's link, or the project archived: [DATE] is then the day it was archived) | Link closed. The project team at [WORKSPACE] stopped collecting answers for [PROJECT] on [DATE]. Nothing you sent is lost. If you were still answering, contact the project team: [PM CONTACT] (the last sentence only when a contact is known: a personal invite's sender, E6-2; the public link shows none) |
| Page (already on the board) | Link revoked | Link inactive. The project team at [WORKSPACE] withdrew this link. If you were asked to answer, ask them for a new one. Nothing was saved from this visit. |
| Page | Link not yet open | This link opens on [OPEN DATE AND TIME]. Come back then; nothing to do now. (the title is the first sentence, the line the second; E6-1) |
| Page | Token unknown | This link does not match any project. Check that you copied the whole link, or ask the person who sent it for a new one. |
| Page (E7-1) | The sample project's link (it never collects answers, E8-8 acceptance 2) | This is a sample link. It belongs to the sample project in [WORKSPACE] and does not collect answers. Ask the person who sent it for the real link. (Under it, the sample band: Sample data: invented answers, for looking around, E8-8 acceptance 1) |
| Page, under the closed line (E7-1, acceptance 3) | A closed personal link whose respondent started, answered at least one item and did not submit (none answered: the closed page alone; submitted: E7-6) | You answered [N] of [M] items before it closed. They were not submitted; the project team sees them marked as not submitted. ("item" when [M] is 1) |
| Inline, passcode | Wrong passcode | That passcode is not right. Ask the person who sent you the link. |
| Inline, passcode page (E6-1: 5 wrong attempts per link and address, or 60 per link, in 15 minutes; E11-1 widens it) | Passcode attempts exceeded | Too many passcode attempts. Wait [MINUTES] minutes and try again. |
| Inline, passcode page (E6-1) | The link closed, was revoked or lost its passcode while the page was open | This link changed since the page opened. Reload the page to see where it stands. |
| Inline, passcode page (E6-1) | The process's attempt table is full of live entries (docs/review-list.md) | Too many people are entering passcodes right now. Wait a few minutes and try again. |
| Page (E6-1; E11-6 builds the full error pages) | The link page failed to load (a server error) | This page could not be loaded. Something went wrong on our side. Try again in a moment. [Button: Try again] |
| Page (E7-6) | A submitted response opened again while the link is open (personal link, or a public link on the same device) | Welcome back, [FIRST NAME]. You submitted on [DATE AND TIME UTC]. You can change your answers until [CLOSE DATE AND TIME UTC]. (without a close date: while the link is open) Then the summary line and [Button: Change my answers] |
| Page under "Link closed." (E7-6) | Personal link already submitted, link closed (a closed public link shows no per-device state, decision 0031) | Your answers were submitted on [DATE AND TIME UTC]. The link closed on [CLOSE DATE AND TIME UTC]; nothing can be changed now. |
| Page under "Link closed." (E7-6) | The same, with answers changed after the last Submit and not submitted again | Your answers were submitted on [DATE AND TIME UTC]. You changed some after that and did not submit them again. The link closed on [CLOSE DATE AND TIME UTC]; nothing can be changed now. |

## Respondent answering (E7)

| Where | When | Message |
|---|---|---|
| Note under the Start button (already on the board) | A required field empty, the required fields being exactly Name and Role | Fill in your name and role to start. |
| Note under the Start button (decision 0043) | A required field empty, any other set of required fields | Fill in the required fields to start. |
| Note under the Start button (E7-1) | Start did not reach the server, or the server failed | Your details were not saved. Check your connection and press Start again. |
| A write route, from the server (E5-6) | A preview token sent to Start, an answer, the Wrap up or Submit (403; the preview itself sends nothing) | This is a preview. Nothing entered here is saved. |
| Note under the Start button (E7-1), from the server | A dropdown value that is not one of its options (a stale page) | Pick one of the options for [LABEL]. |
| Note under the Start button (E7-1), from the server | An email field that is not an address | [TEXT] is not an email address. Check it and try again. |
| Note under the Start button (E7-1), from the server | A field over 200 characters | Keep [LABEL] to 200 characters. |
| Note under the Start button (E7-1), from the server | The form did not arrive as JSON, or a perspective not on the list (a stale page) | Your details did not reach the server as a form. Reload the page and try again. / Pick the perspectives from the list on the page. Reload the page and try again. |
| Card note (E7-2) | Not rated | Not rated yet |
| Card note (E7-2) | Different priority or Not needed, no reason | Say why. |
| Card note (E7-2) | Unclear, no question | Write your question. |
| Card note (E7-2) | Saved: the server has the complete answer | Saved |
| Card note (E7-2), from the server | The answer is not one of the card's values, or did not arrive as JSON (a stale page) | The answer did not reach the server as one of the card's values. Reload the page and try again. |
| Card note (E7-2), from the server | A reason or comment over 2,000 characters | Keep the reason and the comment to 2000 characters each. |
| Card note (E7-2), from the server | The item is not in the respondent's list (a perspective changed, a stale page) | This item is not in your list. Reload the page to see your items. |
| Note under the Start button (E7-2), from the server | An answer sent for a response this device does not have (cookies cleared in another tab); the page returns to About you, marks every card not saved, and sends the cards again after Start | Your details were not found on this device. Press Start again and the answers on this page are saved with them. |
| Banner over the chapter (E7-3) | Connection lost: an answer could not reach the server | Not saved. Your connection dropped; this page keeps trying. Your answers stay on this device until it reconnects. |
| Header note (E7-3) | Answers that cannot reach the server: the connection dropped, or the server failed or refused for now (a 5xx, a rate limit); it stays until every failed answer has gone through | Not saved |
| Card note (E7-3) | A complete answer not yet on the server while the page cannot reach it | Not saved yet |
| Card note (E7-3), from the server | Another window or device saved the item's answer after this page's change was made on it (also for a change the device kept unsent and sent on opening); the card shows the stored answer | This answer was changed in another window or on another device. The card shows the saved one; change it again if yours should stand. |
| Note under the Start button (E7-3) | Start worked but the first save found no response: the browser did not keep the device cookie | This browser did not keep the cookie this page needs to save your answers. Allow cookies for this site, or open the link in another browser. |
| Page | Saved answers on this device belong to a newer version of the list (not built in R1: publishing a newer version closes the older link, so the respondent sees the closed page and the device's unsent answers are removed; docs/review-list.md) | The list changed since you last answered. [N] of your answers still apply and are kept; [N] items are new or changed and are marked. |
| Wrap up, box and list (E7-4) | Still to finish | [N] still to finish. [Button: Go to [CHAPTER OF THE FIRST]]; then "Still to finish", each item with its reference and what is missing: Not rated yet, Say why., Write your question., or Not saved yet (complete on the card, not yet on the server); each row opens its own item |
| Wrap up, from the server (E7-5) | Confidence not given | Pick how sure you are, 1 to 5, before you submit. |
| Wrap up, from the server (E7-5) | Sign-off not ticked | Tick the confirmation to submit. |
| Wrap up (E7-5) | While Submit waited for the cards, one was refused or changed in another window | One of your answers was not saved as you left it. Check the cards with a red note, then submit again. |
| Wrap up (E7-5), above the form | Another window or device saved the Wrap up after this page's change was made on it (also a change the device kept and could not send since, and a Submit made on an older Wrap up); the form shows the stored one and the sign-off is unticked | Your Wrap up was changed in another window or on another device. This page shows the saved one now; change it again if yours should stand. |
| Wrap up, from the server (E7-5) | The PM changed the sign-off sentence after the page opened | The confirmation changed since this page opened. Reload the page, read it and tick it again. |
| Wrap up (E7-5) | Submit failed: no connection, or the server failed | Your answers were not submitted; they are still saved on this device. Check your connection and press Submit again. |
| Wrap up, from the server (E7-5) | An item is still to finish (another tab, a stale page) | [N] items are still to finish. Finish them in the chapters, then submit. (1 item is ... Finish it ...) |
| Wrap up, from the server (E7-5) | A mandatory field is empty (the PM changed About you) | Fill in your details on About you, then submit. |
| Wrap up, from the server (E7-5) | The missing item names an area or a value not on the page, or is not text | The missing item did not reach the server as written. Check it and submit again. |
| Wrap up, from the server (E7-5) | The missing item over 500 characters, the closing answer over 2,000 | Keep the missing item to 500 characters. / Keep your answer to 2000 characters. |
| Wrap up, from the server (E7-5) | The workspace's plan has used its responses for the month (no plan has a cap today, E2-6) | This survey is not taking answers right now. Tell the person who sent you the link; your answers are kept. |
| Banner over the first screen after About you, once (E7-3) | Device storage unavailable: the browser refuses localStorage (blocked site data; MDN, Window.localStorage: a private window's storage is cleared when its last private tab closes) | This browser does not keep answers between visits. You can still answer in one go; if you close the page before you submit, your answers are lost. |

## Dashboard and exports (E8, E10)

| Where | When | Message |
|---|---|---|
| Empty state, results | No responses yet | No answers yet. The link is [open until DATE / open / not open until DATE / closed / revoked / not published]. Share it, or open the sample project to see what results look like. [Button: Share it] [Button: Open the sample project] (E8-1: the link phrase by the link's state; no sample button on the sample itself; with the sample deleted: The link is [STATE]. Share it to collect answers.) |
| Empty state, results (E8-1, 2026-10-03) | A filter matches no answer | No answers match these filters. [Button: Clear filters] |
| Line under the strip (E8-1) | Any filter on | Showing [N] of [M] responses: [FILTERS]. ([FILTERS]: each filter as the bar names it, joined by "; ", for example Role: Sales, Finance; Different priority; With a reason or comment) |
| Inline, results (E8-1, E8-3) | Choose tiles, the switch or the Agreement tab's view saved on a project with nothing published | This project has nothing published to show yet. Build and share it first. |
| Inline, results (E8-1, E8-3) | Choose tiles, the switch or the Agreement tab's view could not reach the server | Your choice was not saved. Try again. |
| Banner, results (E8-1) | The headline numbers, a tab or an item's detail fail to load | [PART] could not load. It has been logged. Try again in a minute. [Button: Try again] ([PART]: The headline numbers, the tab's name, or The item's detail (E8-5)) |
| Banner, results | Live updates lost | Live updates stopped. The page keeps the last numbers; reload to catch up. |
| Banner, results | Fewer than 3 responses in a group | Groups with fewer than 3 answers are shown but not compared, so one person cannot be singled out. (3: decision 0031.) |
| Inline, Actions tab (E9-1) | Write actions on the sample | The sample's actions are invented and cannot be written again. Write actions on your own project. |
| Inline, Actions tab (E9-1) | The AI budget for the month is used | This workspace has used its AI budget for the month. The answers are all on the other tabs. Come back next month to write actions. |
| Inline, Actions tab (E9-1) | AI paused by the product cap | AI is paused until next month. The answers are all on the other tabs. |
| Inline, Actions tab (E9-1) | The plan's AI runs for the month are used | This workspace has used its AI runs for the month on its plan. The answers are all on the other tabs. Change the plan, or come back next month. |
| Inline, Actions tab (E9-1) | The AI did not answer | The AI did not answer. No action changed. Try again in a minute. [Button: Try again] |
| Inline, Actions tab (E9-1) | The AI answered in a form the app could not use | The AI answered in a form the app could not use. No action changed. Try again. [Button: Try again] |
| Inline, Actions tab (E9-1) | Too many AI requests at once | Too many AI requests at once. Wait a minute and try again. |
| Inline, Actions tab (E9-1) | The prompt would be over the input limit | There are too many answers to write actions from in one go. Every reason and question is on the Different priority and Disagree and the Questions and gaps tabs; work from those. |
| Inline, Actions tab (E9-1) | Write actions before any submitted answer (a guard; the tab shows only once there are answers) | Actions are written from the submitted answers. Write them once someone has submitted. |
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
