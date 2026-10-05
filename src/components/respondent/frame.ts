// The frame of the short respondent pages (About you, Done, nothing to rate and the link pages:
// unknown, not yet open, closed, inactive, the passcode), decision 0051. On a phone the page is
// the screen: header, content, the action under it, "Powered by" last. From a 576 px column
// (@xl, a container query: tailwindcss.com/docs/responsive-design, container queries) the
// same parts sit in a centered card, 720 px wide, 48 px from the top, with "Powered by" under
// the card as the last thing on the page.
export const FRAME_OUTER = "@container flex min-h-screen flex-col bg-ground text-ink";
export const FRAME_CARD = "flex grow flex-col @xl:mt-12 @xl:grow-0 @xl:overflow-hidden @xl:rounded-[20px] @xl:border @xl:border-hairline @xl:bg-surface @xl:shadow-card";
export const FRAME_POWERED = "px-5 py-4 @xl:py-6";
// The header inside the card lines up with the card's content.
export const FRAME_HEADER = "@xl:px-8";
