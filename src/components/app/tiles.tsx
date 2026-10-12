// The small coloured tiles of design v2 (the PM app board; design note 34): the workspace's
// initials on a coral to sun gradient in the sidebar chip, a project's initials on one of eight
// gradients in the list (design note 126; picked by the project's id, so a project keeps its
// colour through a rename, and the sample's in muted ink on a dashed outline because it is not
// the workspace's own), or the icon and the gradient the PM picked (stories/E3-8, decision
// 0066: project.icon, a key of src/lib/project-icons.ts, and project.tile, a gradient's index),
// at 32 px in the list and 24 px in the project header, and the stat tile with its number at 30 px in ink or in a text colour
// (the solids are decorative only, docs/design-system.md). Decorative colour only: the name is
// always written beside it, and the tiles are hidden from assistive technology.
import { cn } from "cn";
import { projectIcon } from "@/lib/project-icons";

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
// The gradients' names, the picker's accessible names for the colours (stories/E3-8).
export const TILE_NAMES = ["Coral to sun", "Lavender to mint", "Coral to lavender", "Mint to sun", "Sun to lavender", "Mint to coral", "Coral, soft", "Mint, soft"] as const;
export const isTileIndex = (n: unknown): n is number => typeof n === "number" && Number.isInteger(n) && n >= 0 && n < GRADIENTS.length;
export const gradientAt = (i: number): string => GRADIENTS[i];
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

// The look of a project's tile: the PM's gradient or the id's, the PM's icon or none.
export function tileLook(p: { id: string; icon?: string | null; tile?: number | null }): { gradient: string; icon: ReturnType<typeof projectIcon> } {
  return { gradient: isTileIndex(p.tile) ? gradientAt(p.tile) : gradientFor(p.id), icon: projectIcon(p.icon) };
}

export type ProjectTileProps = { name: string; id: string; sample: boolean; icon?: string | null; tile?: number | null; size?: "md" | "sm"; className?: string };

export function ProjectTile({ name, id, sample, icon = null, tile = null, size = "md", className }: ProjectTileProps) {
  const shape = cn("flex shrink-0 items-center justify-center rounded-lg font-extrabold", size === "md" ? "size-8 text-xs" : "size-6 rounded-md text-[10px]", className);
  if (sample) return <span aria-hidden="true" className={cn(shape, "border border-dashed border-hairline-strong bg-raised text-ink-muted")} data-testid="project-tile">{initials(name)}</span>;
  const look = tileLook({ id, icon, tile });
  return (
    <span aria-hidden="true" className={shape} style={{ background: look.gradient, color: INK }} data-testid="project-tile" data-icon={look.icon?.key} data-tile={isTileIndex(tile) ? tile : undefined}>
      {look.icon ? <look.icon.Icon size={size === "md" ? 18 : 14} strokeWidth={2.25} aria-hidden="true" /> : initials(name)}
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
