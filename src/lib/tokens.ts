// Design tokens as values, for the styleguide page and for code that needs a colour outside
// CSS (charts, exports, emails). The CSS twin is src/app/globals.css; the text is
// docs/design-system.md. Change all three in the same commit (decision 0017).

export const tokens = {
  white: "#FFFFFF",
  grey50: "#F6F6F4",
  greige: "#ECEAE5",
  hairline: "#E6E4DF",
  hairlineStrong: "#C9C7C1",
  inkMuted: "#5B6069",
  inkSoft: "#454A52",
  ink: "#16181C",
  inkRaised: "#22252A",
  placeholder: "#8A8E96",
  danger: "#9B2C2C",
  teal50: "#E3F1EF",
  teal100: "#CADEDD",
  teal200: "#A3C7C4",
  teal300: "#7FD1C6",
  teal400: "#4CA399",
  teal500: "#2A847C",
  teal600: "#21776F",
  teal700: "#0E6B63",
  teal800: "#10524E",
  teal900: "#123D3C",
  status: {
    agree: { label: "Agree", solid: "#2F855A", tint: "#E6F4EC", text: "#22643F" },
    pushedBack: { label: "Pushed back", solid: "#B7791F", tint: "#FBF1DC", text: "#7A5210" },
    unclear: { label: "Unclear", solid: "#7C3AED", tint: "#EEE8FA", text: "#4C2F94" },
    missing: { label: "Missing", solid: "#2B6CB0", tint: "#E3EEF9", text: "#1F4F7A" },
    disagree: { label: "Disagree", solid: "#718096", tint: "#F0F0EE", text: "#454A52" },
  },
  shadow: "0 10px 28px rgba(22, 24, 28, 0.08)",
  radius: { control: 6, card: 12, panel: 20, pill: 999 },
  space: [4, 8, 12, 16, 24, 32, 48, 64, 96],
  type: [
    { size: 64, line: 66, tracking: "-0.045em", weight: 500, use: "marketing headline (40 on a phone)" },
    { size: 40, line: 44, tracking: "-0.035em", weight: 500, use: "section heading" },
    { size: 32, line: 36, tracking: "-0.03em", weight: 500, use: "page title in the app" },
    { size: 24, line: 30, tracking: "-0.02em", weight: 500, use: "card title, respondent screen title" },
    { size: 20, line: 26, tracking: "-0.02em", weight: 500, use: "lead paragraph, step title" },
    { size: 17, line: 26, tracking: "-0.01em", weight: 400, use: "respondent body, marketing body" },
    { size: 16, line: 24, tracking: "0", weight: 400, use: "marketing small body, email body" },
    { size: 14, line: 20, tracking: "0", weight: 400, use: "app body, tables" },
    { size: 13, line: 18, tracking: "0", weight: 400, use: "app secondary, captions" },
    { size: 12, line: 16, tracking: "0", weight: 400, use: "labels, mono references, timestamps" },
  ],
} as const;

export type StatusKey = keyof typeof tokens.status;
