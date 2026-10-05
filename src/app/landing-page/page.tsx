// The landing page, design v2 (stories/E12-1 as amended on 2026-10-03; the LandingF board,
// docs/design-notes/prototype-01/LandingF.dc.html; copy from docs/copy/landing.md). Served at
// /landing-page until Mihai moves it to /: a dark hero with the aurora, the dot grid and the
// cursor light, the live card tilted with the mascot at its corner, light
// "three steps" and "what you get back" sections, the questions, dark pricing and footer.
// Amended 2026-10-04 (design note 53, Mihai's review): the Shape card switches between the
// spreadsheet as imported and the shaped list (concept 3 of the brainstorm); the third step
// no longer speaks of phones, the questions do; "What you get back" leads with what the PM
// gains, over the results fragment with its three views. Amended the same day (design note
// 58, Mihai: "a section ... where we absolutely show all the advantages ... compared to other
// traditional ways"): "Why not a spreadsheet, a form or a workshop?" between What you get
// back and Pricing, with Compare in the nav. The fragments use the Marlow
// sample's own rows and numbers (src/db/seed/sample.ts). Desktop 1440 and
// phone 390 in one pass (decision 0015): one column under 1024 px, the card upright and full
// width, the type one step smaller. The landing keeps its own light and dark sections
// whatever the app's mode (decision 0041, point 2), so its colours are written out, not read
// from the mode tokens. The product fragments are the Marlow example as static markup until
// the dashboard components exist (E8 to E10); they are swapped for the real components
// then (acceptance 4, amended). The page describes the R1 product as planned, not
// only what is built today (decision 0042: the copy rule is for the live product; the planned
// lines are checked at the launch gate, docs/copy/landing.md).
// Small text on the dark hero is #C9C4E0 or lighter so it keeps 4.5 over the aurora and the
// cursor light; the two card labels on light use the text colours of their hues.
import type { Metadata } from "next";
import Link from "next/link";
import { Mascot } from "@/components/app/mascot";
import { Lockup } from "@/components/brand/mark";
import { buttonVariants } from "@/components/ui/button";
import { CompareDemo } from "./compare-demo";
import { CursorLight } from "./cursor-light";
import { ResultsDemo } from "./results-demo";
import { Reveal } from "./reveal";
import { GoalLink } from "@/components/analytics/goal-link";
import { PlausibleScript } from "@/components/analytics/plausible-script";
import { GOALS } from "@/lib/plausible";
import { cleanSource, signInHref } from "@/lib/utm";
import { ShapeDemo } from "./shape-demo";

export const metadata: Metadata = {
  title: "SMEsay: send the list as a link",
  description: "Your experts go through the list item by item: agree, push back with a reason, or ask a question. You get a dashboard, a to-do list written by AI, and the CSV.",
};

const NAVY = "#16152A";
const ghost = "inline-flex h-[50px] items-center justify-center rounded-full border border-[#46445F] bg-white/[0.03] px-[26px] text-[16px] font-bold text-[#F3F1FA] transition-[transform,border-color,background-color] duration-150 ease-out hover:-translate-y-0.5 hover:border-[#9B86FF] hover:bg-[#9B86FF]/15 motion-reduce:hover:translate-y-0 outline-none focus-visible:ring-2 focus-visible:ring-[#9B86FF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#16152A]";
const navLink = "hidden rounded-sm transition-colors duration-150 outline-none hover:text-[#F3F1FA] focus-visible:ring-2 focus-visible:ring-[#9B86FF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#16152A] md:inline";
const primary = buttonVariants({ variant: "primary", className: "h-[50px] px-[26px] text-[16px] focus-visible:ring-offset-[#16152A]" });

function Avatar({ initials, tint, text }: { initials: string; tint: string; text: string }) {
  return <span className="flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ background: tint, color: text }}>{initials}</span>;
}
function Pill({ children, tint, text }: { children: React.ReactNode; tint: string; text: string }) {
  return <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap" style={{ background: tint, color: text }}>{children}</span>;
}

