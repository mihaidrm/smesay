// A placeholder block while a part of a page loads its data (stories/E8-1, acceptance 5): the
// raised surface, the shape of what comes, a slow pulse that the reduced-motion rule in
// src/app/globals.css stops. Hidden from assistive technology; the region around it carries
// aria-busy. Added with E8-1 (design note 60).
import { cn } from "cn";

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("animate-pulse rounded-xl bg-raised", className)} />;
}
