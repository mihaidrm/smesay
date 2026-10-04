// Styleguide: docs/design-system.md (version 2, decision 0041) rendered with the real
// components. Every token here comes from src/lib/tokens.ts and src/app/globals.css. Not
// linked from the product; the address is /styleguide. Flip the mode with the toggle at the
// top: every swatch below reads the same token in both modes.
import { ModeToggle } from "@/components/app/mode-toggle";
import { Lockup, Mark, Wordmark } from "@/components/brand/mark";
import { contrastLabel } from "@/lib/contrast";
import { tokens } from "@/lib/tokens";
import { Demos } from "./demos";

export const metadata = { title: "Styleguide, SMEsay" };

type Key = keyof typeof tokens.light;
const neutrals: [Key, string, string][] = [
  ["ground", "ground", "page background"],
  ["surface", "surface", "cards, the sidebar, inputs"],
  ["raised", "raised", "rows inside a card (dark only; white on light)"],
  ["tint", "tint", "table header, hovered row, the segmented track"],
  ["hairline", "hairline", "borders, dividers"],
  ["hairlineStrong", "hairline-strong", "input borders, secondary buttons"],
  ["inkMuted", "ink-muted", "secondary text"],
  ["inkSoft", "ink-soft", "body on marketing, neutral pills"],
  ["ink", "ink", "text"],
];
const colours: [Key, Key, Key, string, string][] = [
  ["violet", "violetText", "violetSoft", "violet", "the brand: links, the selected state, the primary button, the mark"],
  ["coral", "coralText", "coralSoft", "coral", "counts, the disagreement view, what needs attention"],
  ["mint", "mintText", "mintSoft", "mint", "saved, agreed, a done step"],
  ["sun", "sunText", "sunSoft", "sun", "pushed back, the ambiguity dot"],
];

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="flex flex-col gap-6 border-t border-hairline py-12 first:border-t-0">
      <h2 className="text-[32px] font-extrabold leading-9 tracking-[-0.03em]">{title}</h2>
      {children}
    </section>
  );
}

function Swatch({ name, light, dark, use }: { name: string; light: string; dark: string; use?: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-16 overflow-hidden rounded-xl border border-hairline">
        <div className="flex-1" style={{ background: light }} />
        <div className="flex-1" style={{ background: dark }} />
      </div>
      <div className="text-[13px]">
        <div className="font-semibold">{name}</div>
        <div className="font-mono text-xs text-ink-muted">{light} · {dark}</div>
        {use ? <div className="text-ink-muted">{use}</div> : null}
      </div>
    </div>
  );
}