// The live card: the Marlow example (decision 0005), one item with four answers arriving.
function LiveCard() {
  const rows: [string, string, string, string, string, string, string][] = [
    ["IM", "Ioana, sales", "#FFE9E5", "#9E3321", "Must have", "#FFF3D6", "#8A5A00"],
    ["TR", "Tom, sales", "#EEEAFF", "#5A3BE0", "Must have", "#FFF3D6", "#8A5A00"],
    ["DO", "Dana, finance", "#E1F5EE", "#166A52", "Agree", "#E1F5EE", "#166A52"],
    ["LB", "Lukas, engineering manager", "#FFF3D6", "#8A5A00", "Agree", "#E1F5EE", "#166A52"],
  ];
  return (
    <div className="relative w-full max-w-[540px] rounded-[20px] border border-[#E6E3F0] bg-white p-[22px] text-[#15131F] shadow-[0_12px_32px_rgba(45,32,110,0.10)] lg:rotate-[-1.5deg]" data-testid="live-card">
      <div className="flex items-center justify-between text-xs text-[#5E5A72]">
        <div className="font-mono tracking-[0.02em] whitespace-nowrap">Approving · CL-04</div>
        <div className="flex items-center gap-1.5"><span className="landing-pulse block size-2 rounded-full bg-[#5FD3B3]" aria-hidden="true" />Arriving now</div>
      </div>
      <div className="mt-3.5 text-[20px] leading-7 font-semibold tracking-[-0.015em] md:text-[22px] md:leading-[30px]">Expenses over the policy limit are flagged before they reach the approver.</div>
      <div className="mt-3.5 flex items-center gap-2 text-[13px] text-[#5E5A72]">You proposed <Pill tint="#EEEAFF" text="#5A3BE0">Should have</Pill></div>
      <div className="mt-3.5 flex flex-col border-t border-[#E6E3F0]">
        {rows.map(([initials, name, atint, atext, answer, ptint, ptext]) => (
          <div key={name} className="flex items-center gap-3 border-b border-[#F0EEF7] px-0.5 py-[9px] text-sm last:border-b-0">
            <Avatar initials={initials} tint={atint} text={atext} />
            <span className="flex-grow">{name}</span>
            <Pill tint={ptint} text={ptext}>{answer}</Pill>
          </div>
        ))}
      </div>
      <div className="mt-3.5 flex h-2 gap-1" aria-hidden="true"><div className="grow-[2] rounded-full bg-[#1F9D7A]" /><div className="grow-[2] rounded-full bg-[#F5B740]" /><div className="grow rounded-full bg-[#CFCBE0]" /></div>
      <div className="mt-3.5 flex items-center justify-between gap-3.5 rounded-2xl bg-[linear-gradient(135deg,#262450,#16152A)] px-[18px] py-3.5 text-[#F3F1FA]">
        <div><div className="text-xs font-semibold text-[#5FD3B3]">To do, written by AI</div><div className="mt-0.5 text-[15px]">Decide whether policy flags move to Must have.</div></div>
        <div className="text-xs whitespace-nowrap text-[#A8A4BE]">From 2 answers</div>
      </div>
    </div>
  );
}

// The questions (docs/copy/landing.md, Questions): native details and summary, so they open
// without JavaScript and announce their state (developer.mozilla.org/docs/Web/HTML/Element/details).
const QUESTIONS: [string, string][] = [
  ["Do my experts need an account?", "No. They open the link and answer. There is nothing to install and nothing to sign up for."],
  ["Does it work on a phone?", "Yes. The link is made for a phone first and works the same on a laptop. Answers save as they go, so an expert can stop and pick up where they left off."],
  ["What does the AI do?", "It sorts your list into areas, writes each item in plain words, flags duplicates and vague items, and drafts the to-do list from the answers, naming the answers behind each line. It never answers for your experts. You choose which wording goes out, move items between areas, and dismiss what you do not need."],
  ["Can I see who said what?", "You choose the fields the link asks for, such as name, role or department. Answers carry those fields and nothing more about the person; a personal invite also carries the email you sent it to, and the name and role when you gave them."],
  ["Can the link carry our logo and colour?", "Yes. Your experts see your logo and your colour on the link."],
  ["What happens to my list and the answers?", "They stay in your workspace. Export them as CSV whenever you like. Archive a project when it is done; delete the workspace and the app removes its data within 24 hours."],
  ["How much does it cost?", "It costs nothing while we build it with the first users. Paid plans come later, and nothing you build now is lost or locked."],
];

