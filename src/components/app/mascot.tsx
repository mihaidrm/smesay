// The mascot (decision 0041; docs/assets.md row 1, placed 2026-10-03): one bought character,
// the round-headed robot of the Robot Vector Collection (Craftwork, commercial licence in
// public/assets/mascot/LICENCE.txt), in four poses: "hi" greets (sign-in, the landing hero,
// the respondent thank-you), "idea" gives a tip (the Projects empty state), "reading" reads
// the list (Import), "analysis" shows a chart (Results). The yellows of the pack are
// recoloured to the brand violet in the files. It sits on a light disc in both modes, so its
// dark outlines read on the dark surface too. Decorative: the alt is empty and the page
// text carries the meaning. Design note 37.
import { cn } from "cn";

export type MascotPose = "hi" | "idea" | "reading" | "analysis";

export function Mascot({ pose, size = 88, className }: { pose: MascotPose; size?: number; className?: string }) {
  return (
    <span
      data-testid="mascot"
      data-pose={pose}
      className={cn("flex shrink-0 items-center justify-center rounded-full border border-[#E6E3F0] bg-[#F7F6FB] shadow-card", className)}
      style={{ width: size, height: size }}
    >
      {/* A plain img: the file is the app's own static asset at one size, nothing for next/image to resize or host. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/assets/mascot/${pose}.svg`} alt="" width={Math.round(size * 0.82)} height={Math.round(size * 0.82)} draggable={false} />
    </span>
  );
}
