"use client";
// A sidebar nav item (the PM app board, design v2): an icon and a label on a 40 px pill with
// radius 12; the item of the current page sits on the violet soft fill in violet text. Active
// means the path is the item's or under it, except for the project list, which is active on
// /app alone. Client component for usePathname (node_modules/next/dist/docs/01-app/
// 03-api-reference/04-functions/use-pathname.md). New to the design system: design note 34.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";

export function NavLink({ href, exact = false, icon, children }: { href: string; exact?: boolean; icon: React.ReactNode; children: React.ReactNode }) {
  const path = usePathname();
  const active = exact ? path === href : path === href || path.startsWith(href + "/");
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface [&_svg]:size-[18px] [&_svg]:shrink-0",
        active ? "bg-violet-soft text-violet-text" : "text-ink-muted hover:bg-tint hover:text-ink",
      )}
    >
      {icon}
      {children}
    </Link>
  );
}
