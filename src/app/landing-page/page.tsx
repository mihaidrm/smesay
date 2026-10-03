// The landing page, design v2 (stories/E12-1 as amended on 2026-10-03; the LandingF board,
// docs/design-notes/prototype-01/LandingF.dc.html; copy from docs/copy/landing.md). Served at
// /landing-page until Mihai moves it to /: a dark hero with the aurora, the dot grid and the
// cursor light, the live card tilted with the mascot's placeholder at its corner, light
// "three steps" and "what you get back" sections, dark pricing and footer. Desktop 1440 and
// phone 390 in one pass (decision 0015): one column under 1024 px, the card upright and full
// width, the type one step smaller. The landing keeps its own light and dark sections
// whatever the app's mode (decision 0041, point 2), so its colours are written out, not read
// from the mode tokens. The product fragments are the Marlow example as static markup until
// the respondent and dashboard components exist (E5, E6); they are swapped for the real
// components then (acceptance 4, amended). The page describes the R1 product as planned, not
// only what is built today (decision 0042: the copy rule is for the live product; the planned
// lines are checked at the launch gate, docs/copy/landing.md).
// Small text on the dark hero is #C9C4E0 or lighter so it keeps 4.5 over the aurora and the
// cursor light; the two card labels on light use the text colours of their hues.
import type { Metadata } from "next";
import Link from "next/link";
import { MascotPlaceholder } from "@/components/app/mascot";
import { Lockup } from "@/components/brand/mark";
import { buttonVariants } from "@/components/ui/button";
import { CursorLight } from "./cursor-light";
import { Reveal } from "./reveal";

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
    ["AP", "Ana, finance", "#FFE9E5", "#9E3321", "Must have", "#FFF3D6", "#8A5A00"],
    ["DM", "Dan, sales", "#E1F5EE", "#166A52", "Agree", "#E1F5EE", "#166A52"],
    ["RS", "Radu, operations", "#EEEAFF", "#5A3BE0", "Must have", "#FFF3D6", "#8A5A00"],
    ["IC", "Ioana, HR", "#E1F5EE", "#166A52", "Agree", "#E1F5EE", "#166A52"],
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

