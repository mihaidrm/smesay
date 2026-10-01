# Design note 07: telling the story on the landing page, 2026-09-30

Mihai's feedback on page C: a new visitor still cannot tell what is happening. He suggested a
story: show the requirement spreadsheet, upload it, and show what it turns into.

## Why page C is hard to read

Page C shows the right things as separate exhibits. The hero shows answers arriving, a later
section shows a phone, a later one a chart. Each fragment assumes the visitor already knows
where it came from. Nobody sees one thing go in and come out the other end, so the visitor has
to assemble the story alone. Fragments also start mid-way: "answers arriving" only makes sense
after you know a list was sent.

## The rule for the next version

One object, followed from start to finish. The same six rows appear in every step, so the
visitor recognises them and sees them change. Every step has a caption in plain words that says
what just happened. Nothing on the page appears before the step that creates it.

## The story, in five states of the same list

| Step | Caption | What the visitor sees |
|---|---|---|
| 1 | You start with a spreadsheet | A real-looking xlsx grid: Ref, Requirement, Module, Priority. Six messy rows, one cell comment, the file name "Expense tool requirements v3 FINAL (2).xlsx". |
| 2 | Upload it and it becomes readable | The rows lift out of the grid and settle into three groups (Submitting, Approving, Paying), each row rewritten in plain words, with the original kept in small grey text underneath. One row shows "Accept" and "Reject". |
| 3 | Send one link | The readable list turns into a phone. One item on screen. A thumb chooses "Should be different", picks "Must", types a reason. "Saved" appears. |
| 4 | The answers come back | The same six rows, now each with a bar: agree, pushed back, unclear. One row is open, showing the two reasons behind its push-backs and the name and role of who gave them. |
| 5 | Now you know what to do | Three actions written from the answers, each naming the responses it came from, with "Mark done". Beside them, the sign-off list: who confirmed and when. |

After the story: who it is for, the comparison, pricing, the closing panel. These stay short
because the story has already done the explaining.

## Three ways to build it

### A. Scroll story (recommended for the built site)

The list is pinned on one side of the screen. As the visitor scrolls, the caption on the other
side changes and the pinned list changes state: grid, readable list, phone, results, actions.
The visitor controls the pace. It is the pattern people know from Stripe, Linear and long-form
news pages.

Cost: the most work of the three; needs the pinned panel and the five state transitions built
carefully. On a phone it falls back to option C (the steps stacked). With "reduce motion" on,
it also falls back to C.

### B. Auto-playing story at the top

One panel in the hero plays the five states in about 40 seconds with captions, like a product
video made of live UI. The rest of the page repeats each state as a still.

Cost: least work. Risk: a loop is easy to ignore, and a visitor who arrives mid-loop sees step 3
before step 1. It also repeats the mistake of page C: fragments below that assume the loop was
watched.

### C. Chapters (recommended as the fallback and the phone layout)

Five full-width chapters in order, numbered, each showing "before" on the left and "after" on
the right of the same list, with the caption above. No pinning. Works on a canvas, on a phone,
and with motion off.

Cost: middle. Risk: less of a single moment of understanding; the visitor sees five pairs
instead of one thing changing.

## Recommendation

Build A with C as its fallback, which means building C's content anyway. The first screen is
the spreadsheet itself, not a headline over a panel: the visitor recognises the artefact before
reading a word. The headline states the whole story in one line.

Headline candidates:
- Turn a requirement spreadsheet into agreed decisions.
- From a spreadsheet to sign-off, with one link.
- Upload the list. Send one link. Know who agrees and why.

## On the prototype canvas

A pinned scroll story only works when the board scrolls. The board would be set to fill the
window and launch as a page, so that Play scrolls it. On the zoomed-out canvas it shows the
first state. If Play does not scroll in this canvas, option C is shown instead and A is kept for
the built site.

## For Mihai to decide

1. A with C fallback, B, or C only.
2. The headline.
3. Whether the story uses the expense example (decision 0005) or another everyday case.
