// Styleguide: docs/design-system.md rendered with the real components (plan step 2.3).
// Every token here comes from src/lib/tokens.ts and src/app/globals.css. Not linked from the
// product; the address is /styleguide.
import { Lockup, Mark, Wordmark } from "@/components/brand/mark";
import { contrastLabel } from "@/lib/contrast";
import { tokens } from "@/lib/tokens";
import { Demos } from "./demos";

export const metadata = { title: "Styleguide, SMEsay" };

const neutrals: [string, string, string][] = [
  ["white", tokens.white, "page background"],
  ["grey-50", tokens.grey50, "section background, table header, hovered row"],
  ["greige", tokens.greige, "cards holding product fragments"],
  ["hairline", tokens.hairline, "borders, dividers"],
  ["hairline-strong", tokens.hairlineStrong, "input borders, secondary buttons"],
  ["ink-muted", tokens.inkMuted, "secondary text"],
  ["ink-soft", tokens.inkSoft, "body on marketing"],
  ["ink", tokens.ink, "text, primary buttons"],
  ["ink-raised", tokens.inkRaised, "cards on ink"],
];

const teals: [string, string][] = [
  ["50", tokens.teal50], ["100", tokens.teal100], ["200", tokens.teal200], ["300", tokens.teal300], ["400", tokens.teal400],
  ["500", tokens.teal500], ["600", tokens.teal600], ["700", tokens.teal700], ["800", tokens.teal800], ["900", tokens.teal900],
];

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="flex flex-col gap-6 border-t border-hairline py-12 first:border-t-0">
      <h2 className="text-[32px] font-medium leading-9 tracking-[-0.03em]">{title}</h2>
      {children}
    </section>
  );
}

function Swatch({ name, hex, use, dark }: { name: string; hex: string; use?: string; dark?: boolean }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="h-16 rounded-lg border border-hairline" style={{ background: hex }} />
      <div className="text-[13px]">
        <div className="font-medium">{name}</div>
        <div className="font-mono text-xs text-ink-muted">{hex}{dark ? "" : ""}</div>
        {use ? <div className="text-ink-muted">{use}</div> : null}
      </div>
    </div>
  );
}

