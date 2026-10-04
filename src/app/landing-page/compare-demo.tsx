"use client";
// "Why not a spreadsheet, a form or a workshop?" (stories/E12-1 as amended on 2026-10-04,
// design note 58): the usual ways a PM collects expert views, against SMEsay, on six points.
// The visitor picks the way they use today and the "Today" column changes; the SMEsay
// column is the same for all three. The ways are named generically, not as products
// (design note 58). Every SMEsay line is a claim on R1 as planned and is listed in
// docs/copy/landing.md, Claims to check before launch (decision 0042). The switch is the
// landing's segmented control (design note 53): toggle buttons with aria-pressed in a named
// group (developer.mozilla.org/docs/Web/Accessibility/ARIA/Reference/Attributes/
// aria-pressed). Without JavaScript the first way shows. Colours are written out because
// the landing keeps its own light section whatever the app's mode (decision 0041, point 2).
import { useState } from "react";
import { cn } from "cn";

const POINTS = ["Setting it up", "For your experts", "The why behind a no", "Who has answered", "Making sense of it", "What you walk out with"] as const;

const WAYS = [
  {
    key: "sheet",
    label: "Spreadsheet by email",
    // Under 640 px the switch says "Spreadsheet" so the three options fit a 390 px phone.
    short: "Spreadsheet",
    today: [
      "You send the sheet as it is, codes and jargon included.",
      "They open an attachment, fill in a column and email it back. On a phone that is hard work.",
      "A comment only when someone thinks to write one.",
      "You track replies in your inbox and chase people one by one.",
      "You copy every reply into one sheet before you can count anything, then sort by role by hand.",
      "A merged sheet to write the decisions up from, after copy and paste steps nobody can check.",
    ],
  },
  {
    key: "form",
    label: "Survey form",
    short: "Survey form",
    today: [
      "You rebuild the list in the form builder, one question at a time.",
      "They meet each item as you typed it, with the words your team uses.",
      "A rating, and a reason only if you added a box for it and they filled it in.",
      "A count of responses. Knowing who is missing takes a list and a comparison.",
      "One chart per question. Comparing groups means exporting and building it yourself.",
      "A spreadsheet of answers to turn into decisions yourself.",
    ],
  },
  {
    key: "workshop",
    label: "Workshop",
    short: "Workshop",
    today: [
      "Finding a time that suits everyone, then a room or a call.",
      "An hour or more of everyone's time, including the items they already agree on.",
      "Reasons are said out loud, and the notes keep some of them.",
      "Whoever came took part. Whoever could not, missed it.",
      "The loudest voices tend to set the direction. Quiet and remote experts say less.",
      "One person's notes, written up afterwards.",
    ],
  },
] as const;

const SMESAY = [
  "Import the sheet you already have. AI sorts it into areas and writes each item in plain words; you choose which wording goes out.",
  "One link, no account, made for a phone. Answers save as they go, so they can stop and come back.",
  "When an expert does not agree with the proposal, the answer asks for a reason before it counts. Unclear asks for their question.",
  "Invite people by email, see who has submitted, and remind the rest with one button.",
  "Everyone answers on their own, and the answers arrive in one place, counted per item and area. Filter by role to see which group disagrees, and why.",
  "A to-do list drafted by AI, each line naming the answers behind it, and numbers that match the CSV to the row.",
];

type Way = (typeof WAYS)[number]["key"];

export function CompareDemo() {
  const [way, setWay] = useState<Way>("sheet");
  const today = WAYS.find((w) => w.key === way) ?? WAYS[0];
  return (
    <div className="flex flex-col gap-5" data-testid="compare" data-way={way}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <span id="compare-label" className="text-[14px] font-semibold text-[#5E5A72]">What you use today</span>
        <div className="flex self-start overflow-x-auto rounded-full bg-[#EEEAFF] p-[3px] text-[13px] font-semibold" role="group" aria-labelledby="compare-label">
          {WAYS.map((w) => (
            <button key={w.key} type="button" aria-pressed={way === w.key} onClick={() => setWay(w.key)} className={cn("h-8 shrink-0 rounded-full px-3.5 whitespace-nowrap outline-hidden transition-[background-color,box-shadow,color] duration-150 focus-visible:ring-2 focus-visible:ring-[#6D4CF5] focus-visible:ring-offset-2 motion-reduce:transition-none", way === w.key ? "bg-white text-[#15131F] shadow-[0_2px_8px_rgba(45,32,110,0.14)]" : "text-[#5E5A72] hover:text-[#15131F]")}><span className="sm:hidden">{w.short}</span><span className="hidden sm:inline">{w.label}</span></button>
          ))}
        </div>
      </div>
      <div className="overflow-hidden rounded-[20px] border border-[#E6E3F0] bg-white shadow-[0_12px_32px_rgba(45,32,110,0.10)]">
        <div className="hidden grid-cols-[200px_1fr_1fr] border-b border-[#E6E3F0] text-[12px] font-bold tracking-[0.04em] uppercase md:grid" aria-hidden="true">
          <span className="px-5 py-3 text-[#5E5A72]" />
          <span className="px-5 py-3 text-[#5E5A72]">Today, with a {today.label.toLowerCase()}</span>
          <span className="bg-[#F4F1FF] px-5 py-3 text-[#5A3BE0]">With SMEsay</span>
        </div>
        <ul className="divide-y divide-[#E6E3F0]">
          {POINTS.map((point, i) => (
            <li key={point} className="grid md:grid-cols-[200px_1fr_1fr]" data-testid="compare-row">
              <h3 className="px-5 pt-4 text-[15px] leading-[22px] font-bold md:py-4">{point}</h3>
              <div className="px-5 pt-2 pb-3 md:py-4">
                <span className="mb-1 block text-[11px] font-bold tracking-[0.04em] text-[#5E5A72] uppercase md:sr-only">Today</span>
                <p className="text-[15px] leading-[22px] text-[#5E5A72]" data-testid="compare-today">{today.today[i]}</p>
              </div>
              <div className="bg-[#F4F1FF] px-5 pt-3 pb-4 md:py-4">
                <span className="mb-1 block text-[11px] font-bold tracking-[0.04em] text-[#5A3BE0] uppercase md:sr-only">With SMEsay</span>
                <p className="text-[15px] leading-[22px] text-[#15131F]">{SMESAY[i]}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
