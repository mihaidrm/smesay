// The visitors' sample's words (stories/E12-4). The landing page's address is /landing-page
// until Mihai moves the page to / (stories/E12-1).
export const LANDING_PATH = "/landing-page";
// The respondent app's token on /sample: not a link's (those are 32 hex characters), so the
// savers never call the server for it (src/app/r/[token]/answer-saver.ts).
export const SAMPLE_TOKEN = "sample";

export const SAMPLE_COPY = {
  band: "Sample: nothing you enter here is saved",
  saved: "Saved on this device",
  // The browser keeps nothing (storage blocked): the answer stays only while the page is open.
  notKept: "Kept until you leave this page",
  notSent: "Nothing was sent: this is the sample.",
  startFree: "Start free",
  startHref: "/sign-in",
  title: "Sample instrument",
};