export default async function LandingPage({ searchParams }: { searchParams: Promise<{ utm_source?: string | string[] }> }) {
  // The source the visitor came with goes on to sign-in (stories/E13-3, acceptance 4).
  const start = signInHref(cleanSource((await searchParams).utm_source));
  return (
    <main className="flex flex-col font-sans text-[#15131F]">
      <PlausibleScript />
      <section className="relative overflow-hidden text-[#F3F1FA]" style={{ background: NAVY }}>
        <div aria-hidden="true" className="pointer-events-none absolute -top-[260px] -left-[200px] size-[900px] rounded-full bg-[radial-gradient(circle,rgba(109,76,245,0.55),rgba(109,76,245,0)_62%)]" />
        <div aria-hidden="true" className="pointer-events-none absolute top-[120px] -right-[160px] size-[760px] rounded-full bg-[radial-gradient(circle,rgba(255,107,87,0.38),rgba(255,107,87,0)_60%)]" />
        <div aria-hidden="true" className="pointer-events-none absolute top-[520px] left-[520px] size-[620px] rounded-full bg-[radial-gradient(circle,rgba(245,183,64,0.22),rgba(245,183,64,0)_60%)]" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:28px_28px]" />
        <CursorLight />
        <div className="relative mx-auto flex h-[76px] w-full max-w-[1200px] items-center justify-between px-5 md:px-8">
          <Link href="/landing-page" className="rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-[#9B86FF]"><Lockup text={18} onInk /></Link>
          <nav aria-label="Page" className="flex items-center gap-5 text-[15px] font-medium text-[#C9C4E0] lg:gap-[30px]">
            <a href="#how" className={navLink}>How it works</a>
            <a href="#outputs" className={navLink}>What you get</a>
            <a href="#compare" className={navLink}>Compare</a>
            <a href="#pricing" className={navLink}>Pricing</a>
            <a href="#questions" className={navLink}>Questions</a>
            <GoalLink goal={GOALS.startFree} href={start} className={buttonVariants({ variant: "primary", className: "h-10 px-[18px] text-sm focus-visible:ring-offset-[#16152A]" })}>Start free</GoalLink>
          </nav>
        </div>
        <div className="relative mx-auto flex w-full max-w-[1200px] flex-col items-start gap-12 px-5 pt-10 pb-16 md:px-8 lg:flex-row lg:items-center lg:justify-between lg:pt-6 lg:pb-14">
          <div className="landing-rise flex w-full max-w-[560px] flex-col items-start">
            <div className="inline-flex h-[30px] items-center gap-2 rounded-full border border-[#46445F] bg-white/[0.04] pr-3 pl-2 text-[13px] text-[#D4D0E4]"><span className="landing-pulse block size-2 rounded-full bg-[#5FD3B3]" aria-hidden="true" />Live: 5 of 7 experts answering right now</div>
            <h1 className="mt-[22px] text-[40px] leading-[44px] font-extrabold tracking-[-0.04em] md:text-[66px] md:leading-[68px]">Send the list as a link. <span className="bg-[linear-gradient(90deg,#B8A8FF_0%,#FF8A78_60%,#FFD36E_100%)] bg-clip-text text-transparent">Get back who agrees, and why.</span></h1>
            <p className="mt-[26px] max-w-[520px] text-[17px] leading-[26px] text-[#C9C4E0] md:text-[19px] md:leading-[30px]">Instead of emailing a spreadsheet around, your experts go through it item by item: agree, push back with a reason, or ask a question. You get a dashboard, a to-do list written by AI, and the CSV.</p>
            <div className="mt-[34px] flex w-full flex-col gap-3.5 sm:w-auto sm:flex-row sm:items-center">
              <GoalLink goal={GOALS.startFree} href={start} className={primary}>Start free<span aria-hidden="true" className="ml-2 transition-transform duration-150 group-hover/button:translate-x-[3px]">→</span></GoalLink>
              <GoalLink goal={GOALS.trySample} href="/sample" className={ghost}>Try the sample as a respondent</GoalLink>
            </div>
            <div className="mt-[26px] flex items-center gap-3.5 text-[13px] text-[#C9C4E0]">
              <div className="flex" aria-hidden="true">
                {["#FF8A78", "#5FD3B3", "#FFD36E", "#9B86FF"].map((c, i) => <span key={c} className="size-[26px] rounded-full border-2" style={{ background: c, borderColor: NAVY, marginLeft: i ? -8 : 0 }} />)}
              </div>
              <span>Your experts need no account and install nothing. It is free while we build it.</span>
            </div>
          </div>
          <div className="landing-rise relative w-full max-w-[600px] pt-6 pb-16 lg:py-10 lg:pl-5 [animation-delay:150ms]">
            <LiveCard />
            <Mascot pose="hi" size={104} className="landing-float absolute right-0 bottom-8 lg:-right-12 lg:-bottom-2" />
            <div className="absolute bottom-2 -left-2 flex items-center gap-3 rounded-[14px] border border-[#343252] bg-[#1E1D33] px-4 py-3 shadow-[0_12px_32px_rgba(0,0,0,0.45)] lg:bottom-1 lg:-left-5" data-testid="agreement-chip">
              <span className="flex size-9 items-center justify-center rounded-[10px] bg-[#2E2B55] font-extrabold text-[#B8A8FF]">63%</span>
              <div className="text-[13px] leading-[18px]"><div className="font-semibold">Agreement so far</div><div className="text-[#A8A4BE]">30 answers from 5 experts</div></div>
            </div>
          </div>
        </div>
      </section>

      <section id="how" className="bg-[#F7F6FB] py-16 md:py-24">
        <div className="mx-auto w-full max-w-[1200px] px-5 md:px-8">
          <Reveal className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <h2 className="max-w-[640px] text-[32px] leading-9 font-extrabold tracking-[-0.035em] md:text-[44px] md:leading-[48px]">Three steps. The AI does the dull one.</h2>
            <p className="max-w-[420px] text-[16px] leading-6 text-[#5E5A72]">Start from the spreadsheet you already have. Let the AI make it readable. Send one link.</p>
          </Reveal>
          <div className="mt-10 grid gap-6 md:mt-12 lg:grid-cols-3">
            <Reveal className="flex flex-col gap-3.5 rounded-[20px] border border-[#E6E3F0] bg-white p-[26px] shadow-[0_12px_32px_rgba(45,32,110,0.10)] transition-[transform,box-shadow] duration-200 hover:-translate-y-[3px] hover:shadow-[0_18px_40px_rgba(45,32,110,0.16)] motion-reduce:hover:translate-y-0">
              <div className="flex items-center gap-2.5"><span className="flex size-7 items-center justify-center rounded-full bg-[#6D4CF5] text-[13px] font-bold text-white">1</span><span className="text-[18px] font-bold">Import the list</span></div>
              <p className="text-[15px] leading-[23px] text-[#5E5A72]">Upload an xlsx or csv file, or paste a list. Columns are matched once and remembered.</p>
              <div className="mt-auto flex h-[120px] items-center justify-center rounded-[14px] border-[1.5px] border-dashed border-[#CFCBE0] bg-white text-sm text-[#5E5A72]"><span className="rounded-full bg-[#EEEAFF] px-3 py-1.5 font-semibold text-[#5A3BE0]">expense-requirements.xlsx</span></div>
            </Reveal>
            <Reveal delay={120} className="flex flex-col gap-3.5 rounded-[20px] border border-[#6D4CF5] bg-white p-[26px] shadow-[0_16px_40px_rgba(109,76,245,0.22)] transition-[transform,box-shadow] duration-200 hover:-translate-y-[3px] motion-reduce:hover:translate-y-0">
              <div className="flex items-center gap-2.5"><span className="flex size-7 items-center justify-center rounded-full bg-[#6D4CF5] text-[13px] font-bold text-white">2</span><span className="text-[18px] font-bold">Shape it</span></div>
              <p className="text-[15px] leading-[23px] text-[#5E5A72]">AI sorts the list into areas and writes each item in plain words. You choose which wording your experts see.</p>
              <div className="mt-auto"><ShapeDemo /></div>
            </Reveal>
            <Reveal delay={240} className="flex flex-col gap-3.5 rounded-[20px] border border-[#E6E3F0] bg-white p-[26px] shadow-[0_12px_32px_rgba(45,32,110,0.10)] transition-[transform,box-shadow] duration-200 hover:-translate-y-[3px] hover:shadow-[0_18px_40px_rgba(45,32,110,0.16)] motion-reduce:hover:translate-y-0">
              <div className="flex items-center gap-2.5"><span className="flex size-7 items-center justify-center rounded-full bg-[#6D4CF5] text-[13px] font-bold text-white">3</span><span className="text-[18px] font-bold">Send one link</span></div>
              <p className="text-[15px] leading-[23px] text-[#5E5A72]">Experts answer without an account or an app. Their answers arrive while they work.</p>
              <div className="mt-auto flex items-center gap-2.5 rounded-[14px] bg-[#15131F] px-3.5 py-3 text-[13px] text-[#F3F1FA]"><span className="min-w-0 truncate font-mono text-[#B8A8FF]">smesay.app/r/7k2…</span><span className="ml-auto rounded-full bg-[#6D4CF5] px-2.5 py-1 font-semibold">Copy</span></div>
            </Reveal>
          </div>
        </div>
      </section>

      <section id="outputs" className="border-t border-[#E6E3F0] bg-white py-16 md:py-24">
        <div className="mx-auto w-full max-w-[1200px] px-5 md:px-8">
          <Reveal className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <h2 className="text-[32px] leading-9 font-extrabold tracking-[-0.035em] md:text-[44px] md:leading-[48px]">What you get back</h2>
            <p className="max-w-[460px] text-[16px] leading-6 text-[#5E5A72]">Instead of a pile of replies, you get a picture of where your experts agree, where they do not and why, and what to decide next.</p>
          </Reveal>
          <div className="mt-8 grid gap-6 md:mt-10 lg:grid-cols-[1.35fr_1fr]">
            <Reveal className="flex flex-col gap-4 rounded-[20px] border border-[#E6E3F0] bg-[#F7F6FB] p-5 md:p-6">
              <div className="flex flex-col gap-1">
                <h3 className="text-xs font-bold text-[#5A3BE0]">See where the list is weak</h3>
                <span className="text-[20px] leading-7 font-bold tracking-[-0.015em]">Every item and every area updates as answers arrive.</span>
                <span className="text-[14px] leading-[21px] text-[#5E5A72]">Pick the numbers you watch, filter by role or by who left a reason, and switch the chart to the view your meeting needs.</span>
              </div>
              <ResultsDemo />
            </Reveal>
            <div className="flex flex-col gap-4">
              <Reveal delay={120} testId="gain-groups" className="flex flex-col gap-2.5 rounded-[20px] border border-[#E6E3F0] bg-white p-[22px] shadow-[0_12px_32px_rgba(45,32,110,0.10)]">
                <h3 className="text-xs font-bold text-[#9E3321]">Know who disagrees, and why</h3>
                <div className="text-[16px] leading-[22px] font-semibold">Sales and everyone else split on the policy flags.</div>
                <div className="flex flex-col gap-1.5 text-[12px] text-[#5E5A72]">
                  <span>Did not agree with Should have</span>
                  <div className="flex items-center gap-2"><span className="w-[96px] shrink-0">Sales</span><div className="h-2 grow rounded-full bg-[#F0EEF7]" aria-hidden="true"><div className="h-2 w-full rounded-full bg-[#FF6B57]" /></div><span className="shrink-0 font-mono whitespace-nowrap">2 of 2</span></div>
                  <div className="flex items-center gap-2"><span className="w-[96px] shrink-0">Everyone else</span><div className="h-2 grow rounded-full bg-[#F0EEF7]" aria-hidden="true"><div className="h-2 w-1/3 rounded-full bg-[#FF6B57]" /></div><span className="shrink-0 font-mono whitespace-nowrap">1 of 3</span></div>
                </div>
                <figure className="flex flex-col gap-1 border-l-2 border-[#FF6B57] pl-3">
                  <blockquote className="text-[14px] leading-[21px] text-[#15131F]">&ldquo;Sales gets most of the rejections, and always after the fact.&rdquo;</blockquote>
                  <figcaption className="text-[13px] text-[#5E5A72]">Tom, sales</figcaption>
                </figure>
              </Reveal>
              <Reveal delay={240} testId="gain-actions" className="flex flex-col gap-2.5 rounded-[20px] bg-[linear-gradient(135deg,#262450,#16152A)] p-[22px] text-[#F3F1FA] shadow-[0_12px_32px_rgba(45,32,110,0.18)]">
                <h3 className="text-xs font-bold text-[#5FD3B3]">Walk into the meeting with the decisions listed</h3>
                <ul className="flex flex-col gap-2 text-[15px] leading-[21px]">
                  <li className="flex flex-col"><span>Decide whether policy flags move to Must have.</span><span className="text-xs text-[#A8A4BE]">To do, written by AI · cites 2 answers</span></li>
                  <li className="flex flex-col"><span>Answer two open questions before the link closes.</span><span className="text-xs text-[#A8A4BE]">To do, written by AI · cites 2 answers</span></li>
                </ul>
              </Reveal>
              <Reveal delay={360} testId="gain-exports" className="flex flex-col gap-2 rounded-[20px] border border-[#E6E3F0] bg-white p-[22px] shadow-[0_12px_32px_rgba(45,32,110,0.10)]">
                <h3 className="text-xs font-bold text-[#166A52]">Numbers that hold up</h3>
                <div className="text-[15px] leading-[22px]">Every number on the dashboard matches the export to the row, so the result stands up in the steering meeting.</div>
                <div className="flex gap-2"><span className="rounded-full border border-[#CFCBE0] bg-white px-3 py-1 text-[13px] font-bold">CSV</span><span className="rounded-full border border-[#CFCBE0] bg-white px-3 py-1 text-[13px] font-bold">PDF summary</span></div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      <section id="compare" className="border-t border-[#E6E3F0] bg-[#F7F6FB] py-16 md:py-24">
        <div className="mx-auto w-full max-w-[1200px] px-5 md:px-8">
          <Reveal className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <h2 className="max-w-[640px] text-[32px] leading-9 font-extrabold tracking-[-0.035em] md:text-[44px] md:leading-[48px]">Why not a spreadsheet, a form or a workshop?</h2>
            <p className="max-w-[460px] text-[16px] leading-6 text-[#5E5A72]">Each of them can collect what your experts think. Pick the one you use today and see what changes.</p>
          </Reveal>
          <Reveal delay={120} className="mt-8 md:mt-10">
            <CompareDemo />
          </Reveal>
          <Reveal delay={240} className="mt-6 max-w-[720px] text-[16px] leading-6 text-[#5E5A72]">
            <p>It does not replace the meeting where you decide. It gives that meeting the answers and the open points to start from.</p>
          </Reveal>
        </div>
      </section>

      <section id="pricing" className="relative overflow-hidden py-16 text-[#F3F1FA] md:py-24" style={{ background: NAVY }}>
        <div aria-hidden="true" className="pointer-events-none absolute -right-[200px] -bottom-[300px] size-[800px] rounded-full bg-[radial-gradient(circle,rgba(109,76,245,0.45),rgba(109,76,245,0)_62%)]" />
        <CursorLight restX={300} restY={160} />
        <div className="relative mx-auto flex w-full max-w-[1200px] flex-col gap-10 px-5 md:px-8 lg:flex-row lg:items-center lg:justify-between">
          <Reveal className="max-w-[560px]">
            <h2 className="text-[32px] leading-9 font-extrabold tracking-[-0.035em] md:text-[44px] md:leading-[48px]">Free while we build it with the first users.</h2>
            <p className="mt-[18px] text-[17px] leading-[26px] text-[#C9C4E0]">Projects and experts are unlimited, and the AI is included. Paid plans come later and nothing you build now is lost or locked.</p>
            <div className="mt-[30px] flex flex-col gap-3.5 sm:flex-row"><GoalLink goal={GOALS.startFree} href={start} className={primary}>Start free</GoalLink><GoalLink goal={GOALS.trySample} href="/sample" className={ghost}>Try the sample as a respondent</GoalLink></div>
          </Reveal>
          <Reveal delay={120} className="flex w-full max-w-[440px] flex-col gap-3.5 rounded-[20px] border border-[#343252] bg-[#1E1D33] p-7 shadow-[0_16px_48px_rgba(0,0,0,0.5)]">
            <div className="flex items-baseline justify-between"><span className="text-[20px] font-bold">Free</span><span className="rounded-full bg-[#2E2B55] px-2.5 py-1 text-xs font-semibold text-[#B8A8FF]">While we build it</span></div>
            <div className="text-[44px] font-extrabold tracking-[-0.03em]">EUR 0<span className="text-[16px] font-medium text-[#A8A4BE]"> / month</span></div>
            <ul className="flex flex-col gap-2 text-[15px] text-[#C9C4E0]">
              {["Projects, experts and answers without limits", "AI shaping and the to-do list", "Live dashboard and CSV export", "Your logo and colour on the link"].map((line) => (
                <li key={line} className="flex gap-2"><span className="font-bold text-[#5FD3B3]" aria-hidden="true">✓</span>{line}</li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      <section id="questions" className="bg-[#F7F6FB] py-16 md:py-24">
        <div className="mx-auto grid w-full max-w-[1200px] gap-8 px-5 md:px-8 lg:grid-cols-[1fr_1.6fr]">
          <Reveal className="flex flex-col gap-4">
            <h2 className="text-[32px] leading-9 font-extrabold tracking-[-0.035em] md:text-[44px] md:leading-[48px]">Questions</h2>
            <p className="max-w-[360px] text-[16px] leading-6 text-[#5E5A72]">Something else on your mind? Write to hello@smesay.app.</p>
          </Reveal>
          <Reveal delay={120} className="flex flex-col divide-y divide-[#E6E3F0] rounded-[20px] border border-[#E6E3F0] bg-white px-5 md:px-6">
            {QUESTIONS.map(([q, a]) => (
              <details key={q} className="group py-4" data-testid="faq-item">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-sm text-[17px] font-semibold outline-hidden focus-visible:ring-2 focus-visible:ring-[#6D4CF5] focus-visible:ring-offset-2 [&::-webkit-details-marker]:hidden">
                  {q}<span aria-hidden="true" className="text-[22px] leading-none font-medium text-[#6D4CF5] transition-transform duration-150 group-open:rotate-45 motion-reduce:transition-none">+</span>
                </summary>
                <p className="mt-2.5 max-w-[620px] text-[15px] leading-[23px] text-[#5E5A72]">{a}</p>
              </details>
            ))}
          </Reveal>
        </div>
      </section>

      <footer className="border-t border-[#343252] px-5 py-8 text-[13px] text-[#A8A4BE] md:px-8" style={{ background: NAVY }}>
        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-2 md:flex-row md:justify-between">
          <span>SMEsay. What the SMEs say. SME: subject matter expert.</span>
          <nav aria-label="Legal" className="flex flex-wrap gap-x-2">
            <Link href="/legal/privacy" className="underline-offset-4 hover:underline">Privacy</Link><span aria-hidden="true">·</span>
            <Link href="/legal/terms" className="underline-offset-4 hover:underline">Terms</Link><span aria-hidden="true">·</span>
            <Link href="/legal/dpa" className="underline-offset-4 hover:underline">DPA</Link><span aria-hidden="true">·</span>
            <Link href="/legal/subprocessors" className="underline-offset-4 hover:underline">Subprocessors</Link><span aria-hidden="true">·</span>
            <span>hello@smesay.app</span>
          </nav>
        </div>
      </footer>
    </main>
  );
}
