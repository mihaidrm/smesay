"use client";
// The landing page's header (Mihai, 2026-10-05: "I would like the nav to be sticky so when you
// scroll down the page you can still see the nav"). It is sticky at the top (position: sticky,
// developer.mozilla.org/docs/Web/CSS/position) and sits over the hero, which keeps the space
// under it. At the top of the page it is transparent, so the hero looks as before; once the
// page has scrolled it takes the navy with a blur and a hairline, so it reads over the light
// sections too. The scroll position is read on scroll (developer.mozilla.org/docs/Web/API/
// Document/scroll_event, passive). The children (the logo and the nav) are rendered on the
// server.
import { useEffect, useState } from "react";
import { cn } from "cn";

export function StickyHeader({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const read = () => setScrolled(window.scrollY > 8);
    read();
    window.addEventListener("scroll", read, { passive: true });
    return () => window.removeEventListener("scroll", read);
  }, []);
  return (
    <header className={cn("sticky top-0 z-30 -mb-[76px] border-b text-[#F3F1FA] transition-[background-color,border-color,box-shadow] duration-200 motion-reduce:transition-none", scrolled ? "border-white/10 bg-[#16152A]/90 shadow-[0_8px_30px_rgba(22,21,42,0.25)] backdrop-blur-md" : "border-transparent bg-transparent")} data-scrolled={scrolled || undefined} data-testid="landing-header">
      {children}
    </header>
  );
}