export default function LandingPage() {
  return (
    <main className="flex flex-col font-sans text-[#15131F]">
      <section className="relative overflow-hidden text-[#F3F1FA]" style={{ background: NAVY }}>
        <div aria-hidden="true" className="pointer-events-none absolute -top-[260px] -left-[200px] size-[900px] rounded-full bg-[radial-gradient(circle,rgba(109,76,245,0.55),rgba(109,76,245,0)_62%)]" />
        <div aria-hidden="true" className="pointer-events-none absolute top-[120px] -right-[160px] size-[760px] rounded-full bg-[radial-gradient(circle,rgba(255,107,87,0.38),rgba(255,107,87,0)_60%)]" />
        <div aria-hidden="true" className="pointer-events-none absolute top-[520px] left-[520px] size-[620px] rounded-full bg-[radial-gradient(circle,rgba(245,183,64,0.22),rgba(245,183,64,0)_60%)]" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:28px_28px]" />
        <CursorLight />
        <div className="relative mx-auto flex h-[76px] w-full max-w-[1200px] items-center justify-between px-5 md:px-8">
          <Link href="/landing-page" className="rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-[#9B86FF]"><Lockup text={18} onInk /></Link>
          <nav aria-label="Page" className="flex items-center gap-5 text-[15px] font-medium text-[#C9C4E0] md:gap-[30px]">
            <a href="#how" className={navLink}>How it works</a>
            <a href="#outputs" className={navLink}>What you get</a>
            <a href="#pricing" className={navLink}>Pricing</a>
            <Link href="/sign-in" className={buttonVariants({ variant: "primary", className: "h-10 px-[18px] text-sm focus-visible:ring-offset-[#16152A]" })}>Start free</Link>
          </nav>
        </div>
        <div className="relative mx-auto flex w-full max-w-[1200px] flex-col items-start gap-12 px-5 pt-10 pb-16 md:px-8 lg:flex-row lg:items-center lg:justify-between lg:pt-6 lg:pb-14">
          <div className="landing-rise flex w-full max-w-[560px] flex-col items-start">
            <div className="inline-flex h-[30px] items-center gap-2 rounded-full border border-[#46445F] bg-white/[0.04] pr-3 pl-2 text-[13px] text-[#D4D0E4]"><span className="landing-pulse block size-2 rounded-full bg-[#5FD3B3]" aria-hidden="true" />Live: 5 of 7 experts answering right now</div>
            <h1 className="mt-[22px] text-[40px] leading-[44px] font-extrabold tracking-[-0.04em] md:text-[66px] md:leading-[68px]">Send the list as a link. <span className="bg-[linear-gradient(90deg,#B8A8FF_0%,#FF8A78_60%,#FFD36E_100%)] bg-clip-text text-transparent">Get back who agrees, and why.</span></h1>
            <p className="mt-[26px] max-w-[520px] text-[17px] leading-[26px] text-[#C9C4E0] md:text-[19px] md:leading-[30px]">Instead of emailing a spreadsheet around, your experts go through it item by item: agree, push back with a reason, or ask a question. You get a dashboard, a to-do list written by AI, and the CSV.</p>
            <div className="mt-[34px] flex w-full flex-col gap-3.5 sm:w-auto sm:flex-row sm:items-center">
              <Link href="/sign-in" className={primary}>Start free<span aria-hidden="true" className="ml-2 transition-transform duration-150 group-hover/button:translate-x-[3px]">→</span></Link>
              <Link href="/app" className={ghost}>See the sample</Link>
            </div>
            <div className="mt-[26px] flex items-center gap-3.5 text-[13px] text-[#C9C4E0]">
              <div className="flex" aria-hidden="true">
                {["#FF8A78", "#5FD3B3", "#FFD36E", "#9B86FF"].map((c, i) => <span key={c} className="size-[26px] rounded-full border-2" style={{ background: c, borderColor: NAVY, marginLeft: i ? -8 : 0 }} />)}
              </div>
              <span>No account for the experts. Nothing to install. Free while we build it.</span>
            </div>
          </div>
          <div className="landing-rise relative w-full max-w-[600px] pt-6 pb-16 lg:py-10 lg:pl-5 [animation-delay:150ms]">
            <LiveCard />
            <MascotPlaceholder size={88} className="landing-float absolute right-0 bottom-9 lg:-right-10 lg:-bottom-1" />
            <div className="absolute bottom-2 -left-2 flex items-center gap-3 rounded-[14px] border border-[#343252] bg-[#1E1D33] px-4 py-3 shadow-[0_12px_32px_rgba(0,0,0,0.45)] lg:bottom-1 lg:-left-5" data-testid="agreement-chip">
              <span className="flex size-9 items-center justify-center rounded-[10px] bg-[#2E2B55] font-extrabold text-[#B8A8FF]">72%</span>
              <div className="text-[13px] leading-[18px]"><div className="font-semibold">Agreement so far</div><div className="text-[#A8A4BE]">14 of 40 items rated</div></div>
            </div>
          </div>
        </div>
      </section>

      <section id="how" className="bg-[#F7F6FB] py-16 md:py-24">
        <div className="mx-auto w-full max-w-[1200px] px-5 md:px-8">
          <Reveal className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <h2 className="max-w-[640px] text-[32px] leading-9 font-extrabold tracking-[-0.035em] md:text-[44px] md:leading-[48px]">Three steps. The AI does the dull one.</h2>
            <p className="max-w-[420px] text-[16px] leading-6 text-[#5E5A72]">Upload the spreadsheet you already have. Shaping groups it into areas and writes each item in plain words. Send one link.</p>
          </Reveal>
          <div className="mt-10 grid gap-6 md:mt-12 md:grid-cols-3">
            <Reveal className="flex flex-col gap-3.5 rounded-[20px] border border-[#E6E3F0] bg-white p-[26px] shadow-[0_12px_32px_rgba(45,32,110,0.10)] transition-[transform,box-shadow] duration-200 hover:-translate-y-[3px] hover:shadow-[0_18px_40px_rgba(45,32,110,0.16)] motion-reduce:hover:translate-y-0">
              <div className="flex items-center gap-2.5"><span className="flex size-7 items-center justify-center rounded-full bg-[#6D4CF5] text-[13px] font-bold text-white">1</span><span className="text-[18px] font-bold">Import the list</span></div>
              <p className="text-[15px] leading-[23px] text-[#5E5A72]">xlsx, csv or a pasted list. Columns are matched once and remembered.</p>
              <div className="mt-auto flex h-[120px] items-center justify-center rounded-[14px] border-[1.5px] border-dashed border-[#CFCBE0] bg-white text-sm text-[#5E5A72]"><span className="rounded-full bg-[#EEEAFF] px-3 py-1.5 font-semibold text-[#5A3BE0]">expense-requirements.xlsx</span></div>
            </Reveal>
            <Reveal delay={120} className="flex flex-col gap-3.5 rounded-[20px] border border-[#6D4CF5] bg-white p-[26px] shadow-[0_16px_40px_rgba(109,76,245,0.22)] transition-[transform,box-shadow] duration-200 hover:-translate-y-[3px] motion-reduce:hover:translate-y-0">
              <div className="flex items-center gap-2.5"><span className="flex size-7 items-center justify-center rounded-full bg-[#6D4CF5] text-[13px] font-bold text-white">2</span><span className="text-[18px] font-bold">Shape it</span></div>
              <p className="text-[15px] leading-[23px] text-[#5E5A72]">AI groups items into areas, writes a reader version of each, and flags duplicates and vague ones. You keep or change every line.</p>
              <div className="mt-auto flex flex-col gap-1.5 text-[13px]">
                <div className="flex items-center gap-2"><span className="font-mono whitespace-nowrap text-[#5E5A72]">CL-01</span><span className="min-w-0 flex-grow">Photograph a receipt and the amount fills in.</span><Pill tint="#EEEAFF" text="#5A3BE0">Submitting</Pill></div>
                <div className="flex items-center gap-2"><span className="font-mono whitespace-nowrap text-[#5E5A72]">CL-07</span><span className="min-w-0 flex-grow">Per diem rates apply by country.</span><Pill tint="#FFF3D6" text="#8A5A00">Ambiguity</Pill></div>
                <div className="flex items-center gap-2"><span className="font-mono whitespace-nowrap text-[#5E5A72]">CL-09</span><span className="min-w-0 flex-grow">Mileage is paid at the state rate.</span><Pill tint="#FFE9E5" text="#9E3321">Duplicate of CL-02</Pill></div>
              </div>
            </Reveal>
            <Reveal delay={240} className="flex flex-col gap-3.5 rounded-[20px] border border-[#E6E3F0] bg-white p-[26px] shadow-[0_12px_32px_rgba(45,32,110,0.10)] transition-[transform,box-shadow] duration-200 hover:-translate-y-[3px] hover:shadow-[0_18px_40px_rgba(45,32,110,0.16)] motion-reduce:hover:translate-y-0">
              <div className="flex items-center gap-2.5"><span className="flex size-7 items-center justify-center rounded-full bg-[#6D4CF5] text-[13px] font-bold text-white">3</span><span className="text-[18px] font-bold">Send one link</span></div>
              <p className="text-[15px] leading-[23px] text-[#5E5A72]">Experts open it on a phone, no account. Answers arrive live; the dashboard, the to-do list and the CSV are yours.</p>
              <div className="mt-auto flex items-center gap-2.5 rounded-[14px] bg-[#15131F] px-3.5 py-3 text-[13px] text-[#F3F1FA]"><span className="min-w-0 truncate font-mono text-[#B8A8FF]">smesay.app/r/7k2…</span><span className="ml-auto rounded-full bg-[#6D4CF5] px-2.5 py-1 font-semibold">Copy</span></div>
            </Reveal>
          </div>
        </div>
      </section>

      <section id="outputs" className="border-t border-[#E6E3F0] bg-white py-16 md:py-24">
        <div className="mx-auto w-full max-w-[1200px] px-5 md:px-8">
          <Reveal><h2 className="text-[32px] leading-9 font-extrabold tracking-[-0.035em] md:text-[44px] md:leading-[48px]">What you get back</h2></Reveal>
          <div className="mt-8 grid gap-6 md:mt-10 lg:grid-cols-[1.3fr_1fr]">
            <Reveal className="flex flex-col gap-4 rounded-[20px] border border-[#E6E3F0] bg-[#F7F6FB] p-6">
              <div className="flex items-center justify-between gap-3"><span className="text-[18px] font-bold">Agreement by area</span><span className="text-[13px] text-[#5E5A72]">Live · 31 of 40 answered</span></div>
              <div className="flex flex-col gap-3 text-sm">
                {([["Submitting", "81%", 8.1, 1.2, 0.7], ["Approving", "64%", 6.4, 2.6, 1], ["Paying", "92%", 9.2, 0.8, 0]] as [string, string, number, number, number][]).map(([area, pct, a, p, u]) => (
                  <div key={area}>
                    <div className="flex justify-between"><span>{area}</span><span className="font-mono">{pct}</span></div>
                    <div className="mt-1.5 flex h-2.5 gap-[3px]" aria-hidden="true">
                      <div className="rounded-full bg-[#1F9D7A]" style={{ flexGrow: a }} />
                      <div className="rounded-full bg-[#F5B740]" style={{ flexGrow: p }} />
                      {u > 0 && <div className="rounded-full bg-[#7C3AED]" style={{ flexGrow: u }} />}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-3.5 text-xs text-[#5E5A72]">
                <span><span className="mr-1 inline-block size-2.5 rounded-[3px] bg-[#1F9D7A] align-[-1px]" aria-hidden="true" />Agree</span>
                <span><span className="mr-1 inline-block size-2.5 rounded-[3px] bg-[#F5B740] align-[-1px]" aria-hidden="true" />Pushed back</span>
                <span><span className="mr-1 inline-block size-2.5 rounded-[3px] bg-[#7C3AED] align-[-1px]" aria-hidden="true" />Unclear</span>
              </div>
            </Reveal>
            <div className="flex flex-col gap-4">
              <Reveal delay={120} className="flex flex-col gap-2.5 rounded-[20px] border border-[#E6E3F0] bg-white p-[22px] shadow-[0_12px_32px_rgba(45,32,110,0.10)]"><div className="text-xs font-bold text-[#166A52]">To do, written by AI</div><div className="text-[16px] leading-[22px] font-semibold">Decide whether policy flags move to Must have.</div><div className="text-[13px] text-[#5E5A72]">Cites 2 answers · Ana, Radu</div></Reveal>
              <Reveal delay={240} className="flex flex-col gap-2.5 rounded-[20px] border border-[#E6E3F0] bg-white p-[22px] shadow-[0_12px_32px_rgba(45,32,110,0.10)]"><div className="text-xs font-bold text-[#9E3321]">Where groups disagree</div><div className="text-[16px] leading-[22px] font-semibold">Finance and sales split on cash advances.</div><div className="mt-1 flex h-2 gap-1.5" aria-hidden="true"><div className="w-[80%] rounded-full bg-[#6D4CF5]" /><div className="w-[35%] rounded-full bg-[#B8A8FF]" /></div></Reveal>
              <Reveal delay={360} className="flex items-center justify-between gap-3 rounded-[20px] border border-[#E6E3F0] bg-white px-[22px] py-[18px] shadow-[0_12px_32px_rgba(45,32,110,0.10)]"><span className="text-[15px] font-semibold">Every number to the row</span><span className="rounded-full border border-[#CFCBE0] bg-white px-3.5 py-1.5 text-[13px] font-bold text-[#15131F]">Export CSV</span></Reveal>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="relative overflow-hidden py-16 text-[#F3F1FA] md:py-24" style={{ background: NAVY }}>
        <div aria-hidden="true" className="pointer-events-none absolute -right-[200px] -bottom-[300px] size-[800px] rounded-full bg-[radial-gradient(circle,rgba(109,76,245,0.45),rgba(109,76,245,0)_62%)]" />
        <CursorLight restX={300} restY={160} />
        <div className="relative mx-auto flex w-full max-w-[1200px] flex-col gap-10 px-5 md:px-8 lg:flex-row lg:items-center lg:justify-between">
          <Reveal className="max-w-[560px]">
            <h2 className="text-[32px] leading-9 font-extrabold tracking-[-0.035em] md:text-[44px] md:leading-[48px]">Free while we build it with the first users.</h2>
            <p className="mt-[18px] text-[17px] leading-[26px] text-[#C9C4E0]">Unlimited projects, unlimited experts, the AI included. Paid plans come later and nothing you build now is lost or locked.</p>
            <div className="mt-[30px] flex flex-col gap-3.5 sm:flex-row"><Link href="/sign-in" className={primary}>Start free</Link><Link href="/app" className={ghost}>See the sample</Link></div>
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

      <footer className="border-t border-[#343252] px-5 py-8 text-[13px] text-[#A8A4BE] md:px-8" style={{ background: NAVY }}>
        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-2 md:flex-row md:justify-between">
          <span>SMEsay. What the SMEs say. SME: subject matter expert.</span>
          <span>Privacy · Terms · hello@smesay.app</span>
        </div>
      </footer>
    </main>
  );
}
