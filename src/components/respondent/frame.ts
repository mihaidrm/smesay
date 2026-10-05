// The frame of every respondent page (decision 0051, extended to every step on 2026-10-05):
// About you, the chapters, the Wrap up, Done, nothing to rate and the link pages (unknown,
// not yet open, closed, inactive, the passcode). On a phone the page is the screen: header,
// content, the action band under it, "Powered by" last. From a 576 px column (@xl, a container
// query: tailwindcss.com/docs/responsive-design, container queries) the same parts sit in a
// centered card, 48 px from the top and at least 16 px from the window's sides (the column is
// 32 px wider than the card: 752 for 720, 792 for the Wrap up's 760, 1032 for a chapter's
// 1000), with the actions centered in the card's bottom band and "Powered by" under the card
// as the last thing on the page.
export const FRAME_OUTER = "@container flex min-h-screen flex-col bg-ground text-ink";
export const FRAME_CARD = "flex grow flex-col @xl:mx-4 @xl:mt-12 @xl:grow-0 @xl:overflow-hidden @xl:rounded-[20px] @xl:border @xl:border-hairline @xl:bg-surface @xl:shadow-card";
export const FRAME_POWERED = "px-5 py-4 @xl:py-6";
// The header, the chapter row and the bands inside the card line up with the card's content.
export const FRAME_HEADER = "@xl:px-8";
// The card's bottom band: the actions, centered from 576 px, with their line under them.
export const FRAME_ACTIONS = "flex shrink-0 flex-col gap-2 border-t border-hairline bg-surface px-5 pt-3 pb-4 @xl:items-center @xl:px-8 @xl:pt-5 @xl:pb-5";
// The one dark action of a step (Start, Continue, Submit): 320 px from 576 px.
export const FRAME_PRIMARY = "@xl:w-[320px]";
// The line under the actions (what is still needed, what was saved): centered from 576 px.
export const FRAME_LINE = "@xl:min-h-0 @xl:text-center";