export default function Styleguide() {
  const L = tokens.light;
  const D = tokens.dark;
  return (
    <main className="mx-auto max-w-[1120px] px-4 pb-24 md:px-8">
      <header className="flex flex-col gap-3 py-12">
        <div className="flex items-center justify-between gap-4">
          <div className="text-[13px] text-ink-muted">docs/design-system.md, rendered with the components the app uses</div>
          <ModeToggle />
        </div>
        <h1 className="text-[40px] font-extrabold leading-11 tracking-[-0.035em]">Styleguide</h1>
        <nav aria-label="Sections" className="flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
          {["identity", "colour", "type", "space", "components", "data"].map((s) => (
            <a key={s} href={"#" + s} className="text-violet-text underline-offset-4 hover:underline">{s[0].toUpperCase() + s.slice(1)}</a>
          ))}
        </nav>
      </header>

      <Section id="identity" title="Identity">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="card flex flex-col gap-3 rounded-[20px] p-6">
            <Lockup text={24} />
            <div className="text-[13px] text-ink-muted">Horizontal lockup: mark violet, ME in violet text (violet 300 on dark).</div>
          </div>
          <div className="flex flex-col gap-3 rounded-[20px] bg-[#16152A] p-6">
            <Lockup text={24} onInk />
            <div className="text-[13px] text-[#A8A4BE]">On the marketing navy: ink light, ME violet 300.</div>
          </div>
          <div className="flex flex-col gap-3 rounded-[20px] bg-tint p-6">
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
          other colours, outlines, stretching, ME not in violet. The one gradient on the mark is none: the mark is flat.
        </p>
      </Section>

      <Section id="colour" title="Colour">
        <p className="max-w-[720px] text-ink-soft">Each swatch shows the light value on the left and the dark value on the right. The app reads one token name in both modes.</p>
        <h3 className="text-xl font-bold tracking-[-0.02em]">Neutrals</h3>
        <div className="grid grid-cols-3 gap-4 md:grid-cols-5 lg:grid-cols-9">
          {neutrals.map(([k, n, u]) => <Swatch key={k} name={n} light={L[k]} dark={D[k]} use={u} />)}
        </div>
        <h3 className="text-xl font-bold tracking-[-0.02em]">Violet, coral, mint, sun</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {colours.map(([solid, text, soft, name, use]) => (
            <div key={name} className="flex flex-col gap-2">
              <div className="flex h-16 overflow-hidden rounded-xl border border-hairline">
                <div className="flex-1" style={{ background: L[solid] }} />
                <div className="flex flex-1 items-center justify-center text-xs font-bold" style={{ background: L[soft], color: L[text] }}>text</div>
                <div className="flex-1" style={{ background: D[solid] }} />
                <div className="flex flex-1 items-center justify-center text-xs font-bold" style={{ background: D[soft], color: D[text] }}>text</div>
              </div>
              <div className="text-[13px]"><div className="font-semibold">{name}</div><div className="font-mono text-xs text-ink-muted">{L[solid]} · {L[text]} · {L[soft]}</div><div className="font-mono text-xs text-ink-muted">{D[solid]} · {D[text]} · {D[soft]}</div><div className="text-ink-muted">{use}</div></div>
            </div>
          ))}
        </div>
        <p className="max-w-[720px] text-ink-soft">
          Violet is the brand: links, focus rings, the mark, the ME, the selected state, the primary button (the one
          gradient inside the app). Coral, mint and sun are decorative at their solid value and read as text through their
          text value. None of the four is used for data.
        </p>
        <h3 className="text-xl font-bold tracking-[-0.02em]">Status colours</h3>
        <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-[13px]">
          <thead>
            <tr className="h-9 text-left text-xs font-semibold text-ink-muted">
              <th className="px-3">Status</th>
              <th className="px-3">Pill</th>
              <th className="px-3">Solid</th>
              <th className="px-3">Tint, text, ratio (light)</th>
              <th className="px-3">Solid, tint, ratio (dark)</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(tokens.status).map(([k, s]) => (
              <tr key={k} className="h-10 border-t border-hairline">
                <td className="px-3">{s.label}</td>
                <td className="px-3">
                  <span className="inline-flex h-6 items-center rounded-full px-2.5 text-xs font-semibold" style={{ background: s.tint, color: s.text }}>{s.label}</span>
                  <span className="ml-2 inline-flex h-6 items-center rounded-full px-2.5 text-xs font-semibold" style={{ background: s.dark.tint, color: s.dark.text }}>{s.label}</span>
                </td>
                <td className="px-3"><span className="mr-2 inline-block size-3 rounded-full align-middle" style={{ background: s.solid }} /><span className="font-mono text-xs">{s.solid}</span></td>
                <td className="px-3 font-mono text-xs">{s.tint} {s.text} {contrastLabel(s.text, s.tint)}</td>
                <td className="px-3 font-mono text-xs">{s.dark.solid} {s.dark.tint} {contrastLabel(s.dark.text, s.dark.tint)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        <div className="grid gap-2 text-[13px] text-ink-soft md:grid-cols-2">
          <div>Light: ink on ground {contrastLabel(L.ink, L.ground)}, muted on surface {contrastLabel(L.inkMuted, L.surface)}, violet on surface {contrastLabel(L.violet, L.surface)}, violet text on surface {contrastLabel(L.violetText, L.surface)}, white on violet {contrastLabel("#FFFFFF", L.violet)}.</div>
          <div>Dark: ink on ground {contrastLabel(D.ink, D.ground)}, muted on surface {contrastLabel(D.inkMuted, D.surface)}, violet on surface {contrastLabel(D.violet, D.surface)}, violet text on surface {contrastLabel(D.violetText, D.surface)}, coral on surface {contrastLabel(D.coral, D.surface)}.</div>
        </div>
      </Section>

      <Section id="type" title="Type">
        <p className="max-w-[720px] text-ink-soft">
          Plus Jakarta Sans 400 to 800 for everything but numbers; headings at 700 and 800 with tight tracking. Geist Mono
          for references, counts, timestamps and numerals, with tabular figures. Bases: PM app 15, respondent 17, marketing
          17 and 20.
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
              <div className="bg-violet-soft" style={{ width: s, height: s }} />
              <div className="font-mono text-xs text-ink-muted">{s}</div>
            </div>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {Object.entries(tokens.radius).map(([k, r]) => (
            <div key={k} className="flex flex-col gap-2">
              <div className="h-16 border border-hairline-strong" style={{ borderRadius: r }} />
              <div className="text-[13px]"><span className="font-semibold">{k}</span> <span className="font-mono text-xs text-ink-muted">{r}</span></div>
            </div>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[20px] bg-tint p-6">
            <div className="card p-4 text-[13px]">The card: a surface on the ground with one soft shadow per mode. Rows inside a card sit on the raised surface.</div>
          </div>
          <div className="rounded-2xl border-[1.5px] border-violet bg-surface p-4 text-[13px]">Violet 1.5 px on the one highlighted object on a screen. No left-edge-only borders.</div>
        </div>
      </Section>

      <Section id="components" title="Components">
        <Demos />
      </Section>

      <Section id="data" title="Data">
        <p className="max-w-[720px] text-ink-soft">
          Thin marks, 2 px gaps between segments, counts in words beside a bar, text in ink tokens never in series colour,
          a donut only per area and for the whole list, never two y-axes. Agreement per item: agree, different priority,
          disagree, unclear; the percent is agree over answered.
        </p>
        <div className="flex max-w-[560px] flex-col gap-3">
          {[
            ["Receipt photos", 60, 20, 20, "60%"],
            ["Split receipts", 40, 40, 20, "40%"],
            ["Policy flags", 40, 60, 0, "40%"],
          ].map(([name, a, p, u, pct]) => (
            <div key={name as string} className="grid grid-cols-[160px_1fr_48px] items-center gap-3 text-[13px]">
              <div>{name}</div>
              <div className="flex h-2.5 gap-[2px] overflow-hidden rounded-full bg-tint">
                <div className="bg-agree" style={{ width: a + "%" }} />
                <div className="bg-pushed" style={{ width: p + "%" }} />
                <div className="bg-unclear" style={{ width: u + "%" }} />
              </div>
              <div className="text-right font-mono text-xs">{pct}</div>
            </div>
          ))}
          <div className="flex gap-4 text-xs text-ink-muted">
            <span><span className="mr-1.5 inline-block size-2.5 rounded-sm bg-agree align-middle" />Agree</span>
            <span><span className="mr-1.5 inline-block size-2.5 rounded-sm bg-pushed align-middle" />Different priority</span>
            <span><span className="mr-1.5 inline-block size-2.5 rounded-sm bg-unclear align-middle" />Unclear</span>
          </div>
        </div>
      </Section>
    </main>
  );
}
