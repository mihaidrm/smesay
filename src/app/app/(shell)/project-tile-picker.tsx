"use client";
// The project tile picker (stories/E3-8, decision 0066, design note 131): the tile in the
// Projects list is a button that opens a popover with the 24 icons of src/lib/project-icons.ts
// and the eight gradients of design note 126, the current pick marked, and Back to the
// initials. One press sets either and saves it at once through setTileAction; the popover
// stays open so the PM can set both, and closes on Escape (focus back on the tile), on Tab,
// on a press outside or on the tile again. The keyboard is the menu pattern of the WAI-ARIA
// Authoring Practices (w3.org/WAI/ARIA/apg/patterns/menu/): the arrow keys move between the
// items (src/lib/tile-picker.ts; the one with the focus is read from the menu's buttons in
// document order, which is the list's order), one item in the tab order at a time, Enter or Space presses
// the item (a button's own keys). The popover sits at a fixed position read from the tile when
// it opens, because the list's card clips what overflows it; a scroll or a resize closes it.
// The pick shows at once from local state (the tile pops once, .tile-pop in globals.css);
// router.refresh() then brings the server's row, and an error puts the saved values back
// with a line under the items.
import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "cn";
import { gradientAt, ProjectTile, TILE_NAMES } from "@/components/app/tiles";
import { PROJECT_ICONS } from "@/lib/project-icons";
import { PROJECTS_COPY } from "@/lib/projects-copy";
import { moveFocus, PICKER_COLUMNS, pickerItems } from "@/lib/tile-picker";
import { setTileAction } from "./projects/actions";

type Pick = { icon: string | null; tile: number | null };
const MOVES = new Set(["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp", "Home", "End"]);
const ITEM = "flex size-8 cursor-pointer items-center justify-center rounded-md outline-none transition-colors duration-150 hover:bg-tint focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-1 focus-visible:ring-offset-surface";
const RESET_AT = PROJECT_ICONS.length + TILE_NAMES.length;

export function ProjectTilePicker({ id, name, icon, tile }: { id: string; name: string; icon: string | null; tile: number | null }) {
  const router = useRouter();
  const [at, setAt] = useState<{ left: number; top: number } | null>(null);
  const [active, setActive] = useState(0);
  const [local, setLocal] = useState<Pick | null>(null);
  const [pops, setPops] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const items = pickerItems(PROJECTS_COPY.tile.reset);
  const shown: Pick = local ?? { icon, tile };
  const open = at !== null;

  useEffect(() => {
    if (!open) return;
    menu.current?.querySelectorAll<HTMLButtonElement>("[role=menuitemradio],[role=menuitem]")[active]?.focus();
  }, [open, active]);

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => { if (root.current && !root.current.contains(e.target as Node)) setAt(null); };
    const gone = () => setAt(null);
    document.addEventListener("pointerdown", away);
    window.addEventListener("scroll", gone, true);
    window.addEventListener("resize", gone);
    return () => {
      document.removeEventListener("pointerdown", away);
      window.removeEventListener("scroll", gone, true);
      window.removeEventListener("resize", gone);
    };
  }, [open]);

  const close = (refocus: boolean) => {
    setAt(null);
    if (refocus) trigger.current?.focus();
  };
  const show = () => {
    const r = trigger.current?.getBoundingClientRect();
    if (!r) return;
    const found = shown.icon ? PROJECT_ICONS.findIndex((i) => i.key === shown.icon) : -1;
    setActive(found < 0 ? 0 : found);
    setError(null);
    setAt({ left: r.left, top: r.bottom + 8 });
  };

  async function pick(next: Pick) {
    const before = shown;
    setLocal(next);
    setError(null);
    setPops((n) => n + 1);
    const result = await setTileAction(id, next.icon, next.tile);
    if (result.error) {
      setLocal(before);
      setError(result.error);
      return;
    }
    router.refresh();
  }

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close(true);
    } else if (e.key === "Tab") {
      setAt(null);
    } else if (MOVES.has(e.key)) {
      e.preventDefault();
      setActive(moveFocus(active, e.key, items.length, PICKER_COLUMNS));
    }
  };
  const item = (n: number, selected: boolean, extra?: string) => ({
    type: "button" as const,
    tabIndex: active === n ? 0 : -1,
    onFocus: () => setActive(n),
    className: cn(ITEM, selected && "bg-violet-soft text-violet", extra),
  });

  return (
    <div ref={root} className="flex">
      <button
        ref={trigger}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={PROJECTS_COPY.tile.choose(name)}
        onClick={() => (open ? close(true) : show())}
        onKeyDown={(e) => { if ((e.key === "ArrowDown" || e.key === "ArrowUp") && !open) { e.preventDefault(); show(); } }}
        className="cursor-pointer rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        data-testid="tile-button"
      >
        <ProjectTile key={pops} name={name} id={id} sample={false} icon={shown.icon} tile={shown.tile} className={pops > 0 ? "tile-pop" : undefined} />
      </button>
      {open && (
        <div ref={menu} id={menuId} role="menu" aria-label={PROJECTS_COPY.tile.choose(name)} onKeyDown={onKey} style={{ left: at.left, top: at.top }} className="fixed z-30 flex w-[308px] flex-col gap-3 rounded-xl border border-hairline bg-surface p-3 shadow-card" data-testid="tile-picker">
          <div role="group" aria-label={PROJECTS_COPY.tile.icons} className="flex flex-col gap-1.5">
            <div aria-hidden="true" className="text-[11px] font-semibold tracking-[0.04em] text-ink-muted uppercase">{PROJECTS_COPY.tile.icons}</div>
            <div className="grid grid-cols-8 gap-1">
              {PROJECT_ICONS.map((i, n) => (
                <button key={i.key} role="menuitemradio" aria-checked={shown.icon === i.key} aria-label={i.label} onClick={() => pick({ ...shown, icon: i.key })} data-icon={i.key} {...item(n, shown.icon === i.key)}>
                  <i.Icon size={16} strokeWidth={2.25} aria-hidden="true" />
                </button>
              ))}
            </div>
          </div>
          <div role="group" aria-label={PROJECTS_COPY.tile.colours} className="flex flex-col gap-1.5">
            <div aria-hidden="true" className="text-[11px] font-semibold tracking-[0.04em] text-ink-muted uppercase">{PROJECTS_COPY.tile.colours}</div>
            <div className="grid grid-cols-8 gap-1">
              {TILE_NAMES.map((label, k) => (
                <button key={label} role="menuitemradio" aria-checked={shown.tile === k} aria-label={label} onClick={() => pick({ ...shown, tile: k })} data-tile={k} {...item(PROJECT_ICONS.length + k, false, "hover:bg-transparent hover:opacity-80")}>
                  <span aria-hidden="true" className="flex size-6 items-center justify-center rounded-md text-[#15131F]" style={{ background: gradientAt(k) }}>
                    {shown.tile === k && <Check size={14} strokeWidth={3} />}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <button role="menuitem" onClick={() => pick({ ...shown, icon: null })} {...item(RESET_AT, false, "w-full justify-start px-2 text-[13px] font-semibold text-ink")}>
            {PROJECTS_COPY.tile.reset}
          </button>
          {error && <p role="alert" className="text-[13px] text-danger">{error}</p>}
        </div>
      )}
    </div>
  );
}
