// The small coloured tiles of design v2 (the PM app board; design note 34): the workspace's
// initials on a coral to sun gradient in the sidebar chip, a project's initials on one of eight
// gradients in the list (design note 126; picked by the project's id, so a project keeps its
// colour through a rename, and the sample's in muted ink on a dashed outline because it is not
// the workspace's own), and the stat tile with its number at 30 px in ink or in a text colour
// (the solids are decorative only, docs/design-system.md). Decorative colour only: the name is
// always written beside it, and the tiles are hidden from assistive technology.
import { cn } from "cn";

// The palette's lifted tones (coral, sun, mint, lavender; the dark mode's values of the
// tokens in globals.css) in their six pairs, then coral and mint fading to their soft tints.
// The light violet of the old third gradient (#7A5CFF) is out: the dark ink of the initials
// read at 4.19 on it; on these it reads at 4.5 or better on every stop and every midpoint
// (tiles.test.ts; WCAG 2.1, 1.4.3).
export const TILE_STOPS: [string, string][] = [
  ["#FF8A78", "#FFD36E"],
  ["#9B86FF", "#5FD3B3"],
  ["#FF8A78", "#9B86FF"],
  ["#5FD3B3", "#FFD36E"],
  ["#FFD36E", "#9B86FF"],
  ["#5FD3B3", "#FF8A78"],
  ["#FF8A78", "#FFE9E5"],
  ["#5FD3B3", "#E1F5EE"],
];
const GRADIENTS = TILE_STOPS.map(([a, b]) => `linear-gradient(135deg,${a},${b})`);
const INK = "#15131F";

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  // Code points, not UTF-16 units, so a name that starts with an emoji keeps it whole.
  const first = Array.from(parts[0] ?? "W");
  const letters = parts.length >= 2 ? first[0] + Array.from(parts[1])[0] : first.slice(0, 2).join("");
  return letters.toUpperCase();
}

// FNV-1a, 32 bit (offset basis 2166136261, prime 16777619: isthe.com/chongo/tech/comp/fnv),
// over the key's UTF-16 units. The hash before it (h * 31 + c, modulo 4) put "YES", "Test 1"
// and "BBC" on one gradient: 31 is 3 modulo 4, so the bucket was only the alternating sum of
// the character codes modulo 4 (design note 126).
export function gradientFor(key: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 0x01000193) >>> 0;
  return GRADIENTS[h % GRADIENTS.length];
}

export function WorkspaceTile({ name }: { name: string }) {
  return (
    <span aria-hidden="true" className="flex size-[30px] shrink-0 items-center justify-center rounded-lg text-xs font-extrabold" style={{ background: GRADIENTS[0], color: INK }}>
      {initials(name)}
    </span>
  );
}

export function ProjectTile({ name, id, sample }: { name: string; id: string; sample: boolean }) {
  const shape = "flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-extrabold";
  if (sample) return <span aria-hidden="true" className={cn(shape, "border border-dashed border-hairline-strong bg-raised text-ink-muted")} data-testid="project-tile">{initials(name)}</span>;
  return (
    <span aria-hidden="true" className={shape} style={{ background: gradientFor(id), color: INK }} data-testid="project-tile">
      {initials(name)}
    </span>
  );
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
