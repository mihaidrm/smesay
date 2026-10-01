# E12-4 A sample instrument visitors can answer

User: a visitor pressing "Try the sample as a respondent" on the landing page
Status: ready
Outcome: a public link to the Marlow instrument that anyone can go through on their phone
without creating anything in anyone's workspace.

## Acceptance criteria
1. /sample opens the Marlow Group instrument in the respondent app in preview mode (E5-6):
   answers stay on the device for the visit, nothing is written to a workspace, the header says
   "Sample: nothing you enter here is saved", Submit shows the Done page without storing.
2. The sample carries the watermark band (E8-8) and the "Powered by SMEsay" lockup with a
   link to the landing page; the Done page offers "Start free".
3. Rate limited like any respondent route (E11-1); no cookie beyond the preview's own.
4. Playwright: open /sample, answer one item, see Saved on this device, reach Done.

## Out of scope
- Collecting the visitors' answers for research: not without a privacy notice; not in R1.

## Open questions
- Whether the sample should store nothing (recommended, nothing to explain in the privacy
  policy) or keep anonymous answers so the landing page could show real visitor data later.
  Mihai decides.

## Technical notes
A fixed instrument built from the seed data in a read-only "sample" workspace that exists in
every deployment (created by the seed), served through the preview mode of E5-6 with a public
preview token that never expires.