export default function Styleguide() {
  return (
    <main className="mx-auto max-w-[1120px] px-4 pb-24 md:px-8">
      <header className="flex flex-col gap-3 py-12">
        <div className="text-[13px] text-ink-muted">docs/design-system.md, rendered with the components the app uses</div>
        <h1 className="text-[40px] font-medium leading-11 tracking-[-0.035em]">Styleguide</h1>
        <nav aria-label="Sections" className="flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
          {["identity", "colour", "type", "space", "components", "data"].map((s) => (
            <a key={s} href={"#" + s} className="text-teal-700 underline-offset-4 hover:underline">{s[0].toUpperCase() + s.slice(1)}</a>
          ))}
        </nav>
      </header>

      <Section id="identity" title="Identity">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="flex flex-col gap-3 rounded-[20px] border border-hairline p-6">
            <Lockup text={24} />
            <div className="text-[13px] text-ink-muted">Horizontal lockup on white: mark teal, ME teal 700.</div>
          </div>
          <div className="flex flex-col gap-3 rounded-[20px] bg-ink p-6">
            <Lockup text={24} onInk />
            <div className="text-[13px] text-[#A3A7AE]">On ink: mark white, ME teal 300.</div>
          </div>
          <div className="flex flex-col gap-3 rounded-[20px] bg-greige p-6">
            <div className="flex items-end gap-4">
              <Mark size={64} />
              <Mark size={32} />
              <Mark size={20} />
            </div>
            <div className="text-[13px] text-ink-muted">Mark alone at 64, 32 and the 20 px minimum.</div>
          </div>
        </div>
        <div className="flex flex-wrap items-baseline gap-6">
          <Wordmark className="text-[64px] leading-none" />
          <Wordmark className="text-[32px] leading-none" />
          <Wordmark className="text-[16px] leading-none" />
        </div>
        <p className="max-w-[720px] text-ink-soft">
          One tagline: What the SMEs say. The footer expands SME once: subject matter expert. Not allowed: rotation,
          gradients, other colours, outlines, stretching, ME not in teal.
        </p>
      </Section>

      <Section id="colour" title="Colour">
        <h3 className="text-xl font-medium tracking-[-0.02em]">Neutrals</h3>
        <div className="grid grid-cols-3 gap-4 md:grid-cols-5 lg:grid-cols-9">
          {neutrals.map(([n, h, u]) => <Swatch key={n} name={n} hex={h} use={u} />)}
        </div>
        <h3 className="text-xl font-medium tracking-[-0.02em]">Teal, the one accent</h3>
        <div className="grid grid-cols-5 gap-2 md:grid-cols-10">
          {teals.map(([n, h]) => (
            <div key={n} className="flex flex-col gap-1">
              <div className="h-12 rounded-lg" style={{ background: h }} />
              <div className="font-mono text-xs text-ink-muted">{n}</div>
            </div>
          ))}
        </div>
        <p className="max-w-[720px] text-ink-soft">
          Teal 700 is the brand: links, focus rings, the mark, the ME. Teal 300 replaces it on ink. Primary buttons are
          ink. Teal is never used for data.
        </p>
        <h3 className="text-xl font-medium tracking-[-0.02em]">Status colours</h3>
        <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-[13px]">
          <thead>
            <tr className="h-8 bg-grey-50 text-left text-xs text-ink-muted">
              <th className="px-3 font-normal">Status</th>
              <th className="px-3 font-normal">Pill</th>
              <th className="px-3 font-normal">Solid</th>
              <th className="px-3 font-normal">Tint</th>
              <th className="px-3 font-normal">Text on tint</th>
              <th className="px-3 font-normal">Ratio</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(tokens.status).map(([k, s]) => (
              <tr key={k} className="h-9 border-b border-hairline">
                <td className="px-3">{s.label}</td>
                <td className="px-3">
                  <span className="inline-flex h-5 items-center rounded-full px-2.5 text-xs font-medium" style={{ background: s.tint, color: s.text }}>{s.label}</span>
                </td>
                <td className="px-3"><span className="mr-2 inline-block size-3 rounded-full align-middle" style={{ background: s.solid }} /><span className="font-mono text-xs">{s.solid}</span></td>
                <td className="px-3 font-mono text-xs">{s.tint}</td>
                <td className="px-3 font-mono text-xs">{s.text}</td>
                <td className="px-3 font-mono text-xs">{contrastLabel(s.text, s.tint)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        <div className="grid gap-2 text-[13px] text-ink-soft md:grid-cols-2">
          <div>Ink on white {contrastLabel(tokens.ink, tokens.white)}. Ink-muted on white {contrastLabel(tokens.inkMuted, tokens.white)}, on greige {contrastLabel(tokens.inkMuted, tokens.greige)}.</div>
          <div>Teal 700 on white {contrastLabel(tokens.teal700, tokens.white)}, on greige {contrastLabel(tokens.teal700, tokens.greige)}. Teal 300 on ink {contrastLabel(tokens.teal300, tokens.ink)}. Teal 700 on ink fails at {contrastLabel(tokens.teal700, tokens.ink)}.</div>
        </div>
      </Section>

      <Section id="type" title="Type">
        <p className="max-w-[720px] text-ink-soft">
          Geist Sans and Geist Mono, weights 400, 500, 600 (600 only in the wordmark). Bases: PM app 14, respondent 17,
          marketing 17 and 20. Mono for references, counts, timestamps and numerals, with tabular figures.
        </p>
        <div className="flex flex-col divide-y divide-hairline">
          {tokens.type.map((t) => (
            <div key={t.size} className="grid items-baseline gap-4 py-3 md:grid-cols-[120px_1fr_280px]">
              <div className="font-mono text-xs text-ink-muted">{t.size}/{t.line} {t.tracking} {t.weight}</div>
              <div style={{ fontSize: t.size, lineHeight: t.line + "px", letterSpacing: t.tracking, fontWeight: t.weight }}>
                Send the list as a link.
              </div>
              <div className="text-[13px] text-ink-muted">{t.use}</div>
            </div>
          ))}
        </div>
        <div className="font-mono text-sm">CL-04 · 5 of 7 · 67% · 7 Oct 2026, 14:05 UTC</div>
      </Section>

      <Section id="space" title="Space, shape, layout">
        <div className="flex flex-wrap items-end gap-3">
          {tokens.space.map((s) => (
            <div key={s} className="flex flex-col items-center gap-1">
              <div className="bg-teal-100" style={{ width: s, height: s }} />
              <div className="font-mono text-xs text-ink-muted">{s}</div>
            </div>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {Object.entries(tokens.radius).map(([k, r]) => (
            <div key={k} className="flex flex-col gap-2">
              <div className="h-16 border border-hairline-strong" style={{ borderRadius: r }} />
              <div className="text-[13px]"><span className="font-medium">{k}</span> <span className="font-mono text-xs text-ink-muted">{r}</span></div>
            </div>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[20px] bg-greige p-6">
            <div className="rounded-xl bg-white p-4 shadow-card text-[13px]">The one shadow: product fragments on greige, menus, dialogs, toasts.</div>
          </div>
          <div className="rounded-xl border-[1.5px] border-ink p-4 text-[13px]">Ink 1.5 px on the one highlighted object on a screen. No left-edge-only borders.</div>
        </div>
      </Section>

      <Section id="components" title="Components">
        <Demos />
      </Section>

      <Section id="data" title="Data">
        <p className="max-w-[720px] text-ink-soft">
          Thin marks, 2 px gaps between segments, direct labels, text in ink tokens never in series colour, never a pie,
          never two y-axes. Agreement per item: agree, pushed back, unclear; the percent is agree over answered.
        </p>
        <div className="flex max-w-[560px] flex-col gap-3">
          {[
            ["Receipt photos", 60, 20, 20, "60%"],
            ["Split receipts", 40, 40, 20, "40%"],
            ["Policy flags", 40, 60, 0, "40%"],
          ].map(([name, a, p, u, pct]) => (
            <div key={name as string} className="grid grid-cols-[160px_1fr_48px] items-center gap-3 text-[13px]">
              <div>{name}</div>
              <div className="flex h-2.5 gap-[2px] overflow-hidden rounded-full bg-grey-50">
                <div className="bg-agree" style={{ width: a + "%" }} />
                <div className="bg-pushed" style={{ width: p + "%" }} />
                <div className="bg-unclear" style={{ width: u + "%" }} />
              </div>
              <div className="text-right font-mono text-xs">{pct}</div>
            </div>
          ))}
          <div className="flex gap-4 text-xs text-ink-muted">
            <span><span className="mr-1.5 inline-block size-2.5 rounded-sm bg-agree align-middle" />Agree</span>
            <span><span className="mr-1.5 inline-block size-2.5 rounded-sm bg-pushed align-middle" />Pushed back</span>
            <span><span className="mr-1.5 inline-block size-2.5 rounded-sm bg-unclear align-middle" />Unclear</span>
          </div>
        </div>
      </Section>
    </main>
  );
}
