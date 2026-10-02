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
| Inline, sidebar footer | Sign out request failed | Sign out did not complete. Try again. |
| Page | Google or Microsoft sign-in cancelled or refused | Sign-in with [PROVIDER] did not complete. Try again, or use the email link. |
| Inline, invite field | Member invite to an address already in the workspace | [EMAIL] is already a member of this workspace. |
| Banner, settings | Accent colour under 4.5:1 on white | This colour is too light on white, so the respondent page uses the default. Pick a darker one to use yours. |
| Page | Workspace deleted by its owner | This workspace was deleted on [DATE]. Its data is removed within 24 hours. Contact [OWNER EMAIL] if you did not expect this. |

## Import (E3)

| Where | When | Message |
|---|---|---|
| Inline, upload | File is not xlsx or csv | This file is [EXTENSION]. Upload an xlsx or csv, or paste the list instead. |
| Inline, upload | File over the size limit | This file is [SIZE]. The limit is [LIMIT, decide in E3]. Remove sheets or columns you do not need and upload again. |
| Inline, upload | No header row found | No header row found. Pick the row that holds the column names, or tell us which column is the requirement. |
| Inline, upload | No column mapped to the item text | Pick the column that holds the requirement text. Without it there is nothing to import. |
| Inline, paste box | Empty or one line | Paste at least two lines, one item per line. |
| Card, check before import | Empty rows, duplicates, long items (counts already on the board) | [N] empty rows, skipped. [N] exact duplicates, imported once. [N] items over 1,000 characters, imported whole; consider splitting them in Shape. |
| Banner, import | Upload interrupted | The upload stopped before the file arrived. Check your connection and upload it again. Nothing was imported. |
| Banner, import | New version of a list already published | This list is published. Importing a new version does not change the published instrument; you build a new one on the new version. [Button: Import as version [N]] |

## Shaping (E4)

| Where | When | Message |
|---|---|---|
| Banner, Shape | AI call failed | The AI did not answer. Nothing changed. Try again; if it fails again, use the items as imported and come back later. [Button: Try again] |
| Banner, Shape | Workspace AI budget spent | This workspace has used its AI budget for the month. The list is imported and can be published as it is. Ask the workspace owner to raise the budget. |
| Banner, Shape | Rate limited | Too many AI requests at once. Wait a minute and try again. |
| Banner, Shape | Context over 2,000 characters | Your project context is [N] characters. Shorten it to 2,000 or fewer. (Count shown live on Import.) |
| Banner, Shape (already on the board) | Ambiguity flag | Ambiguity in [REF]. [What the item does not say]. Respondents may mark it unclear. [Dismiss] |
| Inline, Shape | Reader version identical to the original | The readable version is the same as the original, so there is nothing to accept. |

## Build and Share (E5, E6)

| Where | When | Message |
|---|---|---|
| Inline, intro | Intro empty | Write one or two lines so respondents know what the list is for. They see this first. |
| Inline, fields | No respondent field | Keep at least one field, so you can tell answers apart. Name is the usual one. |
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
| Note under the Start button (already on the board) | Name or role empty | Fill in your name and role to start. |
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
