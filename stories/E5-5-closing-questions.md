# E5-5 Closing: free-text question, mandatory confidence, missing-item form, sign-off text

User: a PM deciding how the respondent journey ends
Status: ready
Outcome: the Wrap up carries an optional free-text question, the confidence scale always, the
missing-item form when wanted, and sign-off wording the PM wrote.

## Acceptance criteria
1. Build's Closing card: closing question (text, optional, up to 200 characters), missing-item
   form on or off (default on), sign-off text (default "I confirm these are my answers and
   they can be shared with the project team.", up to 300 characters). Confidence 1 to 5 is
   always on and shown as such (decision 0003, business plan E5).
2. An instrument cannot be published without the confidence question; since it cannot be
   switched off, the server rejects a ClosingSpec with confidence false (unit test).
3. The respondent Wrap up (E7-5) reads all four from the instrument; the preview panel shows
   the Wrap up when the Closing card is focused.
4. Server validation on every field; the sign-off text is scanned by the copy rules at save
   time only for em dashes (the PM's words are theirs).

## Out of scope
- Several closing questions: not in R1 (decision 0010 item 5).

## Open questions
- None.

## Technical notes
instrument.closing as ClosingSpec (INTERFACES.md): `{ confidence: true, missingForm, signOffText,
closingQuestion? }`; the optional closingQuestion is added to INTERFACES.md before the first
save. instrument.closing's default already satisfies the spec (E1-2).
