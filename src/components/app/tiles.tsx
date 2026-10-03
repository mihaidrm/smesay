// The small coloured tiles of design v2 (the PM app board; design note 34): the workspace's
// initials on a coral to sun gradient in the sidebar chip, a project's tile in the list (one
// of four gradients picked by the name, so a project keeps its colour; the sample's is a
// dashed outline because it is not the workspace's own), and the stat tile with its number at
// 30 px in ink or in a text colour (the solids are decorative only, docs/design-system.md). Decorative colour only: the name is always written beside it.
import { cn } from "cn";

const GRADIENTS = [
  "linear-gradient(135deg,#FF8A78,#FFD36E)",
  "linear-gradient(135deg,#9B86FF,#5FD3B3)",
  "linear-gradient(135deg,#7A5CFF,#FF8A78)",
  "linear-gradient(135deg,#5FD3B3,#FFD36E)",
];

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  // Code points, not UTF-16 units, so a name that starts with an emoji keeps it whole.
  const first = Array.from(parts[0] ?? "W");
  const letters = parts.length >= 2 ? first[0] + Array.from(parts[1])[0] : first.slice(0, 2).join("");
  return letters.toUpperCase();
}

export function gradientFor(name: string): string {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return GRADIENTS[h % GRADIENTS.length];
}

export function WorkspaceTile({ name }: { name: string }) {
  return (
    <span aria-hidden="true" className="flex size-[30px] shrink-0 items-center justify-center rounded-lg text-xs font-extrabold text-[#15131F]" style={{ background: GRADIENTS[0] }}>
      {initials(name)}
    </span>
  );
}

export function ProjectTile({ name, sample }: { name: string; sample: boolean }) {
  if (sample) return <span aria-hidden="true" className="block size-8 shrink-0 rounded-lg border border-dashed border-hairline-strong bg-raised" />;
  return <span aria-hidden="true" className="block size-8 shrink-0 rounded-lg" style={{ background: gradientFor(name) }} />;
}

export function StatTile({ value, label, tone = "ink", className }: { value: string | number; label: string; tone?: "ink" | "mint" | "violet" | "sun"; className?: string }) {
  const colour = { ink: "text-ink", mint: "text-mint-text", violet: "text-violet-text", sun: "text-sun-text" }[tone];
  return (
    <div className={cn("card flex flex-1 flex-col gap-1.5 px-5 py-[18px]", className)} data-testid="stat-tile">
      <span className={cn("font-mono text-[30px] font-extrabold leading-9 tracking-[-0.03em]", colour)}>{value}</span>
      <span className="text-[13px] text-ink-muted">{label}</span>
    </div>
  );
}
